"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExtractionResult } from "@/components/extraction-result";
import { RelatedRequirements } from "@/components/related-requirements";
import { CustomerImpactPanel } from "@/components/customer-impact";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { LoadingState, ErrorState, AILoadingState } from "@/components/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtractedData } from "@/lib/schemas";
import { PRIORITY_LABELS } from "@/lib/schemas";
import { toast } from "sonner";
import { useAiJob } from "@/lib/hooks/use-ai-job";

export default function ExtractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ExtractedData | null>(null);
  const [editData, setEditData] = useState<ExtractedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [requirementStatus, setRequirementStatus] = useState("");
  const [retrying, setRetrying] = useState(false);
  const { poll: pollExtract, status: extractJobStatus } = useAiJob();
  const { poll: pollGenerate, status: generateJobStatus } = useAiJob();

  function loadRequirement() {
    setLoading(true);
    fetch(`/api/requirements/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setRequirementStatus(d.status);
          if (d.extractedJson) {
            const parsed = typeof d.extractedJson === "string" ? JSON.parse(d.extractedJson) : d.extractedJson;
            setData(parsed);
            setEditData(parsed);
          }
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/requirements/${id}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setRequirementStatus(d.status);
          if (d.extractedJson) {
            const parsed = typeof d.extractedJson === "string" ? JSON.parse(d.extractedJson) : d.extractedJson;
            setData(parsed);
            setEditData(parsed);
          }
        }
      })
      .catch((e) => { if (e.name !== "AbortError") setError("加载失败"); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const res = await fetch("/api/extract?async=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId: id }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "重试失败");
        return;
      }
      if (d.async && d.jobId) {
        try {
          await pollExtract(d.jobId);
          toast.success("重新萃取成功");
          loadRequirement();
        } catch {
          toast.error("萃取失败，请重试");
        }
      } else {
        toast.success("重新萃取成功");
        loadRequirement();
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setRetrying(false);
    }
  }

  async function handleSave() {
    if (!editData) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/requirements/${id}/extracted`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        toast.error("保存失败");
        return;
      }
      setData(editData);
      setEditing(false);
      toast.success("已保存");
    } catch {
      toast.error("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePRD() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-prd?async=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId: id }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "PRD 生成失败");
        return;
      }
      if (d.async && d.jobId) {
        try {
          await pollGenerate(d.jobId);
          toast.success("PRD 生成完成");
          router.push(`/prd/${id}`);
        } catch {
          toast.error("PRD 生成失败，请重试");
        }
      } else {
        toast.success("PRD 生成完成");
        router.push(`/prd/${id}`);
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setGenerating(false);
    }
  }

  function updateField<K extends keyof ExtractedData>(
    key: K,
    value: ExtractedData[K]
  ) {
    setEditData((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function getArrayField(
    data: ExtractedData,
    field: ArrayFieldName
  ): string[] {
    return (data[field] as string[] | undefined) ?? [];
  }

  function updateArrayItem(
    field: ArrayFieldName,
    index: number,
    value: string
  ) {
    setEditData((prev) => {
      if (!prev) return prev;
      const arr = [...getArrayField(prev, field)];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  }

  function addArrayItem(
    field: ArrayFieldName
  ) {
    setEditData((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: [...getArrayField(prev, field), ""] };
    });
  }

  function removeArrayItem(
    field: ArrayFieldName,
    index: number
  ) {
    setEditData((prev) => {
      if (!prev) return prev;
      const arr = [...getArrayField(prev, field)];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
  }

  if (loading) return <LoadingState />;

  if (retrying) {
    const statusText = extractJobStatus === "queued" ? "排队等待中..." : "AI 正在重新萃取...";
    return <AILoadingState text={statusText} />;
  }

  if (generating) {
    const statusText = generateJobStatus === "queued" ? "排队等待中..." : "AI 正在生成 PRD...";
    return <AILoadingState text={statusText} />;
  }

  if (error) return <ErrorState text={error} />;

  if (!data) {
    if (requirementStatus === "failed") {
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-0 rounded-xl" style={{ background: "#c64545" }}>
            <CardContent className="py-8 text-center">
              <p className="text-lg font-medium text-white mb-1" style={{ fontFamily: "var(--font-heading)" }}>AI 萃取失败</p>
              <p className="text-sm text-white/80 mb-4">上次萃取过程中出现错误，请重试</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-md" onClick={() => router.push("/requirements")}>返回列表</Button>
                <Button className="bg-white text-[#141413] hover:bg-white/90 rounded-md" onClick={handleRetry} disabled={retrying}>
                  {retrying ? "重试中..." : "重新萃取"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <ErrorState text="未找到萃取结果" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>萃取结果</h1>
            <p className="text-[13px] text-[#6c6a64]">需求 ID: {id.slice(0, 8)}...</p>
          </div>
          <StatusBadge status={requirementStatus} />
          {data.priority && <PriorityBadge priority={data.priority} />}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/requirements")}>
            返回列表
          </Button>
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setEditData(data); setEditing(false); }}>
                取消
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存修改"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                编辑
              </Button>
              <Button size="sm" onClick={handleGeneratePRD} disabled={generating}>
                {generating ? "生成中..." : "生成 PRD"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {editing && editData ? (
        <EditForm
          data={editData}
          updateField={updateField}
          updateArrayItem={updateArrayItem}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      ) : (
        <ExtractionResult data={data} />
      )}

      {!editing && (
        <>
          <CustomerImpactPanel requirementId={id} />
          <RelatedRequirements requirementId={id} />
        </>
      )}
    </div>
  );
}

function EditForm({
  data,
  updateField,
  updateArrayItem,
  addArrayItem,
  removeArrayItem,
}: {
  data: ExtractedData;
  updateField: <K extends keyof ExtractedData>(key: K, value: ExtractedData[K]) => void;
  updateArrayItem: (field: ArrayFieldName, index: number, value: string) => void;
  addArrayItem: (field: ArrayFieldName) => void;
  removeArrayItem: (field: ArrayFieldName, index: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-medium">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>需求标题</Label>
            <Input
              value={data.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>优先级</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={data.priority}
              onChange={(e) => updateField("priority", e.target.value as "P0" | "P1" | "P2")}
            >
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>客户角色</Label>
            <Input
              value={data.customerRole}
              onChange={(e) => updateField("customerRole", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>业务场景</Label>
            <Input
              value={data.scenario}
              onChange={(e) => updateField("scenario", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Core Requirements */}
      <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-medium">核心需求</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ArrayField
            label="痛点"
            field="painPoints"
            items={data.painPoints ?? []}
            updateItem={updateArrayItem}
            addItem={addArrayItem}
            removeItem={removeArrayItem}
          />
          <ArrayField
            label="目标"
            field="goals"
            items={data.goals ?? []}
            updateItem={updateArrayItem}
            addItem={addArrayItem}
            removeItem={removeArrayItem}
          />
          <ArrayField
            label="约束条件"
            field="constraints"
            items={data.constraints ?? []}
            updateItem={updateArrayItem}
            addItem={addArrayItem}
            removeItem={removeArrayItem}
          />
          <ArrayField
            label="待确认问题"
            field="openQuestions"
            items={data.openQuestions ?? []}
            updateItem={updateArrayItem}
            addItem={addArrayItem}
            removeItem={removeArrayItem}
          />
        </CardContent>
      </Card>

      {/* AI Deep Analysis */}
      <Card className="border-0 rounded-xl" style={{ background: "var(--surface-dark)" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] font-medium flex items-center gap-2 text-[#faf9f5]">
            AI 深度分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ArrayField
            label="隐含需求"
            field="hiddenNeeds"
            items={data.hiddenNeeds ?? []}
            updateItem={updateArrayItem}
            addItem={addArrayItem}
            removeItem={removeArrayItem}
          />
          <ArrayField
            label="利益相关者"
            field="stakeholders"
            items={data.stakeholders ?? []}
            updateItem={updateArrayItem}
            addItem={addArrayItem}
            removeItem={removeArrayItem}
          />
          <ArrayField
            label="成功指标"
            field="successMetrics"
            items={data.successMetrics ?? []}
            updateItem={updateArrayItem}
            addItem={addArrayItem}
            removeItem={removeArrayItem}
          />
          <ArrayField
            label="假设条件"
            field="assumptions"
            items={data.assumptions ?? []}
            updateItem={updateArrayItem}
            addItem={addArrayItem}
            removeItem={removeArrayItem}
          />
        </CardContent>
      </Card>
    </div>
  );
}

type ArrayFieldName = "painPoints" | "goals" | "constraints" | "openQuestions" | "hiddenNeeds" | "stakeholders" | "successMetrics" | "assumptions";

function ArrayField({
  label,
  field,
  items,
  updateItem,
  addItem,
  removeItem,
}: {
  label: string;
  field: ArrayFieldName;
  items: string[];
  updateItem: (field: ArrayFieldName, index: number, value: string) => void;
  addItem: (field: ArrayFieldName) => void;
  removeItem: (field: ArrayFieldName, index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button variant="ghost" size="sm" onClick={() => addItem(field)}>
          + 添加
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateItem(field, i, e.target.value)}
            placeholder={`${label} ${i + 1}`}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removeItem(field, i)}
          >
            &times;
          </Button>
        </div>
      ))}
    </div>
  );
}
