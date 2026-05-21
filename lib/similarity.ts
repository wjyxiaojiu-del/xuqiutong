// 关键词相似度检测（中文优化）
// 先用关键词方案，后续可升级为 embedding + pgvector

function tokenize(text: string): string[] {
  // 中文按常见分隔符和N-gram切词
  const cleaned = text.toLowerCase().replace(/[^一-龥a-zA-Z0-9]/g, " ");
  const tokens: string[] = [];

  // 2-gram 中文分词
  const chinese = text.replace(/[^一-龥]/g, "");
  for (let i = 0; i < chinese.length - 1; i++) {
    tokens.push(chinese.slice(i, i + 2));
  }

  // 英文单词
  cleaned.split(/\s+/).forEach((w) => {
    if (w.length > 1) tokens.push(w);
  });

  return tokens;
}

function jaccardSimilarity(tokens1: string[], tokens2: string[]): number {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  if (set1.size === 0 && set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

export function calculateSimilarity(text1: string, text2: string): number {
  return jaccardSimilarity(tokenize(text1), tokenize(text2));
}

export interface SimilarRequirement {
  id: string;
  title: string;
  status: string;
  similarity: number;
}

export function findSimilar(
  sourceText: string,
  targets: { id: string; title: string; rawInput: string; status: string }[],
  threshold = 0.15,
  limit = 5
): SimilarRequirement[] {
  const sourceTokens = tokenize(sourceText);
  const results: SimilarRequirement[] = [];

  for (const t of targets) {
    const sim = jaccardSimilarity(sourceTokens, tokenize(t.rawInput || t.title));
    if (sim >= threshold) {
      results.push({ id: t.id, title: t.title, status: t.status, similarity: sim });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}
