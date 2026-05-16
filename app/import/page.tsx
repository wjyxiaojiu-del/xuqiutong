"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeishuImport } from "@/components/feishu-import";
import { toast } from "sonner";

interface ImportItem {
  rawInput: string;
  customerName?: string;
  company?: string;
  industry?: string;
  contactName?: string;
  scenario?: string;
}

export default function ImportPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"text" | "file" | "feishu">("file");
  const [textInput, setTextInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{
    count: number;
    requirements: { id: string; title: string }[];
  } | null>(null);

  function parseCSV(text: string): ImportItem[] {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const items: ImportItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      const rawInput =
        row["rawinput"] || row["raw_input"] || row["内容"] || row["需求内容"] || row["反馈内容"] || row["客户声音"] || "";
      if (!rawInput) continue;

      items.push({
        rawInput,
        customerName:
          row["customername"] || row["customer_name"] || row["客户"] || row["客户名称"] || undefined,
        company: row["company"] || row["公司"] || undefined,
        industry: row["industry"] || row["行业"] || undefined,
        contactName:
          row["contactname"] || row["contact_name"] || row["联系人"] || undefined,
        scenario: row["scenario"] || row["场景"] || undefined,
      });
    }

    return items;
  }

  function parseTXT(text: string): ImportItem[] {
    // 按空行或分隔符拆分
    const blocks = text.split(/\n\s*\n|\n---+\n|\n=+=+\n/).filter((b) => b.trim().length > 0);
    if (blocks.length === 0) {
      // 如果没有分隔符，按行拆分
      return text
        .split("\n")
        .filter((l) => l.trim().length > 10) // 至少10个字符才算一条
        .map((l) => ({ rawInput: l.trim() }));
    }
    return blocks.map((b) => ({ rawInput: b.trim() }));
  }

  function parseFileContent(text: string, ext: string): ImportItem[] {
    if (ext === "csv") {
      return parseCSV(text);
    }
    return parseTXT(text);
  }

  function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "txt";
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const items = parseFileContent(text, ext);
      if (items.length === 0) {
        toast.error("未能解析出有效需求，请检查文件格式");
        return;
      }
      setTextInput(items.map((it) => it.rawInput).join("\n\n"));
      if (items[0]?.customerName) setCustomerName(items[0].customerName);
      if (items[0]?.company) setCompany(items[0].company);
      if (items[0]?.industry) setIndustry(items[0].industry);
      toast.success(`解析到 ${items.length} 条需求`);
    };
    reader.readAsText(file);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  function parseTextToItems(): ImportItem[] {
    const lines = textInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return lines.map((line) => ({
      rawInput: line,
      customerName: customerName || undefined,
      company: company || undefined,
      industry: industry || undefined,
    }));
  }

  async function handleImport() {
    const items = parseTextToItems();
    if (items.length === 0) {
      toast.error("请输入至少一条需求");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, extractMode: "none" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "导入失败");
        return;
      }
      setResult(data);
      toast.success(`成功导入 ${data.count} 条需求`);
    } catch {
      toast.error("网络错误");
    } finally {
      setImporting(false);
    }
  }

  const previewItems = parseTextToItems();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>批量导入需求</h1>
        <p className="text-[13px] text-[#6c6a64] mt-1">
          上传客户反馈文件，快速批量录入需求
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            mode === "file"
              ? "border-[#cc785c] text-[#cc785c]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setMode("file")}
        >
          文件上传
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            mode === "text"
              ? "border-[#cc785c] text-[#cc785c]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setMode("text")}
        >
          文本粘贴
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            mode === "feishu"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setMode("feishu")}
        >
          飞书文档
        </button>
      </div>

      {mode === "file" && (
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardContent className="pt-6">
            {/* 拖拽上传区域 */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                dragging
                  ? "border-[#cc785c] bg-[#cc785c]/5"
                  : "border-[#e5e2db] hover:border-[#cc785c]"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.txt,.md,.markdown,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "var(--surface-cream-strong)" }}>
                  <svg className="h-6 w-6 text-[#cc785c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                {fileName ? (
                  <div>
                    <p className="text-[15px] font-medium text-[#141413]">{fileName}</p>
                    <p className="text-[13px] text-[#6c6a64]">文件已解析，查看下方预览</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[15px] font-medium text-[#141413]">
                      拖拽文件到此处，或点击上传
                    </p>
                    <p className="text-[13px] text-[#6c6a64]">
                      支持 CSV、TXT、Markdown 格式
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 格式说明 */}
            <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--surface-cream-strong)" }}>
              <p className="text-[13px] font-medium text-[#3d3d3a] mb-2">文件格式说明：</p>
              <ul className="text-[12px] text-[#6c6a64] space-y-1">
                <li><span className="font-medium">CSV</span>：表头行 + 数据行，支持列名 内容/客户/公司/行业/联系人/场景</li>
                <li><span className="font-medium">TXT/Markdown</span>：每行一条需求，或用空行分隔多条</li>
                <li><span className="font-medium">聊天记录</span>：直接粘贴客服对话，AI 会自动识别需求</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feishu import */}
      {mode === "feishu" && (
        <FeishuImport
          onSuccess={(data) => {
            router.push(`/extract/${data.id}`);
          }}
        />
      )}

      {/* Customer info */}
      <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-medium">客户信息（可选，批量共享）</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>客户名称</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="如：张伟"
            />
          </div>
          <div className="space-y-2">
            <Label>公司</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="如：蓝海科技"
            />
          </div>
          <div className="space-y-2">
            <Label>行业</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="如：制造业"
            />
          </div>
        </CardContent>
      </Card>

      {/* Text input / preview */}
      <div className="space-y-2">
        <Label>
          {mode === "text" ? "需求内容（每行一条）" : "解析结果预览"}
        </Label>
        <Textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={
            mode === "text"
              ? "我们工厂排产全靠Excel，想搞个自动排产系统...\n仓库扫码入库经常出错，需要自动核对...\n每次审批流程太长，希望能手机上直接审批..."
              : "上传文件后自动填充"
          }
          className="min-h-[200px]"
        />
        {previewItems.length > 0 && (
          <p className="text-xs text-[#6c6a64]">
            已识别 {previewItems.length} 条需求
          </p>
        )}
      </div>

      {/* Preview */}
      {previewItems.length > 0 && (
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-medium">导入预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {previewItems.slice(0, 20).map((item, i) => (
                <div key={i} className="p-3 text-sm">
                  <span className="text-[#6c6a64] mr-2 font-mono text-xs">#{i + 1}</span>
                  <span className="line-clamp-2">{item.rawInput}</span>
                </div>
              ))}
              {previewItems.length > 20 && (
                <div className="p-3 text-sm text-[#6c6a64]">
                  ...还有 {previewItems.length - 20} 条
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleImport}
          disabled={importing || previewItems.length === 0}
          className="bg-[#cc785c] hover:bg-[#cc785c]/90"
        >
          {importing ? "导入中..." : `导入 ${previewItems.length} 条需求`}
        </Button>
        <Button variant="outline" onClick={() => router.push("/requirements")}>
          返回列表
        </Button>
      </div>

      {/* Result */}
      {result && (
        <Card className="border-2 rounded-xl" style={{ borderColor: "#5db872" }}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-[#5db872]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[15px] font-medium text-[#3d8a52]">
                导入完成：共 {result.count} 条需求
              </p>
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {result.requirements.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="truncate flex-1">{r.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/extract/${r.id}`)}
                  >
                    萃取
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => router.push("/requirements")}
                className="bg-[#cc785c] hover:bg-[#cc785c]/90"
              >
                查看需求列表
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setTextInput("");
                  setFileName("");
                }}
              >
                继续导入
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
