import { prisma } from "@/lib/prisma";

export async function createVersion(
  requirementId: string,
  prdMarkdown: string,
  changeReason: string
) {
  const versionCount = await prisma.requirementVersion.count({
    where: { requirementId },
  });
  return prisma.requirementVersion.create({
    data: {
      requirementId,
      versionNo: versionCount + 1,
      prdMarkdown,
      changeReason,
    },
  });
}
