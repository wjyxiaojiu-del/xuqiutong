import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface FeishuDocument {
  documentId: string;
  title: string;
  url: string;
  content: string;
}

/**
 * 从飞书文档URL中提取document_id
 */
export function extractDocumentId(url: string): string | null {
  // https://xxx.feishu.cn/docx/xxxxx 或 https://xxx.larksuite.com/docx/xxxxx
  const match = url.match(/\/docx\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * 获取飞书文档内容
 */
export async function fetchDocument(docIdOrUrl: string): Promise<FeishuDocument> {
  const docId = extractDocumentId(docIdOrUrl) || docIdOrUrl;

  try {
    const { stdout } = await execAsync(
      `lark-cli docs +fetch --doc ${docId} --api-version v2 --format json`,
      { timeout: 30000 }
    );

    const result = JSON.parse(stdout);

    if (!result.ok) {
      throw new Error(result.error?.message || "获取文档失败");
    }

    return {
      documentId: docId,
      title: result.data?.title || "无标题",
      url: `https://my.feishu.cn/docx/${docId}`,
      content: result.data?.content || "",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`获取飞书文档失败: ${msg}`);
  }
}

/**
 * 创建飞书文档
 */
export async function createDocument(
  title: string,
  content: string
): Promise<FeishuDocument> {
  try {
    // 将内容写入临时文件，避免命令行转义问题
    const fs = await import("fs/promises");
    const os = await import("os");
    const path = await import("path");

    const tmpFile = path.join(os.tmpdir(), `feishu-${Date.now()}.md`);
    await fs.writeFile(tmpFile, content, "utf-8");

    const { stdout } = await execAsync(
      `lark-cli docs +create --title "${title}" --markdown "@${tmpFile}" --api-version v2 --format json`,
      { timeout: 30000 }
    );

    // 清理临时文件
    await fs.unlink(tmpFile).catch(() => {});

    const result = JSON.parse(stdout);

    if (!result.ok) {
      throw new Error(result.error?.message || "创建文档失败");
    }

    const doc = result.data?.document;
    return {
      documentId: doc?.document_id || "",
      title,
      url: doc?.url || "",
      content,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`创建飞书文档失败: ${msg}`);
  }
}

/**
 * 更新飞书文档内容
 */
export async function updateDocument(
  docId: string,
  content: string
): Promise<void> {
  try {
    const fs = await import("fs/promises");
    const os = await import("os");
    const path = await import("path");

    const tmpFile = path.join(os.tmpdir(), `feishu-update-${Date.now()}.md`);
    await fs.writeFile(tmpFile, content, "utf-8");

    const { stdout } = await execAsync(
      `lark-cli docs +update --doc ${docId} --file "${tmpFile}" --api-version v2 --format json`,
      { timeout: 30000 }
    );

    await fs.unlink(tmpFile).catch(() => {});

    const result = JSON.parse(stdout);

    if (!result.ok) {
      throw new Error(result.error?.message || "更新文档失败");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`更新飞书文档失败: ${msg}`);
  }
}

/**
 * 检查飞书CLI是否已登录
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("lark-cli auth status", {
      timeout: 10000,
    });
    const result = JSON.parse(stdout);
    return result.tokenStatus === "valid";
  } catch {
    return false;
  }
}
