# 飞书/钉钉/腾讯文档 集成方案

> **注意**：本文档包含"当前实现"和"目标实现"两部分。当前实现使用 `lark-cli + execFile` 方式，目标实现是完整的 OpenAPI/OAuth 集成。

## 当前实现（已完成）

通过 `lark-cli` 命令行工具实现飞书文档导入：

```typescript
// lib/feishu.ts - 当前实现方式
import { execFile } from "child_process";

export async function fetchFeishuDoc(docId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("lark-cli", ["doc", "export", docId], (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}
```

**限制**：
- 依赖本地安装的 `lark-cli`
- 无 OAuth 认证，使用 CLI 预配置的凭证
- 仅支持文档导出，不支持写入

---

## 目标实现（规划中）

### 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                      需求通                              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │ 飞书适配器 │ │ 钉钉适配器 │ │腾讯文档适配器│               │
│  └────┬────┘  └────┬────┘  └────┬────┘                 │
│       │            │            │                       │
│       └────────────┼────────────┘                       │
│                    │                                    │
│            ┌───────┴───────┐                            │
│            │   文档服务层    │                            │
│            │  (统一接口)     │                            │
│            └───────┬───────┘                            │
│                    │                                    │
│       ┌────────────┼────────────┐                       │
│       │            │            │                       │
│  ┌────┴────┐  ┌────┴────┐  ┌────┴────┐                 │
│  │ 导入服务  │  │ 导出服务  │  │ 同步服务  │                 │
│  └─────────┘  └─────────┘  └─────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## 优先级

| 平台 | 优先级 | 理由 |
|------|--------|------|
| 飞书 | P0 | ToB最常用，API成熟 |
| 钉钉 | P1 | 企业内部协同常用 |
| 腾讯文档 | P2 | API限制多，后期做 |

---

## Phase 1: 飞书集成（P0）

### 1.1 飞书开放平台配置

需要：
1. 创建飞书应用（企业自建应用）
2. 获取 App ID 和 App Secret
3. 配置权限：
   - `docx:document:readonly` - 读取文档
   - `docx:document` - 写入文档
   - `drive:drive:readonly` - 读取云空间

### 1.2 环境变量

```env
# 飞书
FEISHU_APP_ID=""
FEISHU_APP_SECRET=""
FEISHU_REDIRECT_URI="http://localhost:3000/api/feishu/callback"
```

### 1.3 数据库模型

```prisma
model Integration {
  id          String   @id @default(cuid())
  orgId       String
  provider    String   // "feishu" | "dingtalk" | "tencent"
  accessToken String
  refreshToken String
  expiresAt   DateTime
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model SyncRecord {
  id            String   @id @default(cuid())
  integrationId String
  requirementId String?
  direction     String   // "import" | "export"
  externalId    String   // 外部文档ID
  externalUrl   String?
  status        String   // "pending" | "success" | "failed"
  error         String?
  createdAt     DateTime @default(now())
}
```

### 1.4 飞书API封装

