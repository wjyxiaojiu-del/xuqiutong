import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExtractedSchema } from "@/lib/schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate the extracted data
    const parsed = ExtractedSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "数据格式不正确", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.requirement.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "需求不存在" }, { status: 404 });
    }

    await prisma.requirement.update({
      where: { id },
      data: {
        title: parsed.data.title,
        extractedJson: JSON.stringify(parsed.data),
        priority: parsed.data.priority,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Update extracted error:", error);
    return Response.json({ error: "更新失败" }, { status: 500 });
  }
}
