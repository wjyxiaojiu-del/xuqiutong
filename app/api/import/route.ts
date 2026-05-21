import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueBatch } from "@/lib/ai/jobs";
import { z } from "zod";

const ImportItemSchema = z.object({
  rawInput: z.string().min(1),
  customerName: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  contactName: z.string().optional(),
  scenario: z.string().optional(),
});

const ImportSchema = z.object({
  items: z.array(ImportItemSchema).min(1, "至少需要一条需求"),
  extractMode: z.enum(["none", "auto"]).default("none"),
});

async function findOrCreateCustomer(
  customerName?: string,
  company?: string,
  industry?: string,
  contactName?: string
): Promise<string | null> {
  if (!customerName && !company) return null;

  // Try to find existing customer by name + company
  if (customerName && company) {
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { name: customerName, company },
          { contactName: customerName, company },
        ],
      },
    });
    if (existing) return existing.id;
  }

  // Create new customer
  const customer = await prisma.customer.create({
    data: {
      name: customerName || company || "未知客户",
      company: company || "",
      industry: industry || "",
      contactName: contactName || customerName || "",
    },
  });
  return customer.id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ImportSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "数据格式不正确", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, extractMode } = parsed.data;
    const results: { id: string; title: string }[] = [];

    for (const item of items) {
      const customerId = await findOrCreateCustomer(
        item.customerName,
        item.company,
        item.industry,
        item.contactName
      );

      // Generate a title from the raw input
      const title =
        item.rawInput.length > 30
          ? item.rawInput.slice(0, 30) + "..."
          : item.rawInput;

      const requirement = await prisma.requirement.create({
        data: {
          customerId,
          title,
          rawInput: item.rawInput,
          sourceType: "import",
          scenario: item.scenario || "",
          status: extractMode === "auto" ? "pending" : "extracted",
          priority: "P1",
        },
      });

      // 创建 customer link（用于影响评分）
      if (customerId) {
        await prisma.requirementCustomer.create({
          data: {
            requirementId: requirement.id,
            customerId,
          },
        });
      }

      results.push({ id: requirement.id, title });
    }

    // auto 模式：批量创建 AI 萃取任务
    let jobIds: string[] = [];
    if (extractMode === "auto" && results.length > 0) {
      jobIds = await enqueueBatch(results.map((r) => r.id), "extract");
    }

    return Response.json({
      success: true,
      count: results.length,
      requirements: results,
      autoExtract: extractMode === "auto",
      jobIds: jobIds.length > 0 ? jobIds : undefined,
      message: extractMode === "auto"
        ? `已导入 ${results.length} 条需求，后台正在自动萃取`
        : `已导入 ${results.length} 条需求`,
    });
  } catch (error) {
    console.error("Import error:", error);
    return Response.json({ error: "导入失败" }, { status: 500 });
  }
}
