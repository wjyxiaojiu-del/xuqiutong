import { prisma } from "@/lib/prisma";

export async function createVersion(
  requirementId: string,
  prdMarkdown: string,
  changeReason: string
) {
  return prisma.$transaction(async (tx) => {
    // 事务内锁定计数，避免并发重复版本号
    const versionCount = await tx.requirementVersion.count({
      where: { requirementId },
    });
    return tx.requirementVersion.create({
      data: {
        requirementId,
        versionNo: versionCount + 1,
        prdMarkdown,
        changeReason,
      },
    });
  });
}
