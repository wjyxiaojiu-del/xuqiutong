"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LoadingState, EmptyState } from "@/components/loading-state";

interface CustomerItem {
  id: string;
  name: string;
  company: string;
  industry: string;
  contactName: string;
  _count: { requirements: number };
  requirements: { updatedAt: string }[];
}

export default function CustomersPage() {
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>客户档案</h1>
      </div>

      {items.length === 0 ? (
        <EmptyState text="暂无客户数据，录入需求时填写客户信息即可自动创建" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="border rounded-xl hover:shadow-md transition-shadow cursor-pointer h-full" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-[17px]">{c.name}</h3>
                      <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "var(--surface-cream-strong)", color: "#6c6a64" }}>
                        {c._count.requirements} 条需求
                      </span>
                    </div>
                    {c.company && (
                      <p className="text-[14px] text-[#6c6a64]">{c.company}</p>
                    )}
                    {c.industry && (
                      <p className="text-[13px] text-[#6c6a64]">行业：{c.industry}</p>
                    )}
                    {c.contactName && c.contactName !== c.name && (
                      <p className="text-[13px] text-[#6c6a64]">联系人：{c.contactName}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
