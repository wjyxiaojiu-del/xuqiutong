import { prisma } from "@/lib/prisma";

export async function GET() {
  const [total, statusCounts, priorityCounts, recentRequirements] =
    await Promise.all([
      prisma.requirement.count(),
      prisma.requirement.groupBy({ by: ["status"], _count: true }),
      prisma.requirement.groupBy({ by: ["priority"], _count: true }),
      prisma.requirement.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: { customer: true },
      }),
    ]);

  return Response.json({
    total,
    byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    byPriority: Object.fromEntries(priorityCounts.map((p) => [p.priority, p._count])),
    recent: recentRequirements,
  });
}
