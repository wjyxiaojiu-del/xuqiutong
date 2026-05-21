/**
 * 需求通 - 模拟问卷调查脚本
 * 计算使用项目前后各环节的时间节省
 */

interface SurveyResponse {
  // 用户基本信息
  role: "产品经理" | "项目经理" | "业务分析师" | "开发工程师" | "设计师";
  companySize: "小型(1-50人)" | "中型(51-200人)" | "大型(201-1000人)" | "超大型(1000+人)";
  industry: string;

  // 传统方式耗时（分钟）
  traditional: {
    collectFeedback: number;      // 收集客户反馈
    organizeFeedback: number;     // 整理归类反馈
    extractRequirements: number;  // 萃取结构化需求
    writePRD: number;             // 撰写PRD文档
    reviewPRD: number;            // 审核PRD
    revisePRD: number;            // 修改PRD
    manageVersions: number;       // 版本管理
    searchHistory: number;        // 查找历史需求
  };

  // 使用需求通后耗时（分钟）
  withTool: {
    collectFeedback: number;
    organizeFeedback: number;
    extractRequirements: number;
    writePRD: number;
    reviewPRD: number;
    revisePRD: number;
    manageVersions: number;
    searchHistory: number;
  };

  // 满意度评分（1-5）
  satisfaction: {
    easeOfUse: number;
    timeSaving: number;
    qualityImprovement: number;
    overallSatisfaction: number;
  };
}

// 随机数生成器
function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机选择
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 角色配置
const roles: SurveyResponse["role"][] = [
  "产品经理", "产品经理", "产品经理",  // 产品经理占比更高
  "项目经理", "项目经理",
  "业务分析师",
  "开发工程师",
  "设计师"
];

const companySizes: SurveyResponse["companySize"][] = [
  "小型(1-50人)", "小型(1-50人)",
  "中型(51-200人)", "中型(51-200人)", "中型(51-200人)",
  "大型(201-1000人)", "大型(201-1000人)",
  "超大型(1000+人)"
];

const industries = [
  "互联网/软件", "互联网/软件", "互联网/软件",
  "制造业", "制造业",
  "金融", "金融",
  "零售/电商", "零售/电商",
  "医疗健康",
  "教育",
  "房地产",
  "物流/供应链",
  "农业/食品",
  "能源/环保"
];

// 生成单份问卷
function generateSurveyResponse(): SurveyResponse {
  const role = randomChoice(roles);
  const companySize = randomChoice(companySizes);
  const industry = randomChoice(industries);

  // 基础耗时（根据角色和公司规模调整）
  const sizeMultiplier = companySize.includes("小型") ? 0.7 :
                         companySize.includes("中型") ? 1.0 :
                         companySize.includes("大型") ? 1.3 : 1.5;

  const roleMultiplier = role === "产品经理" ? 1.2 :
                         role === "业务分析师" ? 1.1 :
                         role === "项目经理" ? 1.0 : 0.8;

  // 传统方式耗时
  const traditional = {
    collectFeedback: random(30, 120) * sizeMultiplier,
    organizeFeedback: random(45, 180) * sizeMultiplier,
    extractRequirements: random(60, 240) * roleMultiplier,
    writePRD: random(120, 480) * roleMultiplier,
    reviewPRD: random(30, 120) * sizeMultiplier,
    revisePRD: random(60, 180) * roleMultiplier,
    manageVersions: random(15, 60) * sizeMultiplier,
    searchHistory: random(10, 45) * sizeMultiplier,
  };

  // 使用工具后耗时（节省 40-70%）
  const withTool = {
    collectFeedback: traditional.collectFeedback * random(40, 60) / 100,
    organizeFeedback: traditional.organizeFeedback * random(30, 50) / 100,
    extractRequirements: traditional.extractRequirements * random(20, 40) / 100,
    writePRD: traditional.writePRD * random(25, 45) / 100,
    reviewPRD: traditional.reviewPRD * random(50, 70) / 100,
    revisePRD: traditional.revisePRD * random(40, 60) / 100,
    manageVersions: traditional.manageVersions * random(20, 40) / 100,
    searchHistory: traditional.searchHistory * random(15, 35) / 100,
  };

  // 满意度评分
  const satisfaction = {
    easeOfUse: random(3, 5),
    timeSaving: random(4, 5),
    qualityImprovement: random(3, 5),
    overallSatisfaction: random(4, 5),
  };

  return { role, companySize, industry, traditional, withTool, satisfaction };
}

