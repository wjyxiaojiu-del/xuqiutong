# 需求通技术规划：从AI工具到企业级客户声音处理系统

## 目标

将需求通从"AI PRD生成器"转型为"ToB客户反馈转PRD系统"，聚焦：客户原声→可追溯、可审核、可交付的研发需求。

## 当前状态

- **技术栈**：Next.js 16 + Prisma + PostgreSQL + shadcn/ui
- **数据库**：Customer, Requirement, Comment, RequirementVersion
- **AI能力**：DeepSeek/OpenAI/Anthropic，支持萃取+PRD生成
- **已有功能**：手动输入、JSON导入、AI萃取、PRD生成、评论、版本管理
- **关键缺口**：无登录、无多租户、无文件上传、无证据引用、无需求去重

---

## Phase 1：用户认证（P0，第3周）

**目标**：用户必须登录才能使用，为多租户打基础。

### 1.1 技术选型

使用 **NextAuth.js v5**（Auth.js），理由：
- Next.js 原生支持
- 支持多种登录方式（邮箱、GitHub、Google、飞书）
- 会话管理内置
- 与Prisma集成成熟

### 1.2 数据库模型

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  memberships   Membership[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

### 1.3 实现任务

- [ ] 安装 `next-auth@beta` 和 `@auth/prisma-adapter`
- [ ] 创建 `lib/auth.ts` 配置文件
- [ ] 创建 `app/api/auth/[...nextauth]/route.ts`
- [ ] 添加 Prisma Adapter 配置
- [ ] 创建登录/注册页面 `app/login/page.tsx`
- [ ] 添加中间件保护路由
- [ ] 在 Header 添加用户信息和登录/登出按钮

### 1.4 登录方式优先级

1. **邮箱+密码**（第一版必须）- 最简单，企业用户常用
2. **GitHub登录**（第一版可选）- 开发者友好
3. **飞书登录**（第二版）- ToB场景常用
4. **企业微信登录**（第二版）- ToB场景常用

---

## Phase 2：多租户 + 权限（P0，第4周）

**目标**：企业数据必须隔离，不同角色权限不同。

### 2.1 数据库模型

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  memberships Membership[]
  customers   Customer[]
  requirements Requirement[]
}

model Membership {
  id     String @id @default(cuid())
  userId String
  orgId  String
  role   Role   @default(MEMBER)

  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  org  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
}

enum Role {
  OWNER    // 组织所有者，全部权限
  ADMIN    // 管理员，可管理成员和设置
  PRODUCT  // 产品经理，可创建/编辑/审核需求
  SALES    // 销售，可录入客户反馈
  VIEWER   // 只读
}
```

### 2.2 权限矩阵

| 操作 | OWNER | ADMIN | PRODUCT | SALES | VIEWER |
|------|-------|-------|---------|-------|--------|
| 创建/编辑需求 | ✓ | ✓ | ✓ | ✓ | ✗ |
| 审核需求 | ✓ | ✓ | ✓ | ✗ | ✗ |
| 生成PRD | ✓ | ✓ | ✓ | ✗ | ✗ |
| 管理客户 | ✓ | ✓ | ✓ | ✓ | ✗ |
| 导入数据 | ✓ | ✓ | ✓ | ✓ | ✗ |
| 导出PRD | ✓ | ✓ | ✓ | ✗ | ✗ |
| 管理成员 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 删除组织 | ✓ | ✗ | ✗ | ✗ | ✗ |

### 2.3 实现任务

- [ ] 添加 Organization 和 Membership 模型
- [ ] 给 Customer 和 Requirement 添加 orgId 字段
- [ ] 创建 `lib/permissions.ts` 权限检查工具
- [ ] 创建组织设置页面 `app/settings/org/page.tsx`
- [ ] 创建成员管理页面 `app/settings/members/page.tsx`
- [ ] 所有API添加 orgId 过滤
- [ ] 新用户注册自动创建个人组织

### 2.4 数据隔离策略

所有查询都必须带 `orgId` 过滤：

```typescript
// 示例：获取需求列表
const requirements = await prisma.requirement.findMany({
  where: {
    orgId: session.user.orgId,  // 必须过滤
  },
});
```

---

## Phase 3：文件上传 + 证据引用（P1，第5周）

**目标**：真实数据能进来，每条需求有原文证据。

### 3.1 文件上传

支持格式：
- **CSV**：客服工单导出、CRM导出
- **Excel (.xlsx)**：销售反馈表、客户访谈记录
- **TXT/Markdown**：会议纪要、聊天记录
- **JSON**：已有支持

### 3.2 实现方案

使用 **UploadThing** 或本地存储：

```typescript
// lib/upload.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  feedbackUploader: f({
    "text/csv": { maxFileSize: "4MB" },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "8MB" },
    "text/plain": { maxFileSize: "2MB" },
    "text/markdown": { maxFileSize: "2MB" },
    "application/json": { maxFileSize: "4MB" },
  })
    .middleware(async ({ req }) => {
      // 验证用户登录和组织权限
      return { orgId: "..." };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // 解析文件内容
      // 创建批量需求
    }),
} satisfies FileRouter;
```

### 3.3 文件解析

```typescript
// lib/parsers/csv.ts
export async function parseCSV(buffer: Buffer): Promise<FeedbackItem[]> {
  // 使用 csv-parse 库解析
  // 返回标准化的反馈条目数组
}

