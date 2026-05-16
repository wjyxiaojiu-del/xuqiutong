"use client";

import type { DiffLine } from "@/lib/diff";

export function VersionDiffViewer({ diffLines }: { diffLines: DiffLine[] }) {
  if (diffLines.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">无差异</p>;
  }

  return (
    <div className="border rounded-md overflow-hidden text-sm font-mono">
      {diffLines.map((line, i) => (
        <div
          key={i}
          className={`flex ${
            line.type === "added"
              ? "bg-green-50"
              : line.type === "removed"
              ? "bg-red-50"
              : ""
          }`}
        >
          <span className="w-10 shrink-0 text-right pr-2 text-xs text-muted-foreground border-r bg-muted/50 select-none">
            {line.lineNoOld ?? ""}
          </span>
          <span className="w-10 shrink-0 text-right pr-2 text-xs text-muted-foreground border-r bg-muted/50 select-none">
            {line.lineNoNew ?? ""}
          </span>
          <span
            className={`px-2 py-0.5 flex-1 whitespace-pre-wrap break-all ${
              line.type === "added"
                ? "text-green-800"
                : line.type === "removed"
                ? "text-red-800 line-through"
                : "text-foreground"
            }`}
          >
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
            {" "}
            {line.content}
          </span>
        </div>
      ))}
    </div>
  );
}
