import { NextRequest } from "next/server";
import { fetchDocument } from "@/lib/integrations/feishu";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  url: z.string().min(1, "请输入飞书文档链接"),
  customerName: z.string().optional(),
  company: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { url, customerName, company } = parsed.data;

    // 验证是否是飞书链接
    if (!url.includes("feishu.cn") && !url.includes("larksuite.com")) {
      return Response.json(
        { error: "请输入有效的飞书文档链接" },
        { status: 400 }
      );
    }

    // 获取文档内容
    const doc = await fetchDocument(url);

    if (!doc.content || doc.content.trim().length === 0) {
      return Response.json(
        { error: "文档内容为空" },
        { status: 400 }
      );
    }

    // 查找或创建客户
    let customerId: string | undefined;
    if (customerName) {
      const existing = await prisma.customer.findFirst({
        where: {
          name: customerName,
          company: company || "",
        },
      });
      if (existing) {
        customerId = existing.id;
      } else {
        const customer = await prisma.customer.create({
          data: {
            name: customerName,
            company: company || "",
          },
        });
        customerId = customer.id;
      }
    }

    // 创建需求
    const requirement = await prisma.requirement.create({
      data: {
        title: doc.title || `飞书文档导入 - ${new Date().toLocaleDateString("zh-CN")}`,
        rawInput: doc.content,
        customerId,
        sourceType: "feishu",
        status: "pending",
      },
    });

    return Response.json({
      id: requirement.id,
      title: requirement.title,
      documentUrl: doc.url,
      contentLength: doc.content.length,
    });
  } catch (error) {
    console.error("Feishu import error:", error);
    const msg = error instanceof Error ? error.message : "导入失败";
    return Response.json({ error: msg }, { status: 500 });
  }
}