// lib/parsers/excel.ts
export async function parseExcel(buffer: Buffer): Promise<FeedbackItem[]> {
  // 使用 xlsx 库解析
}

// lib/parsers/txt.ts
export async function parseTXT(content: string): Promise<FeedbackItem[]> {
  // 按段落或分隔符拆分
}
```

### 3.4 证据引用增强

当前 ExtractedSchema 已有 `evidence` 字段，需要增强：

```typescript
// 新增字段
evidence: z.array(z.object({
  quote: z.string(),           // 原文引用
  reason: z.string(),          // 为什么这是证据
  lineNumber: z.number().optional(),  // 在原文中的行号
  context: z.string().optional(),     // 上下文（前后各一句）
  confidence: z.enum(["high", "medium", "low"]),  // 可信度
})),
```

### 3.5 实现任务

- [ ] 安装文件上传依赖（uploadthing 或 multer）
- [ ] 创建文件解析器（CSV、Excel、TXT、Markdown）
- [ ] 创建批量导入API `app/api/import/file/route.ts`
- [ ] 创建文件上传页面 `app/import/file/page.tsx`
- [ ] 增强 evidence 字段结构
- [ ] 在需求详情页展示证据引用
- [ ] 支持点击证据跳转到原文位置

---

## Phase 4：需求去重 + 客户影响（P1，第6周）

**目标**：识别重复需求，量化客户影响。

### 4.1 需求相似度检测

**方案A：Embedding + pgvector**（推荐）

```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 添加向量字段
ALTER TABLE "Requirement" ADD COLUMN embedding vector(1536);
```

```typescript
// lib/embedding.ts
import OpenAI from "openai";

