import { z } from "zod";

export const ExtractedSchema = z.object({
  title: z.string(),
  customerRole: z.string(),
  scenario: z.string(),
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  constraints: z.array(z.string()),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  evidence: z.array(
    z.object({
      quote: z.string(),
      reason: z.string(),
    })
  ),
  openQuestions: z.array(z.string()),
  hiddenNeeds: z.array(z.string()),
  stakeholders: z.array(z.string()),
  successMetrics: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export type ExtractedData = z.infer<typeof ExtractedSchema>;

export const CreateRequirementSchema = z.object({
  rawInput: z.string().min(1, "请输入客户声音内容"),
  customerName: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  contactName: z.string().optional(),
  scenario: z.string().optional(),
  sourceType: z.enum(["text", "audio", "import", "feishu", "api"]).default("text"),
});

// 与 Prisma RequirementStatus enum 完全同步
export const RequirementStatus = z.enum([
  "pending",
  "extracting",
  "extracted",
  "prd_generated",
  "reviewing",
  "approved",
  "rejected",
  "failed",
]);

export type RequirementStatusType = z.infer<typeof RequirementStatus>;

export const UpdateStatusSchema = z.object({
  status: RequirementStatus,
  rejectReason: z.string().optional(),
});

export const CreateCommentSchema = z.object({
  requirementId: z.string(),
  sectionKey: z.string().default("general"),
  content: z.string().min(1, "评论内容不能为空"),
});

export const RollbackVersionSchema = z.object({
  versionId: z.string().min(1),
});

// 状态流转规则：from -> 允许的 to（与 Prisma enum 同步）
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["extracting", "failed"],
  extracting: ["extracted", "failed"],
  extracted: ["prd_generated", "failed"],
  prd_generated: ["reviewing", "approved", "rejected"],
  reviewing: ["approved", "rejected"],
  approved: [],
  rejected: ["reviewing", "prd_generated"],
  failed: ["pending", "extracting"],
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "待萃取",
  extracting: "萃取中",
  extracted: "已萃取",
  prd_generated: "PRD已生成",
  reviewing: "待审核",
  approved: "已通过",
  rejected: "已驳回",
  failed: "处理失败",
};

export const PRIORITY_LABELS: Record<string, string> = {
  P0: "P0 紧急",
  P1: "P1 重要",
  P2: "P2 一般",
  P3: "P3 低",
};
