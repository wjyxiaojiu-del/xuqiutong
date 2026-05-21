/**
 * AI 后台任务管理器
 * - 创建任务 → 立即返回 jobId
 * - 后台执行 → 更新状态
 * - 前端轮询 → 查结果
 */
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";

type JobType = "extract" | "generate";

/**
 * 创建并立即执行 AI 任务（后台运行，不阻塞 HTTP）
 */
export async function enqueueAiJob(
  requirementId: string,
  type: JobType
): Promise<string> {
  const job = await prisma.aiJob.create({
    data: {
      requirementId,
      type,
      status: "queued",
    },
  });

  // 异步执行，不 await
  executeJob(job.id, requirementId, type).catch((err) => {
    console.error(`[AiJob ${job.id}] 执行异常:`, err);
  });

  return job.id;
}

/**
 * 批量入队
 */
export async function enqueueBatch(
  requirementIds: string[],
  type: JobType
): Promise<string[]> {
  const jobs = await prisma.aiJob.createManyAndReturn({
    data: requirementIds.map((id) => ({
      requirementId: id,
      type,
      status: "queued" as const,
    })),
    select: { id: true },
  });

  // 逐个异步执行
  for (const job of jobs) {
    const reqId = requirementIds[jobs.indexOf(job)];
    executeJob(job.id, reqId, type).catch((err) => {
      console.error(`[AiJob ${job.id}] 执行异常:`, err);
    });
  }

  return jobs.map((j) => j.id);
}

/**
 * 查询任务状态
 */
export async function getJobStatus(jobId: string) {
  return prisma.aiJob.findUnique({
    where: { id: jobId },
    include: { requirement: { select: { id: true, title: true, status: true } } },
  });
}

/**
 * 查询需求关联的所有任务
 */
export async function getJobsForRequirement(requirementId: string) {
  return prisma.aiJob.findMany({
    where: { requirementId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// ── 内部执行逻辑 ──

async function executeJob(jobId: string, requirementId: string, type: JobType) {
  const provider = getAIProvider();

  // 标记 running
  await prisma.aiJob.update({
    where: { id: jobId },
    data: { status: "running", startedAt: new Date(), provider: provider.name },
  });

  // 需求状态标记
  if (type === "extract") {
    await prisma.requirement.update({
      where: { id: requirementId },
      data: { status: "extracting" },
    });
  }

  try {
    const req = await prisma.requirement.findUnique({ where: { id: requirementId } });
    if (!req) throw new Error("需求不存在");

    if (type === "extract") {
      const extracted = await provider.extract(req.rawInput, req.scenario);
      await prisma.requirement.update({
        where: { id: requirementId },
        data: {
          title: extracted.title,
          extractedJson: extracted,
          priority: extracted.priority,
          status: "extracted",
          aiModel: provider.name,
        },
      });
      await prisma.aiJob.update({
        where: { id: jobId },
        data: { status: "succeeded", finishedAt: new Date(), result: extracted as unknown as Record<string, string> },
      });
    } else {
      const extractedStr = typeof req.extractedJson === "string" ? req.extractedJson : JSON.stringify(req.extractedJson);
      const result = await provider.generatePRD(extractedStr);
      await prisma.requirement.update({
        where: { id: requirementId },
        data: {
          prdMarkdown: result.prd,
          mermaidCode: result.mermaid,
          status: "prd_generated",
        },
      });
      // 自动创建版本
      const { createVersion } = await import("@/lib/version");
      const reason = req.prdMarkdown ? "PRD 重新生成" : "PRD 生成";
      await createVersion(requirementId, result.prd, reason);

      await prisma.aiJob.update({
        where: { id: jobId },
        data: { status: "succeeded", finishedAt: new Date(), result: { prd: result.prd.slice(0, 500), mermaid: result.mermaid } as unknown as Record<string, string> },
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[AiJob ${jobId}] 失败:`, msg);

    await prisma.aiJob.update({
      where: { id: jobId },
      data: { status: "failed", finishedAt: new Date(), error: msg.slice(0, 500) },
    });

    // 需求状态回退
    const failStatus = type === "extract" ? "failed" : "extracted";
    await prisma.requirement.update({
      where: { id: requirementId },
      data: { status: failStatus },
    });
  }
}
