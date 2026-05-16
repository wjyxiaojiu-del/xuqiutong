"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FeishuExportProps {
  requirementId: string;
  disabled?: boolean;
}

export function FeishuExport({ requirementId, disabled }: FeishuExportProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleExport() {
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/feishu/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "导出失败");
        return;
      }

      setSuccess(true);
      toast.success("已导出到飞书");

      // 打开飞书文档
      if (data.url) {
        window.open(data.url, "_blank");
      }

      // 延迟重置成功状态
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || loading}
      className={`gap-2 transition-all duration-300 ${
        success
          ? "border-green-500 text-green-600 bg-green-50"
          : loading
          ? "border-blue-500 text-blue-600 bg-blue-50 cursor-wait"
          : "hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-500/10 active:scale-[0.97]"
      }`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <span>正在创建飞书文档...</span>
        </div>
      ) : success ? (
        <div className="flex items-center gap-2 animate-fadeIn">
          <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>导出成功</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>导出到飞书</span>
        </div>
      )}
    </Button>
  );
}
