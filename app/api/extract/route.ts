import { NextRequest } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { enqueueAiJob } from "@/lib/ai/jobs";
import { prisma } from "@/lib/prisma";
import { CreateRequirementSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const useAsync = request.nextUrl.searchParams.get("async") === "true";

    // 重试模式：传 requirementId 重新萃取已有需求
    if (body.requirementId) {
      const existing = await prisma.requirement.findUnique({
        where: { id: body.requirementId },
      });
      if (!existing) {
        return Response.json({ error: "需求不存在" }, { status: 404 });
      }

      const provider = getAIProvider();
      let extracted;
      try {
        extracted = await provider.extract(existing.rawInput, existing.scenario);
      } catch (aiError) {
        const msg = aiError instanceof Error ? aiError.message : String(aiError);
        console.error(`AI retry extract failed (${provider.name}):`, msg);
        await prisma.requirement.update({
          where: { id: existing.id },
          data: { status: "failed" },
        });
        return Response.json(
          { error: `AI 萃取失败 (${provider.name})：${msg.slice(0, 100)}`, id: existing.id },
          { status: 502 }
        );
      }

      await prisma.requirement.update({
        where: { id: existing.id },
        data: {
          title: extracted.title,
          extractedJson: extracted,
          priority: extracted.priority,
          status: "extracted",
          aiModel: provider.name,
        },
      });

      return Response.json({ id: existing.id, extracted });
    }

    // 新建模式
    const parsed = CreateRequirementSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { rawInput, customerName, company, industry, contactName, scenario, sourceType } =
      parsed.data;

    // Find or create customer
    let customerId: string | undefined;
    if (customerName) {
      const existing = await prisma.customer.findFirst({
        where: {
          name: customerName,
          company: company || "",
        },
      });
      if (existing) {
        customerId = existing.id;
      } else {
        const customer = await prisma.customer.create({
          data: {
            name: customerName,
            company: company || "",
            industry: industry || "",
            contactName: contactName || "",
          },
        });
        customerId = customer.id;
      }
    }

    // Create requirement
    const requirement = await prisma.requirement.create({
      data: {
        rawInput,
        customerId,
        scenario: scenario || "",
        sourceType: sourceType || "text",
        status: "pending",
      },
    });

    // 创建 customer link（用于影响评分）
    if (customerId) {
      await prisma.requirementCustomer.create({
        data: {
          requirementId: requirement.id,
          customerId,
        },
      });
    }

    // 异步模式：创建后台任务立即返回
    if (useAsync) {
      const jobId = await enqueueAiJob(requirement.id, "extract");
      return Response.json({ id: requirement.id, jobId, async: true });
    }

    // 同步模式：等待 AI 返回
    const provider = getAIProvider();
    let extracted;
    try {
      extracted = await provider.extract(rawInput, scenario);
    } catch (aiError) {
      const msg = aiError instanceof Error ? aiError.message : String(aiError);
      console.error(`AI extract failed (${provider.name}):`, msg);

      await prisma.requirement.update({
        where: { id: requirement.id },
        data: { status: "failed" },
      });

      if (msg.includes("401") || msg.includes("403")) {
        return Response.json(
          { error: `AI API Key 无效 (${provider.name})，请检查环境变量配置`, id: requirement.id },
          { status: 502 }
        );
      }
      if (msg.includes("429")) {
        return Response.json(
          { error: `AI API 调用频率超限 (${provider.name})，请稍后重试`, id: requirement.id },
          { status: 429 }
        );
      }
      if (msg.includes("timeout") || msg.includes("Timeout")) {
        return Response.json(
          { error: `AI 响应超时 (${provider.name})，请稍后重试`, id: requirement.id },
          { status: 504 }
        );
      }
      return Response.json(
        { error: `AI 萃取失败 (${provider.name})：${msg.slice(0, 100)}`, id: requirement.id },
        { status: 502 }
      );
    }

    // Update requirement with extracted data
    await prisma.requirement.update({
      where: { id: requirement.id },
      data: {
        title: extracted.title,
        extractedJson: extracted,
        priority: extracted.priority,
        status: "extracted",
        aiModel: provider.name,
      },
    });

    return Response.json({ id: requirement.id, extracted });
  } catch (error) {
    console.error("Extract error:", error);
    return Response.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