// 统计分析
function analyzeSurvey(responses: SurveyResponse[]) {
  const totalResponses = responses.length;

  // 按角色统计
  const byRole: Record<string, number> = {};
  responses.forEach(r => {
    byRole[r.role] = (byRole[r.role] || 0) + 1;
  });

  // 按公司规模统计
  const byCompanySize: Record<string, number> = {};
  responses.forEach(r => {
    byCompanySize[r.companySize] = (byCompanySize[r.companySize] || 0) + 1;
  });

  // 按行业统计
  const byIndustry: Record<string, number> = {};
  responses.forEach(r => {
    byIndustry[r.industry] = (byIndustry[r.industry] || 0) + 1;
  });

  // 计算各环节平均节省时间
  const timeSavings = {
    collectFeedback: { traditional: 0, withTool: 0, saved: 0, percentage: 0 },
    organizeFeedback: { traditional: 0, withTool: 0, saved: 0, percentage: 0 },
    extractRequirements: { traditional: 0, withTool: 0, saved: 0, percentage: 0 },
    writePRD: { traditional: 0, withTool: 0, saved: 0, percentage: 0 },
    reviewPRD: { traditional: 0, withTool: 0, saved: 0, percentage: 0 },
    revisePRD: { traditional: 0, withTool: 0, saved: 0, percentage: 0 },
    manageVersions: { traditional: 0, withTool: 0, saved: 0, percentage: 0 },
    searchHistory: { traditional: 0, withTool: 0, saved: 0, percentage: 0 },
  };

  const keys = Object.keys(timeSavings) as (keyof typeof timeSavings)[];

  responses.forEach(r => {
    keys.forEach(key => {
      timeSavings[key].traditional += r.traditional[key];
      timeSavings[key].withTool += r.withTool[key];
    });
  });

  keys.forEach(key => {
    timeSavings[key].traditional /= totalResponses;
    timeSavings[key].withTool /= totalResponses;
    timeSavings[key].saved = timeSavings[key].traditional - timeSavings[key].withTool;
    timeSavings[key].percentage = (timeSavings[key].saved / timeSavings[key].traditional) * 100;
  });

  // 总时间节省
  const totalTraditional = keys.reduce((sum, key) => sum + timeSavings[key].traditional, 0);
  const totalWithTool = keys.reduce((sum, key) => sum + timeSavings[key].withTool, 0);
  const totalSaved = totalTraditional - totalWithTool;
  const totalPercentage = (totalSaved / totalTraditional) * 100;

  // 满意度统计
  const satisfaction = {
    easeOfUse: responses.reduce((sum, r) => sum + r.satisfaction.easeOfUse, 0) / totalResponses,
    timeSaving: responses.reduce((sum, r) => sum + r.satisfaction.timeSaving, 0) / totalResponses,
    qualityImprovement: responses.reduce((sum, r) => sum + r.satisfaction.qualityImprovement, 0) / totalResponses,
    overallSatisfaction: responses.reduce((sum, r) => sum + r.satisfaction.overallSatisfaction, 0) / totalResponses,
  };

  // ROI 计算
  const monthlyTimeSavedPerPerson = (totalSaved / 60) * 30; // 假设每月处理 30 个需求
  const yearlyTimeSavedPerPerson = monthlyTimeSavedPerPerson * 12;

  return {
    totalResponses,
    byRole,
    byCompanySize,
    byIndustry,
    timeSavings,
    totalTraditional,
    totalWithTool,
    totalSaved,
    totalPercentage,
    satisfaction,
    roi: {
      monthlyHoursSavedPerPerson: monthlyTimeSavedPerPerson,
      yearlyHoursSavedPerPerson: yearlyTimeSavedPerPerson,
      yearlyDaysSavedPerPerson: yearlyTimeSavedPerPerson / 8,
    }
  };
}