```typescript
// lib/integrations/feishu.ts
export class FeishuClient {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  // 获取 tenant_access_token
  async getAccessToken(): Promise<string> {
    const res = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret,
        }),
      }
    );
    const data = await res.json();
    this.accessToken = data.tenant_access_token;
    return this.accessToken!;
  }

  // 获取文档内容
  async getDocument(documentId: string): Promise<string> {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/raw_content`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    return data.data.content;
  }

  // 创建文档
  async createDocument(title: string, content: string): Promise<string> {
    const token = await this.getAccessToken();
    // 1. 创建文档
    const createRes = await fetch(
      "https://open.feishu.cn/open-apis/docx/v1/documents",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      }
    );
    const createData = await createRes.json();
    const documentId = createData.data.document.document_id;

    // 2. 写入内容
    await this.writeDocumentContent(documentId, content);

    return documentId;
  }

  // 写入文档内容
  private async writeDocumentContent(
    documentId: string,
    content: string
  ): Promise<void> {
    const token = await this.getAccessToken();
    // 将Markdown转为飞书文档格式
    const blocks = this.markdownToBlocks(content);

    await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/batch_update`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ children: blocks }),
      }
    );
  }

  // Markdown转飞书文档块
  private markdownToBlocks(markdown: string): unknown[] {
    // 简化实现，实际需要更复杂的解析
    const lines = markdown.split("\n");
    return lines.map((line) => ({
      block_type: 2, // text block
      text: { elements: [{ text_run: { content: line } }] },
    }));
  }
}
```

### 1.5 API路由

```typescript
// app/api/feishu/auth/route.ts - 发起OAuth
// app/api/feishu/callback/route.ts - OAuth回调
// app/api/feishu/import/route.ts - 从飞书导入
// app/api/feishu/export/route.ts - 导出到飞书
```

### 1.6 前端页面

```
app/integrations/
├── page.tsx           # 集成管理页面
├── feishu/
│   ├── import.tsx     # 从飞书导入
│   └── export.tsx     # 导出到飞书
└── dingtalk/
    ├── import.tsx
    └── export.tsx
```

---

## Phase 2: 钉钉集成（P1）

### 2.1 钉钉开放平台配置

需要：
1. 创建钉钉企业内部应用
2. 获取 AppKey 和 AppSecret
3. 配置权限：
   - `qyzw_document` - 企业文档

### 2.2 钉钉API封装

```typescript
// lib/integrations/dingtalk.ts
export class DingTalkClient {
  private appKey: string;
  private appSecret: string;

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

  // 获取访问令牌
  async getAccessToken(): Promise<string> {
    const res = await fetch(
      `https://oapi.dingtalk.com/gettoken?appkey=${this.appKey}&appsecret=${this.appSecret}`
    );
    const data = await res.json();
    return data.access_token;
  }

  // 获取文档内容
  async getDocument(documentId: string): Promise<string> {
    // 钉钉文档API实现
    // ...
  }

  // 创建文档
  async createDocument(title: string, content: string): Promise<string> {
    // 钉钉文档API实现
    // ...
  }
}
```

---

## Phase 3: 腾讯文档集成（P2）

### 3.1 腾讯文档API

腾讯文档API限制较多：
- 需要企业认证
- 需要单独申请权限
- API文档不完善

建议后期做，或者用以下替代方案：
- 用户手动复制内容
- 提供格式化的导入模板

---

## 简化实现（比赛用）

如果时间紧张，可以用更简单的方案：

### 方案A：链接解析

```typescript
// app/api/import/url/route.ts
export async function POST(request: NextRequest) {
  const { url } = await request.json();

  // 识别链接类型
  if (url.includes("feishu.cn")) {
    // 飞书文档
    const content = await fetchFeishuContent(url);
    return Response.json({ content });
  } else if (url.includes("dingtalk.com")) {
    // 钉钉文档
    const content = await fetchDingTalkContent(url);
    return Response.json({ content });
  }

  return Response.json({ error: "不支持的链接格式" }, { status: 400 });
}
```

### 方案B：粘贴优化

提供专门的粘贴区域，自动识别飞书/钉钉文档格式：

```tsx
// components/paste-import.tsx
export function PasteImport() {
  const [pastedContent, setPastedContent] = useState("");

  function handlePaste(e: React.ClipboardEvent) {
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    // 如果有HTML，尝试解析飞书/钉钉格式
    if (html && isDocumentFormat(html)) {
      const parsed = parseDocumentHtml(html);
      setPastedContent(parsed);
    } else {
      setPastedContent(text);
    }
  }

  return (
    <Textarea
      onPaste={handlePaste}
      value={pastedContent}
      placeholder="粘贴飞书/钉钉文档内容..."
    />
  );
}
```

---

## 实现步骤

### 第1步：飞书应用配置（30分钟）

1. 登录飞书开放平台
2. 创建企业自建应用
3. 获取 App ID 和 App Secret
4. 配置权限

### 第2步：飞书API封装（2小时）

1. 创建 `lib/integrations/feishu.ts`
2. 实现获取访问令牌
3. 实现获取文档内容
4. 实现创建文档

### 第3步：API路由（1小时）

1. 创建 `/api/feishu/auth` - OAuth流程
2. 创建 `/api/feishu/import` - 导入
3. 创建 `/api/feishu/export` - 导出

### 第4步：前端页面（2小时）

1. 创建集成管理页面
2. 创建导入/导出组件
3. 添加到导航

### 第5步：测试（1小时）

1. 测试导入流程
2. 测试导出流程
3. 处理错误情况

---

## 时间估算

| 任务 | 时间 |
|------|------|
| 飞书应用配置 | 30分钟 |
| 飞书API封装 | 2小时 |
| API路由 | 1小时 |
| 前端页面 | 2小时 |
| 钉钉集成 | 3小时 |
| 测试调试 | 2小时 |
| **总计** | **约11小时** |

---

## 注意事项

1. **API限制**：飞书/钉钉都有调用频率限制，需要做限流
2. **认证过期**：访问令牌会过期，需要实现刷新机制
3. **格式转换**：Markdown与文档格式的转换可能不完美
4. **错误处理**：需要处理网络错误、权限错误等

## 下一步

1. 用户提供飞书应用凭证
2. 实现飞书集成
3. 测试导入导出
4. 扩展到钉钉
