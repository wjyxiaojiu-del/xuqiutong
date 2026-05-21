import { NextRequest } from "next/server";
import { findSimilarRequirements } from "@/lib/scoring";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const similar = await findSimilarRequirements(id, 0.1, 5);
    return Response.json({
      related: similar.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        priority: "P1" as const,
        customerName: "",
        score: Math.round(r.similarity * 100),
      })),
    });
  } catch (error) {
    console.error("Related requirements error:", error);
    return Response.json({ related: [] });
  }
}
