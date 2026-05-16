import { getAIStatus } from "@/lib/ai/provider";

export async function GET() {
  try {
    const status = getAIStatus();
    return Response.json(status);
  } catch {
    return Response.json({
      provider: "error",
      model: "N/A",
      isMock: true,
      isFallback: false,
      fallbackChain: [],
      lastError: "AI 配置异常",
    });
  }
}
