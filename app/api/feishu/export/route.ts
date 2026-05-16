import { NextRequest } from "next/server";
import { createDocument } from "@/lib/integrations/feishu";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  requirementId: z.string().min(1, "需求ID不能为空"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { requirementId } = parsed.data;

    // 获取需求数据
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      return Response.json({ error: "需求不存在" }, { status: 404 });
    }

    if (!requirement.prdMarkdown) {
      return Response.json(
        { error: "PRD 未生成，请先生成 PRD" },
        { status: 400 }
      );
    }

    // 构建文档内容
    const content = requirement.prdMarkdown;

    // 创建飞书文档
    const doc = await createDocument(
      requirement.title || "需求文档",
      content
    );

    return Response.json({
      documentId: doc.documentId,
      url: doc.url,
      title: doc.title,
    });
  } catch (error) {
    console.error("Feishu export error:", error);
    const msg = error instanceof Error ? error.message : "导出失败";
    return Response.json({ error: msg }, { status: 500 });
  }
}
