"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { LoadingState, ErrorState } from "@/components/loading-state";

interface CustomerData {
  id: string;
  name: string;
  company: string;
  industry: string;
  contactName: string;
  requirements: {
    id: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: string;
    _count: { comments: number };
  }[];
}

export default function CustomerPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setData(null);
        else setData(d);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState text="客户信息不存在" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>{data.name}</h1>
        <p className="text-[#6c6a64]">{data.company || "未填写公司"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[12px] text-[#6c6a64] uppercase tracking-widest font-medium">公司</CardTitle>
          </CardHeader>
          <CardContent className="text-[15px]">{data.company || "-"}</CardContent>
        </Card>
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[12px] text-[#6c6a64] uppercase tracking-widest font-medium">行业</CardTitle>
          </CardHeader>
          <CardContent className="text-[15px]">{data.industry || "-"}</CardContent>
        </Card>
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[12px] text-[#6c6a64] uppercase tracking-widest font-medium">联系人</CardTitle>
          </CardHeader>
          <CardContent className="text-[15px]">{data.contactName || "-"}</CardContent>
        </Card>
      </div>

      <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
        <CardHeader>
          <CardTitle className="text-[14px] font-medium">历史需求（{data.requirements.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          {data.requirements.length === 0 ? (
            <p className="text-[14px] text-[#6c6a64]">暂无需求记录</p>
          ) : (
            <div className="space-y-2">
              {data.requirements.map((r) => (
                <Link
                  key={r.id}
                  href={`/extract/${r.id}`}
                  className="flex items-center justify-between rounded-lg p-3 transition-colors -mx-3"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-cream-strong)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium truncate">{r.title || "未命名"}</p>
                      <PriorityBadge priority={r.priority} />
                    </div>
                    <p className="text-[13px] text-[#6c6a64] mt-0.5">
                      {new Date(r.updatedAt).toLocaleDateString("zh-CN")}
                      {r._count.comments > 0 && ` · ${r._count.comments} 条评论`}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
