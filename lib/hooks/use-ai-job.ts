"use client";

import { useState, useCallback, useRef } from "react";

interface AiJob {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  type: string;
  error: string;
  requirement?: { id: string; title: string; status: string };
}

/**
 * 轮询 AI 任务状态的 hook
 * 用法：
 *   const { poll, status, error } = useAiJob();
 *   await poll(jobId); // 阻塞直到任务完成或失败
 */
export function useAiJob(pollInterval = 2000, maxWait = 120_000) {
  const [status, setStatus] = useState<AiJob["status"]>("queued");
  const [error, setError] = useState<string>("");
  const [job, setJob] = useState<AiJob | null>(null);
  const abortRef = useRef(false);

  const poll = useCallback(
    (jobId: string): Promise<AiJob> => {
      abortRef.current = false;
      setError("");
      setStatus("queued");

      return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const check = async () => {
          if (abortRef.current) {
            reject(new Error("已取消"));
            return;
          }

          try {
            const res = await fetch(`/api/ai-jobs?jobId=${jobId}`);
            if (!res.ok) {
              reject(new Error("查询任务失败"));
              return;
            }

            const data: AiJob = await res.json();
            setJob(data);
            setStatus(data.status);

            if (data.status === "succeeded") {
              resolve(data);
              return;
            }

            if (data.status === "failed") {
              setError(data.error || "任务失败");
              reject(new Error(data.error || "任务失败"));
              return;
            }

            // 超时检查
            if (Date.now() - startTime > maxWait) {
              setError("任务超时");
              reject(new Error("任务超时"));
              return;
            }

            // 继续轮询
            setTimeout(check, pollInterval);
          } catch (err) {
            reject(err);
          }
        };

        check();
      });
    },
    [pollInterval, maxWait]
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { poll, cancel, status, error, job };
}
