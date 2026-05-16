import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        requirements: {
          include: { _count: { select: { comments: true } } },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!customer) {
      return Response.json({ error: "客户不存在" }, { status: 404 });
    }

    return Response.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);
    return Response.json({ error: "获取客户信息失败" }, { status: 500 });
  }
}
