import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const customerId = searchParams.get("customerId");
    const keyword = searchParams.get("keyword");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const allowedSortFields = ["createdAt", "updatedAt", "priority", "status", "title"];
    const orderBy = { [allowedSortFields.includes(sortBy) ? sortBy : "updatedAt"]: sortOrder };

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (customerId) where.customerId = customerId;

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { rawInput: { contains: keyword } },
        { scenario: { contains: keyword } },
        { extractedJson: { contains: keyword } },
        { customer: { name: { contains: keyword } } },
        { customer: { company: { contains: keyword } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    const [requirements, total] = await Promise.all([
      prisma.requirement.findMany({
        where,
        include: { customer: true, _count: { select: { comments: true } } },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.requirement.count({ where }),
    ]);

    return Response.json({ items: requirements, total, page, pageSize });
  } catch (error) {
    console.error("List requirements error:", error);
    return Response.json({ error: "获取需求列表失败" }, { status: 500 });
  }
}
