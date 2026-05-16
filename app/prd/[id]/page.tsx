"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrdViewer } from "@/components/prd-viewer";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState, ErrorState } from "@/components/loading-state";
import { FeishuExport } from "@/components/feishu-export";
import { Textarea } from "@/components/ui/textarea";
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
import { VersionHistory } from "@/components/version-history";
import { RelatedRequirements } from "@/components/related-requirements";
import { toast } from "sonner";

interface RequirementData {
  id: string;
  title: string;
  status: string;
  prdMarkdown: string;
  mermaidCode: string;
  extractedJson: unknown;
  rejectReason: string;
  comments: { id: string; sectionKey: string; content: string; createdAt: string }[];
}

export default function PrdPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<RequirementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/requirements/${id}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch((e) => { if (e.name !== "AbortError") setError("加载失败"); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  function fetchData() {
    setLoading(true);
    fetch(`/api/requirements/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }

  async function updateStatus(status: string, reason?: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/requirements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectReason: reason }),
      });
      if (!res.ok) {
        toast.error("操作失败");
        return;
      }
      toast.success("状态已更新");
      fetchData();
    } catch {
      toast.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId: id, content: commentText }),
      });
      if (res.ok) {
        toast.success("评论已添加");
        setCommentText("");
        fetchData();
      }
    } catch {
      toast.error("评论失败");
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState text={error} />;
  if (!data || !data.prdMarkdown) return <ErrorState text="PRD 未生成" />;

  const needsReview = data.status === "prd_generated";

  // 解析证据引用
  let evidence: { quote: string; reason: string }[] = [];
  if (data.extractedJson) {
    try {
      const extracted = typeof data.extractedJson === "string"
        ? JSON.parse(data.extractedJson)
        : data.extractedJson;
      evidence = extracted?.evidence || [];
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{data.title || "PRD 文档"}</h1>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/requirements")}>
            返回列表
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const blob = new Blob([data.prdMarkdown], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${data.title || "PRD"}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            导出 MD
          </Button>
          <FeishuExport requirementId={id} />
          <Button variant="outline" size="sm" onClick={() => setVersionOpen(true)}>
            版本历史
          </Button>
        </div>
      </div>

      {/* Review Action Bar — Coral callout */}
      {needsReview && (
        <Card className="border-0 rounded-xl" style={{ background: "#cc785c" }}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">PRD 待审核</p>
                <p className="text-xs text-white/70">请审阅文档内容后选择通过或驳回</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-md"
                  onClick={() => {
                    setRejectReason("");
                    setRejectOpen(true);
                  }}
                >
                  驳回
                </Button>
                <Button
                  className="bg-white text-[#141413] hover:bg-white/90 rounded-md"
                  onClick={() => updateStatus("approved")}
                  disabled={submitting}
                >
                  通过
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected */}
      {data.status === "rejected" && (
        <Card className="border rounded-xl" style={{ background: "#c64545/8", borderColor: "#c64545/20" }}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#c64545]">PRD 已驳回</p>
                <p className="text-sm text-[#c64545]/80 mt-1">原因：{data.rejectReason}</p>
              </div>
              <Button
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white rounded-md"
                onClick={() => updateStatus("reviewing")}
                disabled={submitting}
              >
                重新提交审核
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved */}
      {data.status === "approved" && (
        <Card className="border rounded-xl" style={{ background: "#5db872/8", borderColor: "#5db872/20" }}>
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">&#10003;</span>
              <p className="text-sm font-medium text-[#3d8a52]">PRD 已通过审核</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Reference — 证据引用 */}
      {evidence.length > 0 && (
        <Card className="border-2 rounded-xl" style={{ background: "var(--surface-card)", borderColor: "#5db8a6" }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[#5db8a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[13px] font-semibold uppercase tracking-widest text-[#5db8a6]">
                  本 PRD 基于 {evidence.length} 条客户原声证据
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/extract/${id}`)}
              >
                查看完整萃取
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {evidence.slice(0, 4).map((e, i) => (
                <div key={i} className="rounded-lg border-l-4 p-3" style={{ borderColor: "#5db8a6", background: "var(--surface-cream-strong)" }}>
                  <p className="text-[13px] text-[#141413] italic line-clamp-2">
                    &ldquo;{e.quote}&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] text-[#6c6a64]">
                    {e.reason}
                  </p>
                </div>
              ))}
            </div>
            {evidence.length > 4 && (
              <p className="mt-3 text-[12px] text-[#6c6a64] text-center">
                还有 {evidence.length - 4} 条证据，点击&ldquo;查看完整萃取&rdquo;查看全部
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* PRD Content */}
      <PrdViewer prd={data.prdMarkdown} mermaid={data.mermaidCode} />

      {/* Related Requirements */}
      <RelatedRequirements requirementId={id} />

      {/* Comments */}
      <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-medium flex items-center gap-2">
            评论
            {data.comments.length > 0 && (
              <span className="text-[12px] font-normal px-2 py-0.5 rounded-full" style={{ background: "var(--surface-cream-strong)", color: "#6c6a64" }}>
                {data.comments.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.comments.length === 0 ? (
            <p className="text-[14px] text-[#6c6a64] text-center py-4">暂无评论</p>
          ) : (
            <div className="space-y-3">
              {data.comments.map((c) => (
                <div key={c.id} className="rounded-lg p-3" style={{ background: "var(--surface-cream-strong)" }}>
                  <p className="text-[15px]">{c.content}</p>
                  <p className="text-[13px] text-[#6c6a64] mt-2 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(c.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="添加评论..."
              className="flex-1 min-h-[60px]"
            />
            <Button onClick={handleAddComment} className="self-end">
              发送
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <VersionHistory
        open={versionOpen}
        onOpenChange={setVersionOpen}
        requirementId={id}
        currentMarkdown={data.prdMarkdown}
        onRollback={fetchData}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回 PRD</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请输入驳回原因..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                updateStatus("rejected", rejectReason);
                setRejectOpen(false);
              }}
              disabled={submitting}
            >
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
