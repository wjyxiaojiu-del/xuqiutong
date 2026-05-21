import { prisma } from "@/lib/prisma";

// ─── 优先级评分 ───

export interface ScoreInput {
  customerCount: number;
  totalFeedbackCount: number;
  totalContractValue: number;
  hasRenewalRisk: boolean;
  hasDealBlocker: boolean;
  daysSinceLastFeedback: number;
  basePriority: string;
}

export function calculatePriorityScore(input: ScoreInput): number {
  let score = 0;

  score += input.customerCount * 10;
  score += input.totalFeedbackCount * 5;
  score += (input.totalContractValue / 10000) * 2;
  if (input.hasRenewalRisk) score += 50;
  if (input.hasDealBlocker) score += 100;

  const daysDecay = Math.max(0.5, 1 - input.daysSinceLastFeedback / 90);
  score *= daysDecay;

  // 基础优先级加权
  const priorityWeight: Record<string, number> = { P0: 1.5, P1: 1.0, P2: 0.7, P3: 0.4 };
  score *= priorityWeight[input.basePriority] ?? 1.0;

  return Math.round(score);
}

export async function getScoreForRequirement(requirementId: string): Promise<number> {
  const req = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: { customerLinks: true },
  });
  if (!req) return 0;

  const links = req.customerLinks || [];
  const totalFeedback = links.reduce((s, l) => s + l.feedbackCount, 0);
  const totalValue = links.reduce((s, l) => s + (l.contractValue || 0), 0);
  const lastFeedbackDates = links.map((l) => l.lastFeedback.getTime()).filter(Boolean);
  const lastFeedback = lastFeedbackDates.length > 0 ? Math.max(...lastFeedbackDates) : Date.now();
  const daysSinceLast = Math.floor((Date.now() - lastFeedback) / (1000 * 60 * 60 * 24));

  return calculatePriorityScore({
    customerCount: links.length,
    totalFeedbackCount: totalFeedback,
    totalContractValue: totalValue,
    hasRenewalRisk: links.some((l) => l.isRenewalRisk),
    hasDealBlocker: links.some((l) => l.isDealBlocker),
    daysSinceLastFeedback: daysSinceLast,
    basePriority: req.priority,
  });
}

// ─── 客户影响统计 ───

export interface CustomerImpact {
  customerCount: number;
  totalFeedback: number;
  totalContractValue: number;
  renewalRiskCount: number;
  dealBlockerCount: number;
  customers: {
    id: string;
    name: string;
    company: string;
    feedbackCount: number;
    contractValue: number | null;
    isRenewalRisk: boolean;
    isDealBlocker: boolean;
  }[];
}

export async function getCustomerImpact(requirementId: string): Promise<CustomerImpact> {
  const links = await prisma.requirementCustomer.findMany({
    where: { requirementId },
    include: { customer: true },
    orderBy: { feedbackCount: "desc" },
  });

  return {
    customerCount: links.length,
    totalFeedback: links.reduce((s, l) => s + l.feedbackCount, 0),
    totalContractValue: links.reduce((s, l) => s + (l.contractValue || 0), 0),
    renewalRiskCount: links.filter((l) => l.isRenewalRisk).length,
    dealBlockerCount: links.filter((l) => l.isDealBlocker).length,
    customers: links.map((l) => ({
      id: l.customer.id,
      name: l.customer.name,
      company: l.customer.company,
      feedbackCount: l.feedbackCount,
      contractValue: l.contractValue,
      isRenewalRisk: l.isRenewalRisk,
      isDealBlocker: l.isDealBlocker,
    })),
  };
}

// ─── 需求合并 ───

export interface MergeResult {
  mergedId: string;
  mergedTitle: string;
  sourceIds: string[];
  sourceCount: number;
}

export async function mergeRequirements(
  targetId: string,
  sourceIds: string[]
): Promise<MergeResult> {
  if (sourceIds.length === 0) {
    throw new Error("至少选择一个要合并的需求");
  }

  // 过滤掉目标自身
  const validIds = sourceIds.filter((id) => id !== targetId);
  if (validIds.length === 0) {
    throw new Error("不能将一个需求合并到自身");
  }

  const target = await prisma.requirement.findUnique({ where: { id: targetId } });
  if (!target) throw new Error("目标需求不存在");

  // 事务：合并 source 到 target
  await prisma.$transaction(async (tx) => {
    for (const sourceId of validIds) {
      const source = await tx.requirement.findUnique({
        where: { id: sourceId },
        include: { comments: true, customerLinks: true },
      });
      if (!source) continue;

      // 迁移 customerLinks
      for (const link of source.customerLinks) {
        const existing = await tx.requirementCustomer.findUnique({
          where: {
            requirementId_customerId: {
              requirementId: targetId,
              customerId: link.customerId,
            },
          },
        });
        if (existing) {
          await tx.requirementCustomer.update({
            where: { id: existing.id },
            data: {
              feedbackCount: existing.feedbackCount + link.feedbackCount,
              isRenewalRisk: existing.isRenewalRisk || link.isRenewalRisk,
              isDealBlocker: existing.isDealBlocker || link.isDealBlocker,
              contractValue: (existing.contractValue || 0) + (link.contractValue || 0),
            },
          });
        } else {
          await tx.requirementCustomer.create({
            data: {
              requirementId: targetId,
              customerId: link.customerId,
              feedbackCount: link.feedbackCount,
              contractValue: link.contractValue,
              isRenewalRisk: link.isRenewalRisk,
              isDealBlocker: link.isDealBlocker,
            },
          });
        }
      }

      // 迁移 comments
      if (source.comments.length > 0) {
        await tx.comment.updateMany({
          where: { requirementId: sourceId },
          data: { requirementId: targetId },
        });
      }

      // 更新合并关系
      await tx.requirement.update({
        where: { id: sourceId },
        data: {
          mergedIntoId: targetId,
          // 不改变 status，保留原始状态
        },
      });
    }
  });

  return {
    mergedId: targetId,
    mergedTitle: target.title,
    sourceIds: validIds,
    sourceCount: validIds.length,
  };
}

// ─── 相似需求检测 ───

export async function findSimilarRequirements(
  requirementId: string,
  threshold = 0.15,
  limit = 5
) {
  const source = await prisma.requirement.findUnique({
    where: { id: requirementId },
    select: { title: true, rawInput: true },
  });
  if (!source) return [];

  const candidates = await prisma.requirement.findMany({
    where: {
      id: { not: requirementId },
      mergedIntoId: null,
      status: { notIn: ["failed"] },
    },
    select: { id: true, title: true, rawInput: true, status: true },
  });

  const { findSimilar } = await import("@/lib/similarity");
  return findSimilar(source.rawInput || source.title, candidates, threshold, limit);
}
