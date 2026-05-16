import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVersion } from "@/lib/version";
import { z } from "zod";

const Schema = z.object({ versionId: z.string().min(1) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "缺少 versionId" }, { status: 400 });
  }

  const version = await prisma.requirementVersion.findUnique({
    where: { id: parsed.data.versionId },
  });
  if (!version) {
    return Response.json({ error: "版本不存在" }, { status: 404 });
  }

  const requirement = await prisma.requirement.findUnique({ where: { id } });
  if (!requirement) {
    return Response.json({ error: "需求不存在" }, { status: 404 });
  }

  // Restore the PRD markdown from the selected version
  await prisma.requirement.update({
    where: { id },
    data: { prdMarkdown: version.prdMarkdown },
  });

  // Save a new version recording the rollback
  await createVersion(id, version.prdMarkdown, `回滚至版本 v${version.versionNo}`);

  return Response.json({ success: true, versionNo: version.versionNo });
}
