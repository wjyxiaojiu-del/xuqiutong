"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/schemas";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  pending: "#8e8b82",
  extracted: "#5db8a6",
  prd_generated: "#cc785c",
  reviewing: "#e8a55a",
  approved: "#5db872",
  rejected: "#c64545",
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "#cc785c",
  P1: "#e8a55a",
  P2: "#5db8a6",
};

interface DashboardData {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  recent: {
    id: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: string;
    customer: { name: string } | null;
  }[];
}

// 提效报告数据
const EFFICIENCY_DATA = {
  timeSavings: [
    { name: "收集反馈", traditional: 77, withTool: 38, saved: 39 },
    { name: "整理反馈", traditional: 113, withTool: 46, saved: 67 },
    { name: "萃取需求", traditional: 158, withTool: 46, saved: 112 },
    { name: "撰写PRD", traditional: 311, withTool: 109, saved: 202 },
    { name: "审核PRD", traditional: 77, withTool: 46, saved: 31 },
    { name: "修改PRD", traditional: 128, withTool: 64, saved: 64 },
    { name: "版本管理", traditional: 38, withTool: 11, saved: 27 },
    { name: "查找历史", traditional: 27, withTool: 7, saved: 20 },
  ],
  satisfaction: [
    { subject: "易用性", score: 3.97, fullMark: 5 },
    { subject: "节省时间", score: 4.50, fullMark: 5 },
    { subject: "质量提升", score: 4.00, fullMark: 5 },
    { subject: "总体满意度", score: 4.52, fullMark: 5 },
  ],
  roi: {
    totalSavedPerReq: 561, // 分钟
    efficiencyGain: 60.5, // 百分比
    monthlyHoursPerPerson: 280.7,
    yearlyHoursPerPerson: 3368,
    yearlyDaysPerPerson: 421,
    teamOf10YearlyHours: 33684,
    equivalentHeadcount: 15.9,
  },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!data) return <div className="text-center py-10 text-[#6c6a64]">加载失败</div>;

  const statusData = Object.entries(STATUS_LABELS)
    .map(([key, label]) => ({
      name: label,
      value: data.byStatus[key] || 0,
      key,
    }))
    .filter((d) => d.value > 0);

  const priorityData = Object.entries(PRIORITY_LABELS)
    .map(([key, label]) => ({
      name: label,
      value: data.byPriority[key] || 0,
      key,
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>数据看板</h1>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader className="pb-1">
            <CardTitle className="text-[12px] text-[#6c6a64] uppercase tracking-widest font-medium">需求总数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-normal" style={{ fontFamily: "var(--font-heading)" }}>{data.total}</p>
          </CardContent>
        </Card>
        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
          <Card key={key} className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-[12px] text-[#6c6a64] uppercase tracking-widest font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal" style={{ fontFamily: "var(--font-heading)" }}>{data.byPriority[key] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader>
            <CardTitle className="text-[14px] font-medium">状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            {data.total === 0 ? (
              <p className="text-[14px] text-[#6c6a64] text-center py-8">暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}`}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader>
            <CardTitle className="text-[14px] font-medium">优先级分布</CardTitle>
          </CardHeader>
          <CardContent>
            {data.total === 0 ? (
              <p className="text-[14px] text-[#6c6a64] text-center py-8">暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent requirements */}
      <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
        <CardHeader>
          <CardTitle className="text-[14px] font-medium">最近更新</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="text-[14px] text-[#6c6a64]">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {data.recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/prd/${r.id}`}
                  className="flex items-center justify-between rounded-lg p-3 transition-colors -mx-3"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-cream-strong)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">{r.title || "未命名"}</p>
                    <p className="text-[13px] text-[#6c6a64]">
                      {r.customer?.name || "未知客户"} · {new Date(r.updatedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <PriorityBadge priority={r.priority} />
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== 提效报告 ==================== */}
      <div className="pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>提效报告</h2>
            <p className="text-[13px] text-[#6c6a64]">基于 500 份模拟问卷调查的深度分析</p>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <Card className="border-0 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <CardContent className="pt-6 pb-5">
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>60.5%</p>
              <p className="text-[13px] text-white/80 mt-1">整体效率提升</p>
            </CardContent>
          </Card>
          <Card className="border-0 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" }}>
            <CardContent className="pt-6 pb-5">
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>9.4h</p>
              <p className="text-[13px] text-white/80 mt-1">每需求节省时间</p>
            </CardContent>
          </Card>
          <Card className="border-0 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
            <CardContent className="pt-6 pb-5">
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>4.52</p>
              <p className="text-[13px] text-white/80 mt-1">用户满意度(5分)</p>
            </CardContent>
          </Card>
          <Card className="border-0 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" }}>
            <CardContent className="pt-6 pb-5">
              <p className="text-3xl font-bold text-[#141413]" style={{ fontFamily: "var(--font-heading)" }}>15.9</p>
              <p className="text-[13px] text-[#6c6a64] mt-1">10人团队等效增员</p>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* 时间节省对比图 */}
          <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader>
              <CardTitle className="text-[14px] font-medium">各环节时间节省对比（分钟）</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={EFFICIENCY_DATA.timeSavings} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        traditional: "传统方式",
                        withTool: "使用工具",
                      };
                      return [`${value} 分钟`, labels[name as string] || name];
                    }}
                  />
                  <Bar dataKey="traditional" fill="#FF6384" radius={[0, 4, 4, 0]} name="traditional" />
                  <Bar dataKey="withTool" fill="#36A2EB" radius={[0, 4, 4, 0]} name="withTool" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: "#FF6384" }} />
                  <span className="text-[12px] text-[#6c6a64]">传统方式</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: "#36A2EB" }} />
                  <span className="text-[12px] text-[#6c6a64]">使用工具</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 满意度雷达图 */}
          <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader>
              <CardTitle className="text-[14px] font-medium">用户满意度评分</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={EFFICIENCY_DATA.satisfaction}>
                  <PolarGrid stroke="#e6dfd8" />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} />
                  <Radar
                    name="满意度"
                    dataKey="score"
                    stroke="#764ba2"
                    fill="#764ba2"
                    fillOpacity={0.3}
                  />
                  <Tooltip formatter={(value) => [`${value} 分`, "满意度"]} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 节省比例详情 */}
        <Card className="border rounded-xl mb-6" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader>
            <CardTitle className="text-[14px] font-medium">各环节节省比例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {EFFICIENCY_DATA.timeSavings.map((item) => {
                const percentage = Math.round((item.saved / item.traditional) * 100);
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium">{item.name}</span>
                      <span className="text-[13px] font-semibold" style={{ color: percentage >= 70 ? "#5db872" : percentage >= 50 ? "#e8a55a" : "#cc785c" }}>
                        -{percentage}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-cream-strong)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: "100%",
                              background: "#FF6384",
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-[#6c6a64] mt-1">传统：{item.traditional}分钟</p>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-cream-strong)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${(item.withTool / item.traditional) * 100}%`,
                              background: "#36A2EB",
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-[#6c6a64] mt-1">工具：{item.withTool}分钟</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ROI 投资回报 */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader>
              <CardTitle className="text-[14px] font-medium">个人投资回报</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-cream-strong)" }}>
                <div>
                  <p className="text-[13px] text-[#6c6a64]">每月节省时间</p>
                  <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "#667eea" }}>
                    {EFFICIENCY_DATA.roi.monthlyHoursPerPerson}h
                  </p>
                </div>
                <svg className="h-8 w-8 text-[#667eea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-cream-strong)" }}>
                <div>
                  <p className="text-[13px] text-[#6c6a64]">每年节省时间</p>
                  <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "#11998e" }}>
                    {EFFICIENCY_DATA.roi.yearlyHoursPerPerson.toLocaleString()}h
                  </p>
                </div>
                <svg className="h-8 w-8 text-[#11998e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-cream-strong)" }}>
                <div>
                  <p className="text-[13px] text-[#6c6a64]">相当于工作日</p>
                  <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "#f5576c" }}>
                    {EFFICIENCY_DATA.roi.yearlyDaysPerPerson} 天
                  </p>
                </div>
                <svg className="h-8 w-8 text-[#f5576c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
            <CardHeader>
              <CardTitle className="text-[14px] font-medium">团队投资回报（10人）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-cream-strong)" }}>
                <div>
                  <p className="text-[13px] text-[#6c6a64]">每年节省总时间</p>
                  <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "#667eea" }}>
                    {EFFICIENCY_DATA.roi.teamOf10YearlyHours.toLocaleString()}h
                  </p>
                </div>
                <svg className="h-8 w-8 text-[#667eea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-cream-strong)" }}>
                <div>
                  <p className="text-[13px] text-[#6c6a64]">等效增加人力</p>
                  <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "#11998e" }}>
                    {EFFICIENCY_DATA.roi.equivalentHeadcount} 人
                  </p>
                </div>
                <svg className="h-8 w-8 text-[#11998e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)" }}>
                <p className="text-[13px] font-medium text-[#3d3d3a] mb-2">核心价值</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-[12px] text-[#6c6a64]">
                    <svg className="h-4 w-4 text-[#5db872] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI 自动萃取需求，效率提升 71%
                  </li>
                  <li className="flex items-start gap-2 text-[12px] text-[#6c6a64]">
                    <svg className="h-4 w-4 text-[#5db872] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    PRD 自动生成，节省 65% 撰写时间
                  </li>
                  <li className="flex items-start gap-2 text-[12px] text-[#6c6a64]">
                    <svg className="h-4 w-4 text-[#5db872] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    版本管理自动化，效率提升 75%
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
