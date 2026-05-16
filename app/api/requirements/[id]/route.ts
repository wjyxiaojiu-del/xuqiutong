import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateStatusSchema, STATUS_TRANSITIONS } from "@/lib/schemas";
import { createVersion } from "@/lib/version";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const req = await prisma.requirement.findUnique({
    where: { id },
    include: { customer: true, comments: true, versions: true },
  });
  if (!req) {
    return Response.json({ error: "需求不存在" }, { status: 404 });
  }
  return Response.json(req);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.requirement.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "需求不存在" }, { status: 404 });
  }

  // 状态流转校验
  const allowed = STATUS_TRANSITIONS[existing.status] || [];
  if (!allowed.includes(parsed.data.status)) {
    return Response.json(
      { error: `不允许从 "${existing.status}" 转为 "${parsed.data.status}"` },
      { status: 400 }
    );
  }

  // If rejecting, save current version
  if (parsed.data.status === "rejected" && existing.prdMarkdown) {
    await createVersion(id, existing.prdMarkdown, parsed.data.rejectReason || "驳回");
  }

  const updated = await prisma.requirement.update({
    where: { id },
    data: {
      status: parsed.data.status,
      rejectReason: parsed.data.rejectReason || "",
    },
  });

  return Response.json(updated);
}
