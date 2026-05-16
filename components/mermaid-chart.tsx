"use client";

import { useEffect, useRef, useState } from "react";

export function MermaidChart({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });
        if (cancelled) return;

        const id = `mermaid-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!code) return null;

  if (error) {
    return (
      <pre className="rounded-md bg-muted p-4 text-sm overflow-x-auto">
        {code}
      </pre>
    );
  }

  return <div ref={containerRef} className="flex justify-center py-4" />;
}
