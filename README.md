# 需求通

把分散的客户声音转成可追溯、可审核、可沉淀的产品需求资产。

## 核心流程

1. **录入需求** - 粘贴客户聊天记录、售前咨询、售后反馈等原始文本
2. **AI 萃取** - 自动提取结构化需求（痛点、目标、约束、证据、待确认问题）
3. **生成 PRD** - AI 生成产品需求文档，含验收标准和流程图
4. **审核沉淀** - 团队审核、评论、驳回、版本回滚

## 快速开始

### 环境要求

- Node.js >= 18
- npm 或 pnpm

### 安装

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
# 数据库（默认 SQLite，开发环境自动创建 dev.db）
DATABASE_URL="file:./dev.db"

# AI Provider 选择（可选值：deepseek / openai / anthropic / mock）
# 不设置则自动使用第一个可用的 provider，无 key 时降级为 mock
AI_PROVIDER=deepseek

# 允许多 provider fallback（默认 false，只用 AI_PROVIDER 指定的那个）
AI_FALLBACK=false

# DeepSeek
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_MODEL="deepseek-chat"           # 可选，默认 deepseek-chat
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"  # 可选

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"               # 可选，默认 gpt-4o-mini

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-sonnet-4-20250514" # 可选

# 强制使用 Mock AI（忽略所有 API Key）
ENABLE_MOCK_AI=false

# Seed 接口密钥（设置后 /api/seed 需要 x-seed-secret header）
SEED_SECRET=""
```

### 初始化数据库

```bash
npx prisma db push
```

### 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000 即可使用。

### 填充演示数据（仅开发环境）

```bash
npm run seed
```

## 状态流转规则

```
pending → extracted → prd_generated → reviewing → approved
                ↓                        ↓
              failed                   rejected → reviewing / prd_generated
                ↓
         pending / extracted（重试）
```

## 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + Tailwind CSS + shadcn/ui
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: SQLite / libSQL（开发），PostgreSQL（生产规划）
- **AI**: DeepSeek / OpenAI / Anthropic Claude（带 Mock 兜底）

## 项目结构

```
app/
  page.tsx              # 首页仪表盘 + AI 状态栏
  requirements/         # 需求列表（分页、排序、筛选、搜索防抖）
  extract/[id]/         # 需求萃取详情（支持编辑和重试）
  prd/[id]/             # PRD 查看、审核、评论、版本历史
  customers/            # 客户档案
  api/
    requirements/       # 需求 CRUD + 分页 + 排序
    extract/            # AI 萃取（新建 + 重试）
    generate-prd/       # AI 生成 PRD
    comments/           # 评论
    ai-status/          # AI Provider 状态查询
    seed/               # 演示数据（开发环境 + 密钥保护）
lib/
  ai/provider.ts        # AI Provider 显式选择 + fallback + 状态报告
  schemas.ts            # Zod schema + 状态枚举 + 流转规则
  prompts.ts            # AI Prompt（证据/推断/待确认三栏）
  prisma.ts             # Prisma 客户端
components/
  ai-status-bar.tsx     # AI 状态栏（provider、model、mock、fallback）
  status-badge.tsx      # 状态/优先级标签
  prd-viewer.tsx        # Markdown + Mermaid 渲染
  version-history.tsx   # 版本历史 + diff 对比
```

## 环境变量速查

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DATABASE_URL` | 否 | `file:./dev.db` | 数据库连接字符串 |
| `AI_PROVIDER` | 否 | 自动选择 | `deepseek` / `openai` / `anthropic` / `mock` |
| `AI_FALLBACK` | 否 | `false` | 是否启用多 provider fallback 链 |
| `DEEPSEEK_API_KEY` | 否 | - | DeepSeek API Key |
| `OPENAI_API_KEY` | 否 | - | OpenAI API Key |
| `ANTHROPIC_API_KEY` | 否 | - | Anthropic API Key |
| `ENABLE_MOCK_AI` | 否 | `false` | 强制 Mock 模式 |
| `SEED_SECRET` | 否 | - | Seed 接口保护密钥 |

## 已知限制

- 无用户认证和权限控制，仅适合本地演示
- SQLite 不适合高并发生产场景，需迁移至 PostgreSQL
- 关联需求使用关键词匹配，中文语义相似度有限
- AI 生成的 PRD 可能包含推断内容，已标注【证据】【推断】【待确认】，需人工审核
