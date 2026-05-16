"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { LoadingState, EmptyState } from "@/components/loading-state";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/schemas";

interface RequirementItem {
  id: string;
  customerId: string | null;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; company: string } | null;
  _count: { comments: number };
}

export default function RequirementsPage() {
  const [items, setItems] = useState<RequirementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 20;

  function buildParams(p?: number) {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (keyword) params.set("keyword", keyword);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", String(p ?? page));
    params.set("pageSize", String(PAGE_SIZE));
    return params;
  }

  function fetchData(p?: number) {
    setLoading(true);
    const currentPage = p ?? page;
    fetch(`/api/requirements?${buildParams(currentPage)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.items) {
          setItems(d.items);
          setTotal(d.total);
        } else {
          setItems([]);
          setTotal(0);
        }
      })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    params.set("page", "1");
    params.set("pageSize", String(PAGE_SIZE));

    fetch(`/api/requirements?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.items) {
          setItems(d.items);
          setTotal(d.total);
        } else {
          setItems([]);
          setTotal(0);
        }
      })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter]);

  function handleSearch() {
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>需求列表</h1>
        <Link href="/new" className={buttonVariants()}>录入新需求</Link>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || "all"); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v || "all"); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部优先级</SelectItem>
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="搜索：标题、内容、客户、公司..."
            value={keyword}
            onChange={(e) => {
              const v = e.target.value;
              setKeyword(v);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                setPage(1);
                const params = new URLSearchParams();
                if (statusFilter !== "all") params.set("status", statusFilter);
                if (priorityFilter !== "all") params.set("priority", priorityFilter);
                if (v) params.set("keyword", v);
                params.set("page", "1");
                params.set("pageSize", String(PAGE_SIZE));
                setLoading(true);
                fetch(`/api/requirements?${params}`)
                  .then((r) => r.json())
                  .then((d) => { if (d.items) { setItems(d.items); setTotal(d.total); } })
                  .catch(() => {})
                  .finally(() => setLoading(false));
              }, 400);
            }}
            className="flex-1 min-w-[200px]"
          />
          <Button variant="outline" onClick={handleSearch}>
            搜索
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "收起" : "高级筛选"}
          </Button>
        </div>

        {showAdvanced && (
          <div className="flex gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">开始日期</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">结束日期</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); handleSearch(); }}>
              清除日期
            </Button>
          </div>
        )}

        {!loading && (
          <p className="text-sm text-muted-foreground">
            共 {total} 条需求
            {keyword && <> · 关键词: <span className="font-medium">&quot;{keyword}&quot;</span></>}
          </p>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState text="暂无需求，点击上方按钮录入" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>评论</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {item.title || "未命名需求"}
                </TableCell>
                <TableCell>
                  {item.customer
                    ? <Link href={`/customers/${item.customerId}`} className="text-[#cc785c] hover:underline">
                        {item.customer.name}{item.customer.company ? ` (${item.customer.company})` : ""}
                      </Link>
                    : "-"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={item.priority} />
                </TableCell>
                <TableCell>{item._count.comments}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(item.updatedAt).toLocaleDateString("zh-CN")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {(item.status === "failed" || item.status === "pending") && (
                      <Link href={`/extract/${item.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        {item.status === "failed" ? "重试" : "萃取"}
                      </Link>
                    )}
                    {item.status !== "pending" && item.status !== "failed" && (
                      <Link href={`/extract/${item.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>萃取</Link>
                    )}
                    {(item.status === "prd_generated" ||
                      item.status === "reviewing" ||
                      item.status === "approved" ||
                      item.status === "rejected") && (
                      <Link href={`/prd/${item.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>PRD</Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            第 {page} / {Math.ceil(total / PAGE_SIZE)} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => { const p = page - 1; setPage(p); fetchData(p); }}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
              onClick={() => { const p = page + 1; setPage(p); fetchData(p); }}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