const openai = new OpenAI();

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function findSimilarRequirements(
  orgId: string,
  text: string,
  threshold = 0.8,
  limit = 5
) {
  const embedding = await getEmbedding(text);
  
  return prisma.$queryRaw`
    SELECT id, title, 
           1 - (embedding <=> ${embedding}::vector) as similarity
    FROM "Requirement"
    WHERE "orgId" = ${orgId}
      AND 1 - (embedding <=> ${embedding}::vector) > ${threshold}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;
}
```

**方案B：关键词匹配**（简单版，先用这个）

```typescript
// lib/similarity.ts
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}
```

### 4.2 需求合并

```typescript
// lib/merge.ts
export interface MergeResult {
  mergedRequirement: Requirement;
  sourceRequirements: string[];  // 被合并的需求ID
  mergeReason: string;
}

export async function mergeRequirements(
  targetId: string,
  sourceIds: string[],
  userId: string
): Promise<MergeResult> {
  // 1. 获取所有需求
  // 2. 合并 painPoints、goals、evidence
  // 3. 更新 target 需求
  // 4. 标记 source 需求为 "merged"
  // 5. 记录合并历史
}
```

### 4.3 客户影响模型

```prisma
model RequirementCustomer {
  id            String   @id @default(cuid())
  requirementId String
  customerId    String
  feedbackCount Int      @default(1)    // 反馈次数
  lastFeedback  DateTime @default(now()) // 最近反馈时间
  contractValue Float?                   // 合同金额
  isRenewalRisk Boolean  @default(false) // 是否影响续费
  isDealBlocker Boolean  @default(false) // 是否阻塞成交

  requirement Requirement @relation(fields: [requirementId], references: [id])
  customer    Customer    @relation(fields: [customerId], references: [id])

  @@unique([requirementId, customerId])
}
```

### 4.4 优先级评分算法

```typescript
// lib/scoring.ts
export function calculatePriorityScore(req: Requirement): number {
  let score = 0;
  
  // 客户数量权重
  score += req.customerCount * 10;
  
  // 反馈频次权重
  score += req.totalFeedbackCount * 5;
  
  // 合同金额权重
  score += (req.totalContractValue / 10000) * 2;
  
  // 续费风险加权
  if (req.hasRenewalRisk) score += 50;
  
  // 成交阻塞加权
  if (req.hasDealBlocker) score += 100;
  
  // 最近反馈时间衰减
  const daysSinceLastFeedback = ...;
  score *= Math.max(0.5, 1 - daysSinceLastFeedback / 90);
  
  return score;
}
```

### 4.5 实现任务

- [ ] 添加 RequirementCustomer 关联模型
- [ ] 实现相似需求检测（先用关键词，后用embedding）
- [ ] 创建需求合并API和UI
- [ ] 实现客户影响统计
- [ ] 实现优先级评分算法
- [ ] 在需求列表页显示相似需求推荐
- [ ] 在需求详情页显示客户影响

---

## Phase 5：审核流程增强（P2，第7-8周）

**目标**：从简单状态变成完整审核流程。

### 5.1 状态流转增强

```typescript
export const RequirementStatus = z.enum([
  "pending",        // 待分析
  "extracted",      // 已萃取
  "prd_generated",  // PRD已生成
  "pending_review", // 待审核
  "reviewing",      // 审核中
  "needs_revision", // 需修改
  "approved",       // 已通过
  "rejected",       // 已驳回
  "in_planning",    // 进入规划
  "in_dev",         // 已转研发
  "merged",         // 已合并
  "failed",         // 处理失败
]);
```

### 5.2 审核记录

```prisma
model ReviewRecord {
  id            String   @id @default(cuid())
  requirementId String
  reviewerId    String
  action        ReviewAction
  comment       String?
  createdAt     DateTime @default(now())

  requirement Requirement @relation(fields: [requirementId], references: [id])
  reviewer    User        @relation(fields: [reviewerId], references: [id])
}

enum ReviewAction {
  SUBMIT      // 提交审核
  APPROVE     // 通过
  REJECT      // 驳回
  REQUEST_REV // 要求修改
  COMMENT     // 评论
  ASSIGN      // 分配审核人
}
```

### 5.3 实现任务

- [ ] 扩展状态枚举
- [ ] 添加 ReviewRecord 模型
- [ ] 添加负责人和截止时间字段
- [ ] 创建审核页面
- [ ] 实现审核操作（通过/驳回/要求修改）
- [ ] 添加审核记录时间线
- [ ] 支持@mention通知（后期）

---

## Phase 6：导出增强（P2，第9周）

**目标**：支持多种格式导出，对接研发工具。

### 6.1 导出格式

1. **Markdown** - 已有
2. **Word (.docx)** - 使用 docx 库
3. **PDF** - 使用 puppeteer 或 pdf-lib
4. **Jira格式** - 可复制的富文本
5. **飞书文档格式** - Markdown变体

### 6.2 PRD模板体系

```typescript
// lib/templates.ts
export const PRD_TEMPLATES = {
  simple: {
    name: "简版需求卡片",
    sections: ["title", "description", "acceptance_criteria"],
  },
  standard: {
    name: "标准PRD",
    sections: ["background", "users", "problems", "goals", "features", "stories", "criteria", "edge_cases"],
  },
  technical: {
    name: "技术评审版",
    sections: [...standard, "api_design", "data_model", "performance", "security"],
  },
  client: {
    name: "客户交付版",
    sections: ["summary", "features", "timeline", "success_metrics"],
  },
};
```

### 6.3 实现任务

- [ ] 安装 docx、puppeteer 依赖
- [ ] 实现 Word 导出
- [ ] 实现 PDF 导出
- [ ] 创建模板选择器
- [ ] 支持自定义模板
- [ ] 实现 Jira 格式导出（复制到剪贴板）

---

## Phase 7：AI能力增强（P2，第10-11周）

**目标**：从"萃取+生成"升级为"5层可审核分析"。

### 7.1 五层AI输出

```typescript
// lib/ai/layers.ts
export interface AIAnalysis {
  // 第1层：事实层
  facts: {
    originalQuotes: string[];
    keyPhrases: string[];
    sentiment: "positive" | "negative" | "neutral";
  };
  
  // 第2层：结构层
  structure: {
    painPoints: string[];
    goals: string[];
    scenarios: string[];
    constraints: string[];
    roles: string[];
  };
  
  // 第3层：判断层
  judgment: {
    type: "bug" | "feature" | "ux" | "integration" | "performance" | "permission";
    urgency: "critical" | "high" | "medium" | "low";
    complexity: "simple" | "moderate" | "complex";
  };
  
  // 第4层：价值层
  value: {
    customerTier: "enterprise" | "growth" | "starter";
    dealImpact: "blocker" | "risk" | "nice_to_have";
    renewalRisk: boolean;
    frequency: "daily" | "weekly" | "monthly" | "rare";
  };
  
  // 第5层：交付层
  delivery: {
    userStories: string[];
    acceptanceCriteria: string[];
    technicalTasks: string[];
    openQuestions: string[];
  };
}
```

### 7.2 实现任务

- [ ] 重新设计萃取Prompt，输出5层结构
- [ ] 更新 ExtractedSchema
- [ ] 在详情页分层展示AI分析
- [ ] 支持逐层人工审核和修改
- [ ] 添加"重新分析"功能

---

## 技术依赖清单

### 新增依赖

```json
{
  "dependencies": {
    "next-auth@beta": "^5.0.0",
    "@auth/prisma-adapter": "^2.0.0",
    "bcryptjs": "^2.4.3",
    "uploadthing": "^7.0.0",
    "@uploadthing/react": "^7.0.0",
    "csv-parse": "^5.5.0",
    "xlsx": "^0.18.5",
    "docx": "^8.5.0",
    "puppeteer": "^22.0.0",
    "@pinecone-database/pinecone": "^2.0.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

---

## 90天时间线

| 周次 | 重点 | 交付物 |
|------|------|--------|
| 3 | 用户认证 | 登录注册、会话管理 |
| 4 | 多租户 | 组织、成员、权限 |
| 5 | 文件上传 | CSV/Excel导入、证据引用 |
| 6 | 需求去重 | 相似需求、合并、客户影响 |
| 7-8 | 审核流程 | 状态流转、审核记录 |
| 9 | 导出增强 | Word/PDF/模板 |
| 10-11 | AI增强 | 5层分析、向量检索 |
| 12 | 试点准备 | Bug修复、性能优化、文档 |

---

## 当前进度

- [x] Phase 0：基础CRUD和AI萃取
- [ ] Phase 1：用户认证 ← 当前
- [ ] Phase 2：多租户
- [ ] Phase 3：文件上传
- [ ] Phase 4：需求去重
- [ ] Phase 5：审核流程
- [ ] Phase 6：导出增强
- [ ] Phase 7：AI增强
