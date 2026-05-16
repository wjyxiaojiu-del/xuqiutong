import { ExtractedSchema, type ExtractedData } from "@/lib/schemas";

export interface AIProvider {
  name: string;
  extract(rawInput: string, scenario?: string): Promise<ExtractedData>;
  generatePRD(extractedJson: string): Promise<{ prd: string; mermaid: string }>;
}

export interface AIStatus {
  provider: string;
  model: string;
  isMock: boolean;
  isFallback: boolean;
  fallbackChain: string[];
  lastError: string | null;
}

// --- Utils ---

function extractMermaid(prd: string): string {
  const match = prd.match(/```mermaid\r?\n([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

function removeMermaid(prd: string): string {
  return prd.replace(/```mermaid\r?\n[\s\S]*?```/g, "").trim();
}

async function chatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  options: { temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
  };
  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`AI API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned empty response");
  return content;
}

// --- OpenAI-compatible provider (works for OpenAI, DeepSeek, etc.) ---

class OpenAICompatProvider implements AIProvider {
  name: string;
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config: {
    name: string;
    baseUrl: string;
    apiKey: string;
    model: string;
  }) {
    this.name = config.name;
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async extract(rawInput: string, scenario?: string): Promise<ExtractedData> {
    const { EXTRACT_SYSTEM_PROMPT, EXTRACT_USER_PROMPT } = await import(
      "@/lib/prompts"
    );
    const content = await chatCompletion(
      this.baseUrl,
      this.apiKey,
      this.model,
      [
        { role: "system", content: EXTRACT_SYSTEM_PROMPT },
        { role: "user", content: EXTRACT_USER_PROMPT(rawInput, scenario) },
      ],
      { temperature: 0.3, jsonMode: true }
    );
    const parsed = JSON.parse(content);
    return ExtractedSchema.parse(parsed);
  }

  async generatePRD(
    extractedJson: string
  ): Promise<{ prd: string; mermaid: string }> {
    const { PRD_SYSTEM_PROMPT, PRD_USER_PROMPT } = await import(
      "@/lib/prompts"
    );
    const content = await chatCompletion(
      this.baseUrl,
      this.apiKey,
      this.model,
      [
        { role: "system", content: PRD_SYSTEM_PROMPT },
        { role: "user", content: PRD_USER_PROMPT(extractedJson) },
      ],
      { temperature: 0.4 }
    );
    const mermaid = extractMermaid(content);
    return { prd: removeMermaid(content), mermaid };
  }
}

// --- Anthropic (Claude) provider ---

class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async call(
    system: string,
    userMessage: string,
    options: { temperature?: number } = {}
  ): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: userMessage }],
        temperature: options.temperature ?? 0.3,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Anthropic API error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  async extract(rawInput: string, scenario?: string): Promise<ExtractedData> {
    const { EXTRACT_SYSTEM_PROMPT, EXTRACT_USER_PROMPT } = await import(
      "@/lib/prompts"
    );
    const content = await this.call(
      EXTRACT_SYSTEM_PROMPT,
      EXTRACT_USER_PROMPT(rawInput, scenario)
    );
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude did not return valid JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    return ExtractedSchema.parse(parsed);
  }

  async generatePRD(
    extractedJson: string
  ): Promise<{ prd: string; mermaid: string }> {
    const { PRD_SYSTEM_PROMPT, PRD_USER_PROMPT } = await import(
      "@/lib/prompts"
    );
    const content = await this.call(
      PRD_SYSTEM_PROMPT,
      PRD_USER_PROMPT(extractedJson),
      { temperature: 0.4 }
    );
    const mermaid = extractMermaid(content);
    return { prd: removeMermaid(content), mermaid };
  }
}

// --- Mock provider ---

class MockAIProvider implements AIProvider {
  name = "mock";

  async extract(rawInput: string, scenario?: string): Promise<ExtractedData> {
    await new Promise((r) => setTimeout(r, 1500));
    const inputPreview = rawInput.slice(0, 80).replace(/\n/g, " ");
    return {
      title: `需求：${inputPreview}${inputPreview.length >= 80 ? "..." : ""}`,
      customerRole: "待确认",
      scenario: scenario || "待确认",
      painPoints: ["待确认 - 请接入真实 AI 以获取准确萃取结果"],
      goals: ["待确认"],
      constraints: [],
      priority: "P1",
      evidence: [
        {
          quote: rawInput.slice(0, 100) || "无",
          reason: "原始输入片段",
        },
      ],
      openQuestions: ["当前为 Mock 模式，请配置 AI_PROVIDER 和对应 API Key"],
      hiddenNeeds: ["Mock 模式不支持隐含需求分析"],
      stakeholders: ["待确认"],
      successMetrics: ["待确认"],
      assumptions: ["待确认"],
    };
  }

  async generatePRD(): Promise<{ prd: string; mermaid: string }> {
    await new Promise((r) => setTimeout(r, 2000));
    return {
      prd: `# PRD（Mock 模式）

## 1. 背景
当前为 Mock 模式，未接入真实 AI。

## 2. 如何切换到真实 AI
在 .env 文件中配置：
- \`AI_PROVIDER=deepseek\` 或 \`openai\` 或 \`anthropic\`
- 对应的 API Key

## 3. 待确认
请配置真实 AI 后重新生成。`,
      mermaid: "",
    };
  }
}

