"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CustomerImpactData {
  customerCount: number;
  totalFeedback: number;
  totalContractValue: number;
  renewalRiskCount: number;
  dealBlockerCount: number;
  priorityScore: number;
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

interface SimilarItem {
  id: string;
  title: string;
  status: string;
  similarity: number;
}

export function CustomerImpactPanel({ requirementId }: { requirementId: string }) {
  const [impact, setImpact] = useState<CustomerImpactData | null>(null);
  const [similar, setSimilar] = useState<SimilarItem[]>([]);
  const [loadingImpact, setLoadingImpact] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    fetch(`/api/requirements/${requirementId}/merge?type=impact`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setImpact(d);
      })
      .catch(() => {})
      .finally(() => setLoadingImpact(false));
  }, [requirementId]);

  useEffect(() => {
    fetch(`/api/requirements/${requirementId}/similar`)
      .then((r) => r.json())
      .then((d) => setSimilar(d.similar ?? []))
      .catch(() => {})
      .finally(() => setLoadingSimilar(false));
  }, [requirementId]);

  async function handleMerge() {
    if (selectedIds.size === 0) {
      toast.error("请选择要合并的需求");
      return;
    }

    setMerging(true);
    try {
      const res = await fetch(`/api/requirements/${requirementId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceIds: [...selectedIds] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "合并失败");
        return;
      }
      toast.success(`成功合并 ${data.sourceCount} 条需求`);
      setMergeOpen(false);
      setSelectedIds(new Set());
      // Refresh similar
      fetch(`/api/requirements/${requirementId}/similar`)
        .then((r) => r.json())
        .then((d) => setSimilar(d.similar ?? []));
      fetch(`/api/requirements/${requirementId}/merge?type=impact`)
        .then((r) => r.json())
        .then((d) => { if (!d.error) setImpact(d); });
    } catch {
      toast.error("网络错误");
    } finally {
      setMerging(false);
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function scoreColor(score: number): string {
    if (score >= 100) return "#c64545";
    if (score >= 50) return "#e8a55a";
    return "#5db8a6";
  }

  function scoreLabel(score: number): string {
    if (score >= 100) return "高优先级";
    if (score >= 50) return "中优先级";
    return "低优先级";
  }

  if (loadingImpact && loadingSimilar) return null;

  return (
    <div className="space-y-4">
      {/* Priority Score & Impact Summary */}
      {impact && (
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-medium flex items-center gap-2">
              客户影响度
              {impact.priorityScore !== undefined && (
                <span
                  className="text-[12px] px-2 py-0.5 rounded-full font-medium text-white"
                  style={{ background: scoreColor(impact.priorityScore) }}
                >
                  {scoreLabel(impact.priorityScore)} · {impact.priorityScore}分
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div className="space-y-1">
                <p className="text-xl font-normal" style={{ fontFamily: "var(--font-heading)" }}>
                  {impact.customerCount}
                </p>
                <p className="text-[11px] text-[#6c6a64] uppercase tracking-wider">客户数</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-normal" style={{ fontFamily: "var(--font-heading)" }}>
                  {impact.totalFeedback}
                </p>
                <p className="text-[11px] text-[#6c6a64] uppercase tracking-wider">反馈次数</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-normal" style={{ fontFamily: "var(--font-heading)" }}>
                  ¥{impact.totalContractValue.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#6c6a64] uppercase tracking-wider">合同金额</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-normal" style={{ fontFamily: "var(--font-heading)", color: impact.renewalRiskCount > 0 ? "#c64545" : "#6c6a64" }}>
                  {impact.renewalRiskCount}
                </p>
                <p className="text-[11px] text-[#6c6a64] uppercase tracking-wider">续费风险</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-normal" style={{ fontFamily: "var(--font-heading)", color: impact.dealBlockerCount > 0 ? "#c64545" : "#6c6a64" }}>
                  {impact.dealBlockerCount}
                </p>
                <p className="text-[11px] text-[#6c6a64] uppercase tracking-wider">成交阻塞</p>
              </div>
            </div>

            {/* Score bar */}
            {impact.priorityScore !== undefined && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[#6c6a64]">优先级评分</span>
                  <span className="text-[12px] font-medium" style={{ color: scoreColor(impact.priorityScore) }}>
                    {impact.priorityScore}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-cream-strong)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (impact.priorityScore / 200) * 100)}%`,
                      background: scoreColor(impact.priorityScore),
                    }}
                  />
                </div>
              </div>
            )}

            {/* Customer detail list */}
            {impact.customers.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[12px] font-medium text-[#6c6a64]">关联客户</p>
                {impact.customers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                    style={{ background: "var(--surface-cream-strong)" }}
                  >
                    <div>
                      <span className="font-medium text-[#141413]">{c.name}</span>
                      {c.company && (
                        <span className="text-[#6c6a64] ml-1">({c.company})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-[#6c6a64]">
                      <span>反馈 {c.feedbackCount} 次</span>
                      {c.contractValue && <span>¥{c.contractValue.toLocaleString()}</span>}
                      {c.isRenewalRisk && <span className="text-[#c64545] font-medium">续费风险</span>}
                      {c.isDealBlocker && <span className="text-[#c64545] font-medium">成交阻塞</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Similar Requirements */}
      {!loadingSimilar && similar.length > 0 && (
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[14px] font-medium">相似需求</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeOpen(true)}
                disabled={selectedIds.size === 0}
              >
                合并选中 ({selectedIds.size})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {similar.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors cursor-pointer hover:bg-[#141413]/5"
                onClick={() => toggleSelect(item.id)}
                style={{
                  background: selectedIds.has(item.id) ? "#5db8a6/10" : "var(--surface-cream-strong)",
                  border: selectedIds.has(item.id) ? "1px solid #5db8a6" : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="h-4 w-4 rounded accent-[#5db8a6]"
                  />
                  <span className="font-medium text-[#141413] truncate max-w-[300px]">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[12px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: item.similarity >= 0.4 ? "#5db8a6/15" : "#8e8b82/15",
                      color: item.similarity >= 0.4 ? "#3d8a52" : "#8e8b82",
                    }}
                  >
                    {Math.round(item.similarity * 100)}% 相似
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Merge Dialog */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>合并需求</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[#6c6a64]">
              将选中的 {selectedIds.size} 条需求合并到当前需求。合并后将迁移客户关联和评论，原需求保留但标记为已合并。
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {similar.filter((s) => selectedIds.has(s.id)).map((item) => (
                <div
                  key={item.id}
                  className="rounded-md px-3 py-2 text-sm"
                  style={{ background: "var(--surface-cream-strong)" }}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-[12px] text-[#6c6a64]">
                    {Math.round(item.similarity * 100)}% 相似
                  </p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleMerge}
              disabled={merging}
              className="bg-[#5db8a6] hover:bg-[#4a9e8d] text-white"
            >
              {merging ? "合并中..." : "确认合并"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
