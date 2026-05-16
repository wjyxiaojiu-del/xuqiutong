"use client";

import { MermaidChart } from "@/components/mermaid-chart";

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const evidenceMatch = remaining.match(/【证据[^】]*】/);
    const inferMatch = remaining.match(/【推断[^】]*】/);
    const pendingMatch = remaining.match(/【待确认[^】]*】/);

    const matches = [
      evidenceMatch ? { m: evidenceMatch, type: "evidence" } : null,
      inferMatch ? { m: inferMatch, type: "infer" } : null,
      pendingMatch ? { m: pendingMatch, type: "pending" } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.m.index! - b!.m.index!);

    if (matches.length > 0) {
      const first = matches[0]!;
      if (first.m.index! > 0) {
        parts.push(remaining.slice(0, first.m.index!));
      }
      const colors: Record<string, string> = {
        evidence: "bg-[#5db872]/15 text-[#3d8a52] border border-[#5db872]/20",
        infer: "bg-[#e8a55a]/15 text-[#b8841a] border border-[#e8a55a]/20",
        pending: "bg-[#c64545]/15 text-[#c64545] border border-[#c64545]/20",
      };
      parts.push(
        <span
          key={key++}
          className={`inline-block text-[11px] font-medium px-1.5 py-0.5 rounded-full ${colors[first.type]}`}
        >
          {first.m[0]}
        </span>
      );
      remaining = remaining.slice(first.m.index! + first.m[0].length);
      continue;
    }

    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++} className="font-semibold text-[#faf9f5]">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    const codeMatch = remaining.match(/`(.*?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index));
      }
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded text-[12px] font-mono text-[#5db8a6]" style={{ background: "var(--surface-dark-soft)" }}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    parts.push(remaining);
    break;
  }

  return parts;
}

export function PrdViewer({
  prd,
  mermaid,
}: {
  prd: string;
  mermaid: string;
}) {
  const lines = prd.split("\n");

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-6" style={{ background: "var(--surface-dark)" }}>
        <div className="space-y-0">
          {lines.map((line, i) => {
            if (line.startsWith("# "))
              return (
                <h1 key={i} className="text-xl font-normal tracking-tight mt-6 mb-3 first:mt-0 text-[#faf9f5]" style={{ fontFamily: "var(--font-heading)" }}>
                  {renderInline(line.slice(2))}
                </h1>
              );
            if (line.startsWith("## "))
              return (
                <h2 key={i} className="text-[16px] font-medium tracking-tight mt-5 mb-2 pb-1.5 text-[#faf9f5]" style={{ borderColor: "var(--surface-dark-elevated)", borderBottom: "1px solid var(--surface-dark-elevated)" }}>
                  {renderInline(line.slice(3))}
                </h2>
              );
            if (line.startsWith("### "))
              return (
                <h3 key={i} className="text-[15px] font-medium mt-4 mb-1 text-[#faf9f5]">
                  {renderInline(line.slice(4))}
                </h3>
              );
            if (line.startsWith("- [ ] "))
              return (
                <div key={i} className="flex items-start gap-2 ml-4 py-0.5">
                  <input type="checkbox" disabled className="mt-1 rounded" style={{ borderColor: "var(--surface-dark-elevated)", background: "var(--surface-dark-soft)" }} />
                  <span className="text-[14px] leading-relaxed text-[#a09d96]">{renderInline(line.slice(6))}</span>
                </div>
              );
            if (line.startsWith("- "))
              return (
                <li key={i} className="ml-5 list-disc py-0.5 text-[14px] leading-relaxed text-[#a09d96]">
                  {renderInline(line.slice(2))}
                </li>
              );
            if (/^\d+\.\s/.test(line))
              return (
                <li key={i} className="ml-5 list-decimal py-0.5 text-[14px] leading-relaxed text-[#a09d96]">
                  {renderInline(line.replace(/^\d+\.\s/, ""))}
                </li>
              );
            if (line.trim() === "") return <div key={i} className="h-2" />;
            return <p key={i} className="text-[14px] leading-relaxed text-[#a09d96]">{renderInline(line)}</p>;
          })}
        </div>
      </div>
      {mermaid && (
        <div>
          <h3 className="text-[14px] font-medium mb-2 text-[#141413]">流程图</h3>
          <div className="rounded-xl p-4" style={{ background: "var(--surface-dark)" }}>
            <MermaidChart code={mermaid} />
          </div>
        </div>
      )}
    </div>
  );
}
