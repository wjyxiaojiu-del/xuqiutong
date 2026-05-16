# 调研发现

## 项目现状分析

### 技术栈
- Next.js 16.2.6（有breaking changes，需注意）
- Prisma 7.8.0 + PostgreSQL
- shadcn/ui + Tailwind CSS 4
- React 19.2.4

### 数据库模型
- Customer：客户基础信息
- Requirement：需求主表，含rawInput、extractedJson、prdMarkdown
- Comment：评论
- RequirementVersion：版本历史

### AI能力
- 支持 DeepSeek / OpenAI / Anthropic / Mock
- 有 Fallback 机制
- 萃取输出结构：title, customerRole, scenario, painPoints, goals, constraints, priority, evidence, openQuestions, hiddenNeeds, stakeholders, successMetrics, assumptions
- PRD生成含Mermaid流程图

### 现有API
- `/api/extract` - AI萃取（支持重试）
- `/api/import` - JSON批量导入
- `/api/generate-prd` - PRD生成
- `/api/comments` - 评论
- `/api/dashboard` - 仪表板
- `/api/customers` - 客户CRUD
- `/api/requirements` - 需求CRUD
- `/api/ai-status` - AI状态

### 关键发现
1. **无认证**：任何人可访问所有数据
2. **无org隔离**：所有需求在同一个namespace
3. **导入只支持JSON**：不支持CSV/Excel
4. **evidence已有结构**：但缺少行号、上下文、可信度
5. **状态流转有定义**：但审核流程简单

### Next.js 16 注意事项
- AGENTS.md 提示有 breaking changes
- 需要读 `node_modules/next/dist/docs/` 了解新API
- 使用 `--webpack` 启动 dev

## 竞品参考

### Productboard
- 成熟的客户反馈管理
- 强大的优先级评分
- 多种集成（Jira、Slack、Salesforce）
- 价格：$25-100/用户/月

### Dovetail
- 专注用户研究
- 强大的标注和分析
- 价格：$29-99/月

### 需求通的差异化
- 聚焦ToB软件团队
- 客户原声→PRD的完整链路
- 证据引用和可信度
- 更低的价格门槛
