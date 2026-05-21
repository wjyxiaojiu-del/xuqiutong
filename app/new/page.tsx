"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AILoadingState } from "@/components/loading-state";
import { toast } from "sonner";
import { useAiJob } from "@/lib/hooks/use-ai-job";

const DEMO_CHAT = `客户：你好，我们最近在用你们的报表系统，有个问题想反馈一下。
客服：您好，请说。
客户：我们每次导出报表都只能导出 CSV 格式，但是我们部门同事都习惯用 Excel 做透视分析，能不能支持导出 Excel？
客服：好的，这个需求我记录一下。
客户：还有就是，我们的数据量比较大，每次导出超过几万行的时候页面就卡死了，等好久都没反应，最后还得重新来。
客服：这个确实是个问题，大数据量导出会超时。
客户：对，而且导出的字段是固定的，有些字段我们根本用不到，但也没办法去掉。能不能让我们自己选择要导出哪些字段？
客服：明白了，我把这些需求都整理一下提交给产品团队。`;

export default function NewRequirementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>("");
  const { poll, cancel, status } = useAiJob();
  const cancelledRef = useRef(false);
  const [form, setForm] = useState({
    rawInput: "",
    customerName: "",
    company: "",
    industry: "",
    contactName: "",
    scenario: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function fillDemo() {
    setForm((prev) => ({
      ...prev,
      rawInput: DEMO_CHAT,
      customerName: "李明",
      company: "示例科技有限公司",
      industry: "企业服务",
      scenario: "售前咨询 - 报表导出功能",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rawInput.trim()) {
      toast.error("请输入客户声音内容");
      return;
    }
    cancelledRef.current = false;
    setLoading(true);
    setJobStatus("提交中...");
    try {
      // 异步模式：先创建需求+任务，再轮询
      const res = await fetch("/api/extract?async=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "萃取失败");
        return;
      }

      if (data.async && data.jobId) {
        setJobStatus("AI 正在分析客户声音...");
        try {
          await poll(data.jobId);
          if (cancelledRef.current) return;
          toast.success("萃取完成");
          router.push(`/extract/${data.id}`);
        } catch (error) {
          if (cancelledRef.current) return;
          const message = error instanceof Error ? error.message : "萃取失败，请重试";
          toast.error(message === "已取消" ? "已取消分析" : message);
        }
      } else {
        // 兼容同步模式
        toast.success("萃取完成");
        router.push(`/extract/${data.id}`);
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
        setJobStatus("");
      }
    }
  }

  function handleCancel() {
    cancelledRef.current = true;
    cancel();
    setLoading(false);
    setJobStatus("");
    toast.info("已取消本次分析");
  }

  if (loading) {
    const statusText =
      status === "queued" ? "排队等待中..." :
      status === "running" ? "AI 正在分析客户声音..." :
      jobStatus || "处理中...";
    return (
      <AILoadingState
        text={`${statusText}（约 15-45 秒）`}
        actionLabel="取消分析"
        onAction={handleCancel}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>录入客户需求</h1>
        <p className="text-[#6c6a64]">
          粘贴客户聊天记录，AI 将自动萃取结构化需求信息
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader>
            <CardTitle className="text-[14px] font-medium">客户声音</CardTitle>
            <CardDescription className="text-[13px]">
              粘贴与客户的聊天记录、邮件内容或访谈笔记
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              name="rawInput"
              value={form.rawInput}
              onChange={handleChange}
              placeholder="粘贴客户聊天记录..."
              className="min-h-[200px]"
            />
            <Button type="button" variant="outline" size="sm" onClick={fillDemo}>
              填充演示数据
            </Button>
          </CardContent>
        </Card>

        <Card className="border rounded-xl" style={{ background: "var(--surface-card)", borderColor: "var(--border)" }}>
          <CardHeader>
            <CardTitle className="text-[14px] font-medium">客户信息（可选）</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">客户名称</Label>
              <Input
                id="customerName"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="如：李明"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">公司</Label>
              <Input
                id="company"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="如：示例科技有限公司"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">行业</Label>
              <Input
                id="industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="如：企业服务"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario">场景</Label>
              <Input
                id="scenario"
                name="scenario"
                value={form.scenario}
                onChange={handleChange}
                placeholder="如：售前咨询"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">
          提交并开始 AI 分析
        </Button>
      </form>
    </div>
  );
}
