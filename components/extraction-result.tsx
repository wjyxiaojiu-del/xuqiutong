"use client";

import type { ExtractedData } from "@/lib/schemas";
import { PriorityBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "#8e8b82" }}>
      {children}
    </span>
  );
}

export function ExtractionResult({ data }: { data: ExtractedData }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <h2 className="text-xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{data.title}</h2>
        <PriorityBadge priority={data.priority} />
      </div>

      {/* Role & Scenario */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <SectionLabel>客户角色</SectionLabel>
          </CardHeader>
          <CardContent className="text-[15px] leading-relaxed text-[#3d3d3a]">
            {data.customerRole}
          </CardContent>
        </Card>
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <SectionLabel>业务场景</SectionLabel>
          </CardHeader>
          <CardContent className="text-[15px] leading-relaxed text-[#3d3d3a]">
            {data.scenario}
          </CardContent>
        </Card>
      </div>

      {/* Pain Points — Coral card */}
      <Card className="border-0 rounded-xl" style={{ background: "#cc785c" }}>
        <CardHeader className="pb-2">
          <SectionLabel>痛点</SectionLabel>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {data.painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-[12px] font-medium">
                  {i + 1}
                </span>
                <span className="text-white">{p}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Goals — Teal card */}
      <Card className="border-0 rounded-xl" style={{ background: "#5db8a6" }}>
        <CardHeader className="pb-2">
          <SectionLabel>目标</SectionLabel>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {data.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-[12px] font-medium">
                  {i + 1}
                </span>
                <span className="text-white">{g}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Constraints */}
      {data.constraints.length > 0 && (
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <SectionLabel>约束条件</SectionLabel>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.constraints.map((c, i) => (
                <li key={i} className="text-[15px] leading-relaxed flex items-start gap-2 text-[#3d3d3a]">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#8e8b82" }} />
                  {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Evidence — 核心亮点：可追溯的证据链 */}
      <Card className="border-2 rounded-xl" style={{ background: "var(--surface-card)", borderColor: "#5db8a6" }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-[#5db8a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[13px] font-semibold uppercase tracking-widest text-[#5db8a6]">
                证据链 · 可追溯
              </span>
            </div>
            <span className="text-[12px] text-[#6c6a64]">
              {data.evidence.length} 条证据
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.evidence.map((e, i) => (
            <div key={i} className="relative pl-8">
              {/* 证据编号 */}
              <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#5db8a6] text-white text-[12px] font-bold">
                {i + 1}
              </div>
              {/* 证据内容 */}
              <div className="rounded-lg border-l-4 p-4" style={{ borderColor: "#5db8a6", background: "var(--surface-cream-strong)" }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] leading-relaxed text-[#141413] italic font-medium">
                    &ldquo;{e.quote}&rdquo;
                  </p>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-[#5db8a6]/10 text-[#5db8a6]">
                    原文引用
                  </span>
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <svg className="h-4 w-4 text-[#5db8a6] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[13px] text-[#3d3d3a]">
                    <span className="font-medium">分析：</span>{e.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hidden Needs — Amber accent */}
      {data.hiddenNeeds && data.hiddenNeeds.length > 0 && (
        <Card className="border-0 rounded-xl" style={{ background: "#e8a55a" }}>
          <CardHeader className="pb-2">
            <span className="text-[11px] font-medium uppercase tracking-widest text-white/70">
              隐含需求（AI 推断）
            </span>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {data.hiddenNeeds.map((n, i) => (
                <li key={i} className="text-[15px] leading-relaxed flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-[12px] font-medium">
                    {i + 1}
                  </span>
                  <span className="text-white">{n}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Stakeholders & Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.stakeholders && data.stakeholders.length > 0 && (
          <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader className="pb-2">
              <SectionLabel>利益相关者</SectionLabel>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.stakeholders.map((s, i) => (
                  <li key={i} className="text-[15px] leading-relaxed flex items-start gap-2 text-[#3d3d3a]">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#8e8b82" }} />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {data.successMetrics && data.successMetrics.length > 0 && (
          <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader className="pb-2">
              <SectionLabel>成功指标</SectionLabel>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.successMetrics.map((m, i) => (
                  <li key={i} className="text-[15px] leading-relaxed flex items-start gap-2 text-[#3d3d3a]">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#5db872] shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assumptions */}
      {data.assumptions && data.assumptions.length > 0 && (
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <SectionLabel>假设条件</SectionLabel>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.assumptions.map((a, i) => (
                <li key={i} className="text-[14px] leading-relaxed flex items-start gap-2 text-[#3d3d3a]">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#5db8a6] shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Open Questions — Dark navy card */}
      {data.openQuestions.length > 0 && (
        <Card className="border-0 rounded-xl" style={{ background: "var(--surface-dark)" }}>
          <CardHeader className="pb-2">
            <span className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "#a09d96" }}>
              待确认问题
            </span>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {data.openQuestions.map((q, i) => (
                <li key={i} className="text-[15px] leading-relaxed flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#faf9f5] text-[12px] font-medium" style={{ background: "var(--surface-dark-elevated)" }}>
                    ?
                  </span>
                  <span className="text-[#faf9f5]">{q}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
