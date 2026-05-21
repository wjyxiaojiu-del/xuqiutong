import { NextRequest } from "next/server";
import { findSimilarRequirements } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const requirementId = searchParams.get("requirementId");
  const threshold = parseFloat(searchParams.get("threshold") || "0.15");
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  if (!requirementId) {
    return Response.json({ error: "缺少 requirementId" }, { status: 400 });
  }

  try {
    const similar = await findSimilarRequirements(requirementId, threshold, limit);
    return Response.json({ similar });
  } catch (error) {
    console.error("Similar detection error:", error);
    return Response.json({ error: "查询失败" }, { status: 500 });
  }
}
