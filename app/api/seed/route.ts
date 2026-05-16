import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const CASES = [
  {
    customer: { name: "张伟", company: "蓝海科技有限公司", industry: "企业服务", contactName: "张伟" },
    title: "售前咨询：报表导出格式优化",
    scenario: "售前咨询 - 报表导出功能",
    priority: "P1",
  },
  {
    customer: { name: "王芳", company: "星辰教育科技", industry: "在线教育", contactName: "王芳" },
    title: "售后反馈：课程管理操作流程复杂",
    scenario: "售后反馈 - 课程管理系统",
    priority: "P0",
  },
  {
    customer: { name: "刘洋", company: "前沿制造集团", industry: "制造业", contactName: "刘洋" },
    title: "竞品对比：设备巡检流程数字化需求",
    scenario: "竞品对比 - 设备巡检系统",
    priority: "P0",
  },
];

const MOCK_EXTRACTED = [
  {
    title: "报表导出格式与性能优化",
    customerRole: "企业客户 - 数据分析师",
    scenario: "客户需要定期导出业务报表进行内部分析",
    painPoints: ["当前报表导出格式单一，只支持CSV", "大数据量导出时经常超时失败", "导出的字段不支持自定义选择"],
    goals: ["支持Excel、PDF等多种导出格式", "大数据量导出能异步处理，完成后通知", "允许用户自定义选择导出字段"],
    constraints: ["需要兼容现有报表模板", "导出文件大小不超过100MB"],
    priority: "P1" as const,
    evidence: [
      { quote: "能不能支持导出 Excel？", reason: "客户对导出格式有明确需求" },
      { quote: "每次导出超过几万行的时候页面就卡死了", reason: "大数据量导出存在性能瓶颈" },
    ],
    openQuestions: ["是否需要支持定时自动导出", "导出数据是否需要脱敏处理"],
    hiddenNeeds: [], stakeholders: [], successMetrics: [], assumptions: [],
  },
  {
    title: "课程管理后台体验优化",
    customerRole: "在线教育 - 课程运营主管",
    scenario: "客户需要高效管理大量课程内容和班级进度",
    painPoints: ["创建课程需7步，无法保存草稿", "章节不支持批量排序", "无法按班级设置差异化进度"],
    goals: ["简化课程创建流程，支持草稿保存", "支持章节批量排序和管理", "支持按班级设置课程进度"],
    constraints: ["需兼容现有课程数据", "不能影响已发布课程"],
    priority: "P0" as const,
    evidence: [
      { quote: "需要经过 7 个步骤才能发布，中间还不能保存草稿", reason: "创建流程过长且无草稿功能" },
      { quote: "调整章节顺序都得一个一个拖，没有批量操作", reason: "章节管理效率低" },
    ],
    openQuestions: ["是否需要课程模板功能", "班级进度差异化的粒度需求"],
    hiddenNeeds: [], stakeholders: [], successMetrics: [], assumptions: [],
  },
  {
    title: "设备巡检数字化系统",
    customerRole: "制造业 - 设备管理主管",
    scenario: "客户希望从纸质巡检升级为数字化巡检系统",
    painPoints: ["纸质巡检效率低", "巡检数据经常丢失", "异常情况层层上报效率低"],
    goals: ["扫码巡检，自动识别设备", "巡检结果自动生成报告", "异常自动推送主管"],
    constraints: ["需支持离线巡检（工厂网络不稳定）", "需兼容现有设备编码体系"],
    priority: "P0" as const,
    evidence: [
      { quote: "他们支持扫码巡检，工人到设备旁边扫一下二维码就能开始巡检", reason: "客户对扫码巡检有明确需求" },
      { quote: "我们现在还在用纸质表格巡检，效率很低，而且数据经常丢失", reason: "当前流程痛点明确" },
    ],
    openQuestions: ["设备数量和巡检频率", "是否需要离线模式"],
    hiddenNeeds: [], stakeholders: [], successMetrics: [], assumptions: [],
  },
];

export async function POST(request: NextRequest) {
  // 生产环境直接禁止
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "生产环境禁止重置数据" }, { status: 403 });
  }

  // 需要 SEED_SECRET 时校验 header
  const requiredSecret = process.env.SEED_SECRET;
  if (requiredSecret) {
    const provided = request.headers.get("x-seed-secret");
    if (provided !== requiredSecret) {
      return Response.json({ error: "密钥验证失败" }, { status: 403 });
    }
  }

  try {
    await prisma.comment.deleteMany();
    await prisma.requirementVersion.deleteMany();
    await prisma.requirement.deleteMany();
    await prisma.customer.deleteMany();

    for (let i = 0; i < CASES.length; i++) {
      const c = CASES[i];
      const customer = await prisma.customer.create({ data: c.customer });
      const extracted = MOCK_EXTRACTED[i];

      await prisma.requirement.create({
        data: {
          customerId: customer.id,
          title: c.title,
          rawInput: `[演示数据] ${c.title}`,
          scenario: c.scenario,
          sourceType: "text",
          status: "prd_generated",
          priority: c.priority,
          aiModel: "mock",
          extractedJson: extracted,
          prdMarkdown: `# ${extracted.title} PRD\n\n## 1. 背景\n${extracted.scenario}\n\n## 2. 用户与场景\n- ${extracted.customerRole}\n\n## 3. 问题定义\n${extracted.painPoints.map((p, j) => `${j + 1}. ${p}`).join("\n")}\n\n## 4. 目标\n${extracted.goals.map(g => `- ${g}`).join("\n")}\n\n## 5. 功能需求\n（演示数据）\n\n## 6. 验收标准\n- [ ] 待补充\n\n## 7. 待确认问题\n${extracted.openQuestions.map(q => `- ${q}`).join("\n")}`,
          mermaidCode: `flowchart TD\n    A[开始] --> B[处理]\n    B --> C[完成]`,
        },
      });
    }

    return Response.json({ success: true, count: CASES.length });
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json({ error: "重置失败" }, { status: 500 });
  }
}
