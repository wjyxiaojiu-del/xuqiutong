"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { AIStatusBar } from "@/components/ai-status-bar";

interface DashboardSummary {
  total: number;
  byStatus: Record<string, number>;
  recent: { id: string; title: string; status: string; updatedAt: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待分析",
  extracted: "已萃取",
  prd_generated: "PRD已生成",
  reviewing: "待审核",
  approved: "已通过",
  rejected: "已驳回",
  failed: "处理失败",
};

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="space-y-4 pt-2">
        <h1 className="text-4xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.03em" }}>
          需求通
        </h1>
        <p className="text-[#3d3d3a] text-[17px] leading-relaxed max-w-lg">
          把分散的客户声音转成可追溯、可审核、可沉淀的产品需求资产
        </p>
        <div className="pt-1">
          <AIStatusBar />
        </div>
      </div>

      {/* Quick actions — Claude-style feature cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Coral card */}
        <Card className="border-0 rounded-xl overflow-hidden" style={{ background: "#cc785c" }}>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-[17px] font-medium text-white">录入需求</CardTitle>
            <CardDescription className="text-[14px] text-white/80">
              粘贴客户聊天记录，AI 自动萃取结构化需求
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Link
              href="/new"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium bg-white text-[#141413] hover:bg-white/90 transition-colors"
            >
              开始录入
            </Link>
          </CardContent>
        </Card>

        {/* Teal card - 文件导入 */}
        <Card className="border-0 rounded-xl overflow-hidden" style={{ background: "#5db8a6" }}>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-[17px] font-medium text-white">文件导入</CardTitle>
            <CardDescription className="text-[14px] text-white/80">
              上传 CSV、TXT 文件，批量导入客户反馈
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Link
              href="/import"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium bg-white text-[#141413] hover:bg-white/90 transition-colors"
            >
              上传文件
            </Link>
          </CardContent>
        </Card>

        {/* Cream card */}
        <Card className="border rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-[17px] font-medium text-[#141413]">需求列表</CardTitle>
            <CardDescription className="text-[14px] text-[#6c6a64]">
              查看所有需求，支持状态筛选和详情跳转
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Link
              href="/requirements"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium border text-[#141413] hover:bg-[#141413]/5 transition-colors"
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
            >
              查看列表
            </Link>
          </CardContent>
        </Card>

        {/* Dark navy card */}
        <Card className="border-0 rounded-xl overflow-hidden" style={{ background: "var(--surface-dark)" }}>
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-[17px] font-medium text-[#faf9f5]">客户档案</CardTitle>
            <CardDescription className="text-[14px] text-[#a09d96]">
              查看客户信息和历史需求记录
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Link
              href="/customers"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium text-[#faf9f5] hover:bg-white/10 transition-colors"
              style={{ background: "var(--surface-dark-elevated)" }}
            >
              查看客户
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats and recent */}
      {summary && summary.total > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium">快速统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-normal" style={{ fontFamily: "var(--font-heading)" }}>{summary.total}</p>
                  <p className="text-[12px] text-[#6c6a64] uppercase tracking-widest font-medium">总需求</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-normal text-[#5db872]" style={{ fontFamily: "var(--font-heading)" }}>
                    {summary.byStatus.approved || 0}
                  </p>
                  <p className="text-[12px] text-[#6c6a64] uppercase tracking-widest font-medium">已通过</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-normal text-[#e8a55a]" style={{ fontFamily: "var(--font-heading)" }}>
                    {(summary.byStatus.prd_generated || 0) + (summary.byStatus.reviewing || 0)}
                  </p>
                  <p className="text-[12px] text-[#6c6a64] uppercase tracking-widest font-medium">待审核</p>
                </div>
              </div>
              {/* Status bar */}
              <div className="mt-4 flex h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-cream-strong)" }}>
                {Object.entries(summary.byStatus).map(([status, count]) => {
                  const colors: Record<string, string> = {
                    pending: "#8e8b82",
                    extracted: "#5db8a6",
                    prd_generated: "#cc785c",
                    reviewing: "#e8a55a",
                    approved: "#5db872",
                    rejected: "#c64545",
                    failed: "#c64545",
                  };
                  const pct = (count / summary.total) * 100;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={status}
                      className="transition-all"
                      style={{ width: `${pct}%`, background: colors[status] || "#8e8b82" }}
                      title={`${STATUS_LABELS[status] || status}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(summary.byStatus).map(([status, count]) => (
                  <span key={status} className="text-[11px] text-[#6c6a64]">
                    {STATUS_LABELS[status] || status}: {count}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium">最近需求</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {summary.recent.slice(0, 5).map((r) => (
                  <Link
                    key={r.id}
                    href={`/extract/${r.id}`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors -mx-3"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-cream-strong)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="text-[14px] truncate flex-1 font-medium">
                      {r.title || "未命名"}
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {summary && summary.total === 0 && (
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardContent className="py-14 text-center">
            <h3 className="text-[18px] font-medium mb-1" style={{ fontFamily: "var(--font-heading)" }}>开始你的第一个需求</h3>
            <p className="text-[15px] text-[#6c6a64] mb-5 max-w-sm mx-auto">
              粘贴客户聊天记录，AI 将自动萃取结构化需求并生成 PRD
            </p>
            <Link href="/new" className={buttonVariants({ size: "lg" })}>
              录入第一条需求
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Core flow — dark navy band */}
      <Card className="border-0 rounded-xl overflow-hidden" style={{ background: "var(--surface-dark)" }}>
        <CardContent className="py-6">
          <p className="text-[12px] font-medium uppercase tracking-widest mb-3" style={{ color: "#a09d96" }}>核心流程</p>
          <div className="flex flex-wrap items-center gap-3 text-[15px] font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[#faf9f5]" style={{ background: "var(--surface-dark-elevated)" }}>
              1. 录入客户声音
            </span>
            <svg className="h-4 w-4" style={{ color: "#a09d96" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[#faf9f5]" style={{ background: "var(--surface-dark-elevated)" }}>
              2. AI 萃取需求
            </span>
            <svg className="h-4 w-4" style={{ color: "#a09d96" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[#faf9f5]" style={{ background: "var(--surface-dark-elevated)" }}>
              3. 生成 PRD
            </span>
            <svg className="h-4 w-4" style={{ color: "#a09d96" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[#faf9f5]" style={{ background: "var(--surface-dark-elevated)" }}>
              4. 审核沉淀
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
