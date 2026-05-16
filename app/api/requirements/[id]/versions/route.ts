import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const versions = await prisma.requirementVersion.findMany({
    where: { requirementId: id },
    orderBy: { versionNo: "desc" },
    select: {
      id: true,
      versionNo: true,
      changeReason: true,
      createdAt: true,
    },
  });

  return Response.json({ versions });
}