// --- Fallback provider ---

class FallbackProvider implements AIProvider {
  name: string;
  private providers: AIProvider[];
  private _lastError: string | null = null;

  constructor(providers: AIProvider[]) {
    this.providers = providers;
    this.name = providers.map((p) => p.name).join(" -> ");
  }

  get lastError(): string | null {
    return this._lastError;
  }

  async extract(rawInput: string, scenario?: string): Promise<ExtractedData> {
    return this.tryEach((p) => p.extract(rawInput, scenario));
  }

  async generatePRD(
    extractedJson: string
  ): Promise<{ prd: string; mermaid: string }> {
    return this.tryEach((p) => p.generatePRD(extractedJson));
  }

  private async tryEach<T>(fn: (p: AIProvider) => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    for (const provider of this.providers) {
      try {
        const result = await fn(provider);
        this._lastError = null;
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[AI] ${provider.name} failed:`, msg);
        lastError = err instanceof Error ? err : new Error(String(err));
        this._lastError = `${provider.name}: ${msg.slice(0, 100)}`;
      }
    }
    throw lastError || new Error("All AI providers failed");
  }
}

// --- Factory ---

let _provider: AIProvider | null = null;
let _status: AIStatus | null = null;

function buildProvider(): { provider: AIProvider; status: AIStatus } {
  const explicitProvider = process.env.AI_PROVIDER?.toLowerCase();

  // 显式 Mock
  if (explicitProvider === "mock" || process.env.ENABLE_MOCK_AI === "true") {
    return {
      provider: new MockAIProvider(),
      status: {
        provider: "mock",
        model: "N/A",
        isMock: true,
        isFallback: false,
        fallbackChain: [],
        lastError: null,
      },
    };
  }

  // 构建可用 provider 列表
  const available: { name: string; provider: AIProvider; model: string }[] = [];

  if (process.env.DEEPSEEK_API_KEY) {
    available.push({
      name: "deepseek",
      provider: new OpenAICompatProvider({
        name: "deepseek",
        baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      }),
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    });
  }

  if (process.env.OPENAI_API_KEY) {
    available.push({
      name: "openai",
      provider: new OpenAICompatProvider({
        name: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      }),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
    available.push({
      name: "anthropic",
      provider: new AnthropicProvider(process.env.ANTHROPIC_API_KEY, model),
      model,
    });
  }

  // 无任何 provider 可用，回退 Mock
  if (available.length === 0) {
    return {
      provider: new MockAIProvider(),
      status: {
        provider: "mock",
        model: "N/A",
        isMock: true,
        isFallback: false,
        fallbackChain: [],
        lastError: null,
      },
    };
  }

  // 指定了 provider 但没找到对应的 key
  if (explicitProvider && !available.find((a) => a.name === explicitProvider)) {
    console.warn(`[AI] AI_PROVIDER="${explicitProvider}" 未找到对应 API Key，回退到可用 provider`);
  }

  // 如果指定了 provider，只用那一个；否则用第一个可用的
  if (explicitProvider) {
    const match = available.find((a) => a.name === explicitProvider);
    if (match) {
      return {
        provider: match.provider,
        status: {
          provider: match.name,
          model: match.model,
          isMock: false,
          isFallback: false,
          fallbackChain: [],
          lastError: null,
        },
      };
    }
  }

  // 未指定 provider：单个直接用，多个显式 fallback
  if (available.length === 1) {
    const p = available[0];
    return {
      provider: p.provider,
      status: {
        provider: p.name,
        model: p.model,
        isMock: false,
        isFallback: false,
        fallbackChain: [],
        lastError: null,
      },
    };
  }

  // 多个可用，用 fallback 链（需显式配置 AI_FALLBACK=true）
  if (process.env.AI_FALLBACK === "true") {
    const fallback = new FallbackProvider(available.map((a) => a.provider));
    return {
      provider: fallback,
      status: {
        provider: available[0].name,
        model: available[0].model,
        isMock: false,
        isFallback: true,
        fallbackChain: available.map((a) => a.name),
        lastError: null,
      },
    };
  }

  // 默认只用第一个
  const p = available[0];
  return {
    provider: p.provider,
    status: {
      provider: p.name,
      model: p.model,
      isMock: false,
      isFallback: false,
      fallbackChain: [],
      lastError: null,
    },
  };
}

export function getAIProvider(): AIProvider {
  if (_provider) return _provider;
  const { provider } = buildProvider();
  _provider = provider;
  return _provider;
}

export function getAIStatus(): AIStatus {
  if (_status) return _status;
  const { status, provider } = buildProvider();
  _status = status;
  // 更新 fallback 的 lastError
  if (provider instanceof FallbackProvider) {
    _status.lastError = provider.lastError;
  }
  return _status;
}

export function resetAIProvider(): void {
  _provider = null;
  _status = null;
}
