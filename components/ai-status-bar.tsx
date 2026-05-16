"use client";

import { useEffect, useState } from "react";

interface AIStatusData {
  provider: string;
  model: string;
  isMock: boolean;
  isFallback: boolean;
  fallbackChain: string[];
  lastError: string | null;
}

export function AIStatusBar() {
  const [status, setStatus] = useState<AIStatusData | null>(null);

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ${
          status.isMock
            ? "text-[#d4a017]"
            : "text-[#5db872]"
        }`}
        style={{ background: "var(--surface-card)" }}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status.isMock ? "bg-[#d4a017]" : "bg-[#5db872]"
          }`}
        />
        {status.isMock ? "Mock AI" : status.provider}
      </span>
      {!status.isMock && (
        <span className="text-[#6c6a64]">{status.model}</span>
      )}
      {status.isFallback && (
        <span className="rounded-full text-[#6c6a64] px-2.5 py-0.5 border" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          Fallback: {status.fallbackChain.join(" → ")}
        </span>
      )}
      {status.lastError && (
        <span className="rounded-full bg-[#c64545]/10 text-[#c64545] px-2.5 py-0.5 border border-[#c64545]/20 truncate max-w-[300px]">
          {status.lastError}
        </span>
      )}
    </div>
  );
}
