import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateCommentSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      requirementId: parsed.data.requirementId,
      sectionKey: parsed.data.sectionKey,
      content: parsed.data.content,
    },
  });

  return Response.json(comment);
}
