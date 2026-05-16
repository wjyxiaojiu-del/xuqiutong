"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface FeishuImportProps {
  onSuccess?: (data: { id: string; title: string }) => void;
}

export function FeishuImport({ onSuccess }: FeishuImportProps) {
  const [url, setUrl] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleImport() {
    if (!url.trim()) {
      toast.error("请输入飞书文档链接");
      return;
    }

    if (!url.includes("feishu.cn") && !url.includes("larksuite.com")) {
      toast.error("请输入有效的飞书文档链接");
      return;
    }

    setLoading(true);
    setProgress(0);

    // 模拟进度条动画
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const res = await fetch("/api/feishu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          customerName: customerName || undefined,
          company: company || undefined,
        }),
      });

      const data = await res.json();
      clearInterval(progressInterval);

      if (!res.ok) {
        setProgress(0);
        toast.error(data.error || "导入失败");
        return;
      }

      setProgress(100);
      toast.success(`导入成功：${data.title}`);

      // 延迟重置，让用户看到完成状态
      setTimeout(() => {
        setUrl("");
        setProgress(0);
        onSuccess?.(data);
      }, 800);
    } catch {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error("网络错误");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }

  return (
    <Card className="border rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
      {/* 进度条 */}
      {loading && (
        <div className="h-1 bg-blue-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            loading ? "bg-blue-500 animate-pulse" : "bg-blue-500"
          }`}>
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <CardTitle className="text-[16px] font-semibold">从飞书导入</CardTitle>
            <CardDescription className="text-[13px] mt-0.5">
              {loading ? "正在连接飞书服务器..." : "粘贴飞书文档链接，自动导入内容"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2.5">
          <Label className="text-[13px] font-medium text-[#3d3d3a]">飞书文档链接</Label>
          <div className="relative">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxx.feishu.cn/docx/xxxxx"
              className="font-mono text-sm pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
              disabled={loading}
            />
            {url && !loading && (
              <button
                onClick={() => setUrl("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c6a64] hover:text-[#141413] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-[#6c6a64] flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            支持飞书文档、多维表格等格式
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-[#3d3d3a]">客户名称（可选）</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="如：张伟"
              disabled={loading}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-[#3d3d3a]">公司（可选）</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="如：蓝海科技"
              disabled={loading}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <Button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className={`w-full h-11 text-[14px] font-medium transition-all duration-300 ${
            loading
              ? "bg-blue-500 cursor-wait"
              : "bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <div className="relative h-5 w-5">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <span>正在从飞书获取文档...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              从飞书导入
            </span>
          )}
        </Button>

        {/* 加载状态详情 */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-[12px] text-[#6c6a64] animate-fadeIn">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>预计需要 3-5 秒</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
