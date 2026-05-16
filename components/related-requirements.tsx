"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RelatedItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  customerName: string;
  score: number;
}

export function RelatedRequirements({ requirementId }: { requirementId: string }) {
  const router = useRouter();
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/requirements/${requirementId}/related`)
      .then((r) => r.json())
      .then((d) => setRelated(d.related ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requirementId]);

  if (loading || related.length === 0) return null;

  return (
    <Card className="border rounded-xl" style={{ background: "#e8a55a/10", borderColor: "#e8a55a/20" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[14px] font-medium text-[#141413]">
          相关需求推荐
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {related.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-lg p-2.5 cursor-pointer hover:bg-[#e8a55a]/10 transition-colors"
            style={{ background: "var(--background)" }}
            onClick={() => router.push(`/extract/${r.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{r.title}</p>
              <p className="text-[12px] text-[#6c6a64]">
                {r.customerName}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className="text-[12px] text-[#6c6a64] font-medium">
                {r.score}%
              </span>
              <PriorityBadge priority={r.priority} />
              <StatusBadge status={r.status} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