// 生成报告
function generateReport(analysis: ReturnType<typeof analyzeSurvey>) {
  const report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        需求通 - 模拟问卷调查报告                              ║
║                        样本量：${analysis.totalResponses} 份                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 一、样本分布

【按角色分布】
${Object.entries(analysis.byRole).map(([role, count]) =>
  `  ${role}: ${count} 人 (${((count / analysis.totalResponses) * 100).toFixed(1)}%)`
).join('\n')}

【按公司规模分布】
${Object.entries(analysis.byCompanySize).map(([size, count]) =>
  `  ${size}: ${count} 人 (${((count / analysis.totalResponses) * 100).toFixed(1)}%)`
).join('\n')}

【按行业分布】
${Object.entries(analysis.byIndustry)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([industry, count]) =>
    `  ${industry}: ${count} 人 (${((count / analysis.totalResponses) * 100).toFixed(1)}%)`
  ).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️ 二、各环节时间节省分析（单位：分钟/需求）

┌─────────────────────┬──────────────┬──────────────┬──────────────┬──────────┐
│ 环节                │ 传统方式     │ 使用工具后   │ 节省时间     │ 节省比例 │
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────┤
${Object.entries(analysis.timeSavings).map(([key, data]) => {
  const labels: Record<string, string> = {
    collectFeedback: '收集客户反馈',
    organizeFeedback: '整理归类反馈',
    extractRequirements: '萃取结构化需求',
    writePRD: '撰写PRD文档',
    reviewPRD: '审核PRD',
    revisePRD: '修改PRD',
    manageVersions: '版本管理',
    searchHistory: '查找历史需求',
  };
  return `│ ${labels[key].padEnd(18)} │ ${data.traditional.toFixed(1).padStart(10)} │ ${data.withTool.toFixed(1).padStart(10)} │ ${data.saved.toFixed(1).padStart(10)} │ ${(data.percentage.toFixed(1) + '%').padStart(8)} │`;
}).join('\n')}
├─────────────────────┼──────────────┼──────────────┼──────────────┼──────────┤
│ ${'总计'.padEnd(18)} │ ${analysis.totalTraditional.toFixed(1).padStart(10)} │ ${analysis.totalWithTool.toFixed(1).padStart(10)} │ ${analysis.totalSaved.toFixed(1).padStart(10)} │ ${(analysis.totalPercentage.toFixed(1) + '%').padStart(8)} │
└─────────────────────┴──────────────┴──────────────┴──────────────┴──────────┘

📈 三、核心发现

  ✅ 每个需求平均节省时间：${analysis.totalSaved.toFixed(1)} 分钟（${(analysis.totalSaved / 60).toFixed(1)} 小时）

  ✅ 整体效率提升：${analysis.totalPercentage.toFixed(1)}%

  ✅ 最大节省环节：
     1. 萃取结构化需求：节省 ${analysis.timeSavings.extractRequirements.percentage.toFixed(1)}%
     2. 撰写PRD文档：节省 ${analysis.timeSavings.writePRD.percentage.toFixed(1)}%
     3. 修改PRD：节省 ${analysis.timeSavings.revisePRD.percentage.toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 四、ROI（投资回报率）分析

  假设条件：
  • 每人每月处理 30 个需求
  • 每人每月工作 22 天，每天 8 小时

  【个人层面】
  • 每月节省时间：${analysis.roi.monthlyHoursSavedPerPerson.toFixed(1)} 小时
  • 每年节省时间：${analysis.roi.yearlyHoursSavedPerPerson.toFixed(1)} 小时（${analysis.roi.yearlyDaysSavedPerPerson.toFixed(1)} 个工作日）

  【团队层面（假设 10 人产品团队）】
  • 每年节省时间：${(analysis.roi.yearlyHoursSavedPerPerson * 10).toFixed(0)} 小时
  • 相当于增加人力：${(analysis.roi.yearlyHoursSavedPerPerson * 10 / (22 * 8 * 12)).toFixed(1)} 人

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ 五、用户满意度（5 分制）

  • 易用性评分：${'★'.repeat(Math.round(analysis.satisfaction.easeOfUse))}${'☆'.repeat(5 - Math.round(analysis.satisfaction.easeOfUse))} ${analysis.satisfaction.easeOfUse.toFixed(2)}

  • 节省时间评分：${'★'.repeat(Math.round(analysis.satisfaction.timeSaving))}${'☆'.repeat(5 - Math.round(analysis.satisfaction.timeSaving))} ${analysis.satisfaction.timeSaving.toFixed(2)}

  • 质量提升评分：${'★'.repeat(Math.round(analysis.satisfaction.qualityImprovement))}${'☆'.repeat(5 - Math.round(analysis.satisfaction.qualityImprovement))} ${analysis.satisfaction.qualityImprovement.toFixed(2)}

  • 总体满意度：${'★'.repeat(Math.round(analysis.satisfaction.overallSatisfaction))}${'☆'.repeat(5 - Math.round(analysis.satisfaction.overallSatisfaction))} ${analysis.satisfaction.overallSatisfaction.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 六、结论

  需求通项目通过 AI 自动化处理，显著提升了需求管理效率：

  1. 效率提升：整体效率提升 ${analysis.totalPercentage.toFixed(0)}%，每个需求节省 ${(analysis.totalSaved / 60).toFixed(1)} 小时

  2. 最大价值：在"萃取结构化需求"和"撰写PRD文档"两个环节，节省超过 60% 的时间

  3. 质量保证：AI 辅助确保需求文档的一致性和完整性

  4. 知识沉淀：版本管理和历史查找效率提升 70%+，促进团队知识积累

╚══════════════════════════════════════════════════════════════════════════════╝
`;

  return report;
}

// 主函数
async function main() {
  console.log("🎯 开始生成 500 份模拟问卷调查...\n");

  const responses: SurveyResponse[] = [];
  for (let i = 0; i < 500; i++) {
    responses.push(generateSurveyResponse());
  }

  console.log("📊 正在分析问卷数据...\n");
  const analysis = analyzeSurvey(responses);

  console.log("📝 生成调查报告...\n");
  const report = generateReport(analysis);

  console.log(report);

  // 保存报告到文件
  const fs = await import('fs');
  const reportPath = './survey-report.txt';
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ 报告已保存到: ${reportPath}`);
}

main();
