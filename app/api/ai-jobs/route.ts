import { NextRequest } from "next/server";
import { enqueueAiJob, enqueueBatch, getJobsForRequirement } from "@/lib/ai/jobs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateJobSchema = z.object({
  requirementId: z.string(),
  type: z.enum(["extract", "generate"]),
});

const BatchJobSchema = z.object({
  requirementIds: z.array(z.string()).min(1).max(100),
  type: z.enum(["extract", "generate"]),
});

/**
 * POST /api/ai-jobs — 创建单个 AI 任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 批量模式
    if (Array.isArray(body.requirementIds)) {
      const parsed = BatchJobSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const jobIds = await enqueueBatch(parsed.data.requirementIds, parsed.data.type);
      return Response.json({ jobIds, count: jobIds.length });
    }

    // 单个模式
    const parsed = CreateJobSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const jobId = await enqueueAiJob(parsed.data.requirementId, parsed.data.type);
    return Response.json({ jobId });
  } catch (error) {
    console.error("Create AI job error:", error);
    return Response.json({ error: "创建任务失败" }, { status: 500 });
  }
}

/**
 * GET /api/ai-jobs?requirementId=xxx — 查询需求的任务列表
 * GET /api/ai-jobs?jobId=xxx — 查询单个任务状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const jobId = searchParams.get("jobId");
    const requirementId = searchParams.get("requirementId");

    if (jobId) {
      const job = await prisma.aiJob.findUnique({
        where: { id: jobId },
        include: { requirement: { select: { id: true, title: true, status: true } } },
      });
      if (!job) return Response.json({ error: "任务不存在" }, { status: 404 });
      return Response.json(job);
    }

    if (requirementId) {
      const jobs = await getJobsForRequirement(requirementId);
      return Response.json({ jobs });
    }

    // 列出最近 50 个任务
    const jobs = await prisma.aiJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { requirement: { select: { id: true, title: true } } },
    });
    return Response.json({ jobs });
  } catch (error) {
    console.error("Query AI jobs error:", error);
    return Response.json({ error: "查询失败" }, { status: 500 });
  }
}
