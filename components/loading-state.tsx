"use client";

import { useEffect, useState } from "react";

export function LoadingState({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e6dfd8] border-t-[#cc785c]" />
        <p className="text-[15px] text-[#6c6a64]">{text}</p>
      </div>
    </div>
  );
}

const AI_STEPS = [
  "正在连接 AI 服务...",
  "正在分析客户对话...",
  "正在提取关键需求...",
  "正在识别隐含需求...",
  "正在生成结构化结果...",
];

export function AILoadingState({ text }: { text?: string }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, AI_STEPS.length - 1));
    }, 5000);
    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 95));
    }, 800);
    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-5 max-w-xs w-full">
        <div className="relative">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e6dfd8] border-t-[#cc785c]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-medium text-[#141413]">{progress}%</span>
          </div>
        </div>
        <div className="w-full space-y-2">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-card)" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, background: "#cc785c" }}
            />
          </div>
          <p className="text-[13px] text-center text-[#6c6a64]">
            {text || AI_STEPS[step]}
          </p>
        </div>
        <div className="flex gap-1.5">
          {AI_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i <= step ? "bg-[#cc785c]" : "bg-[#e6dfd8]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ text = "暂无数据" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-card)" }}>
          <svg className="h-6 w-6 text-[#6c6a64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-[15px] text-[#6c6a64]">{text}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  text = "出错了",
  onRetry,
}: {
  text?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-14 w-14 rounded-xl bg-[#c64545]/10 flex items-center justify-center">
          <svg className="h-6 w-6 text-[#c64545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-[15px] text-[#c64545] font-medium">{text}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[15px] text-[#cc785c] font-medium hover:underline"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
