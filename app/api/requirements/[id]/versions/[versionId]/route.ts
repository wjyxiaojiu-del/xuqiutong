import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { versionId } = await params;

  const version = await prisma.requirementVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    return Response.json({ error: "版本不存在" }, { status: 404 });
  }

  return Response.json(version);
}
