import { NextRequest } from "next/server";
import { mergeRequirements, getCustomerImpact, getScoreForRequirement } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceIds } = body as { sourceIds: string[] };

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return Response.json({ error: "sourceIds 不能为空" }, { status: 400 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const idIndex = pathParts.indexOf("requirements") + 1;
    const targetId = pathParts[idIndex];

    if (!targetId) {
      return Response.json({ error: "缺少目标需求 ID" }, { status: 400 });
    }

    const result = await mergeRequirements(targetId, sourceIds);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("Merge error:", error);
    const msg = error instanceof Error ? error.message : "合并失败";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const idIndex = pathParts.indexOf("requirements") + 1;
  const requirementId = pathParts[idIndex];

  if (!requirementId) {
    return Response.json({ error: "缺少 requirementId" }, { status: 400 });
  }

  const type = request.nextUrl.searchParams.get("type") || "impact";

  try {
    if (type === "impact") {
      const impact = await getCustomerImpact(requirementId);
      const score = await getScoreForRequirement(requirementId);
      return Response.json({ ...impact, priorityScore: score });
    }

    return Response.json({ error: "未知查询类型" }, { status: 400 });
  } catch (error) {
    console.error("Impact/Score error:", error);
    return Response.json({ error: "查询失败" }, { status: 500 });
  }
}
