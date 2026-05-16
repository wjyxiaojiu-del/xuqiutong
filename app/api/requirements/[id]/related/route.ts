import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function extractKeywords(text: string): string[] {
  // Split by common delimiters, filter short/empty tokens
  return text
    .split(/[,，。、；;：:！!？?\s]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);
}

function getRequirementKeywords(
  req: { title: string; rawInput: string; extractedJson: unknown }
): string[] {
  const keywords = new Set<string>();

  // Title keywords
  extractKeywords(req.title).forEach((w) => keywords.add(w));

  // Extracted data keywords
  if (req.extractedJson) {
    try {
      const extracted = typeof req.extractedJson === "string"
        ? JSON.parse(req.extractedJson)
        : req.extractedJson;
      if (typeof extracted?.scenario === "string") extractKeywords(extracted.scenario).forEach((w) => keywords.add(w));
      if (Array.isArray(extracted?.painPoints)) {
        extracted.painPoints.forEach((p: unknown) => {
          if (typeof p === "string") extractKeywords(p).forEach((w) => keywords.add(w));
        });
      }
      if (Array.isArray(extracted?.goals)) {
        extracted.goals.forEach((g: unknown) => {
          if (typeof g === "string") extractKeywords(g).forEach((w) => keywords.add(w));
        });
      }
    } catch {
      // ignore parse errors
    }
  }

  return [...keywords];
}

function computeSimilarity(
  keywordsA: string[],
  keywordsB: string[]
): number {
  if (keywordsA.length === 0 || keywordsB.length === 0) return 0;
  const setB = new Set(keywordsB);
  let matchCount = 0;
  for (const kw of keywordsA) {
    for (const kb of setB) {
      if (kw.includes(kb) || kb.includes(kw)) {
        matchCount++;
        break;
      }
    }
  }
  return matchCount / Math.max(keywordsA.length, keywordsB.length);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const current = await prisma.requirement.findUnique({ where: { id } });
  if (!current) {
    return Response.json({ error: "需求不存在" }, { status: 404 });
  }

  const currentKeywords = getRequirementKeywords(current);

  // Get all other requirements
  const others = await prisma.requirement.findMany({
    where: { id: { not: id } },
    include: { customer: true },
  });

  // Score and rank
  const scored = others
    .map((other) => {
      const otherKeywords = getRequirementKeywords(other);
      const score = computeSimilarity(currentKeywords, otherKeywords);
      return { ...other, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return Response.json({
    related: scored.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      priority: r.priority,
      customerName: r.customer?.name ?? "未知",
      score: Math.round(r.score * 100),
    })),
  });
}
