import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: { select: { requirements: true } },
        requirements: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { updatedAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json(customers);
  } catch (error) {
    console.error("List customers error:", error);
    return Response.json({ error: "获取客户列表失败" }, { status: 500 });
  }
}
