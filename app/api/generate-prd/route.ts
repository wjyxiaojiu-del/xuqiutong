import { NextRequest } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { enqueueAiJob } from "@/lib/ai/jobs";
import { prisma } from "@/lib/prisma";
import { createVersion } from "@/lib/version";
import { z } from "zod";

const Schema = z.object({ requirementId: z.string() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const useAsync = request.nextUrl.searchParams.get("async") === "true";
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "缺少 requirementId" }, { status: 400 });
    }

    const req = await prisma.requirement.findUnique({
      where: { id: parsed.data.requirementId },
    });
    if (!req) {
      return Response.json({ error: "需求不存在" }, { status: 404 });
    }
    if (!req.extractedJson) {
      return Response.json({ error: "请先完成萃取" }, { status: 400 });
    }

    // 异步模式
    if (useAsync) {
      const jobId = await enqueueAiJob(req.id, "generate");
      return Response.json({ id: req.id, jobId, async: true });
    }

    const provider = getAIProvider();
    let prd: string, mermaid: string;
    try {
      const extractedStr = typeof req.extractedJson === "string" ? req.extractedJson : JSON.stringify(req.extractedJson);
      const result = await provider.generatePRD(extractedStr);
      prd = result.prd;
      mermaid = result.mermaid;
    } catch (aiError) {
      const msg = aiError instanceof Error ? aiError.message : String(aiError);
      console.error(`AI generatePRD failed (${provider.name}):`, msg);

      if (msg.includes("401") || msg.includes("403")) {
        return Response.json({ error: `AI API Key 无效 (${provider.name})` }, { status: 502 });
      }
      if (msg.includes("429")) {
        return Response.json({ error: `AI API 频率超限，请稍后重试` }, { status: 429 });
      }
      return Response.json({ error: `PRD 生成失败 (${provider.name})：${msg.slice(0, 100)}` }, { status: 502 });
    }

    await prisma.requirement.update({
      where: { id: req.id },
      data: {
        prdMarkdown: prd,
        mermaidCode: mermaid,
        status: "prd_generated",
      },
    });

    // Save version
    const reason = req.prdMarkdown ? "PRD 重新生成" : "PRD 生成";
    await createVersion(req.id, prd, reason);

    return Response.json({ id: req.id, prd, mermaid });
  } catch (error) {
    console.error("Generate PRD error:", error);
    return Response.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
