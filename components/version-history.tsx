"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { VersionDiffViewer } from "@/components/version-diff-viewer";
import { diffMarkdown, type DiffLine } from "@/lib/diff";
import { toast } from "sonner";

interface VersionItem {
  id: string;
  versionNo: number;
  changeReason: string | null;
  createdAt: string;
}

interface VersionDetail extends VersionItem {
  prdMarkdown: string;
}

export function VersionHistory({
  open,
  onOpenChange,
  requirementId,
  currentMarkdown,
  onRollback,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirementId: string;
  currentMarkdown: string;
  onRollback: () => void;
}) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(
    null
  );
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<VersionItem | null>(
    null
  );
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (open) {
      fetch(`/api/requirements/${requirementId}/versions`)
        .then((r) => r.json())
        .then((data) => setVersions(data.versions ?? []))
        .catch(() => toast.error("加载版本历史失败"))
        .finally(() => setLoading(false));
    }
  }, [open, requirementId]);

  async function handleSelectVersion(versionId: string) {
    try {
      const res = await fetch(
        `/api/requirements/${requirementId}/versions/${versionId}`
      );
      const data = await res.json();
      setSelectedVersion(data);
      setCompareVersionId(null);
      setDiffResult(null);
    } catch {
      toast.error("加载版本详情失败");
    }
  }

  function handleCompare(versionId: string) {
    setCompareVersionId(versionId);
    // Compute diff between selected version and the compare target
    if (selectedVersion) {
      const target = versions.find((v) => v.id === versionId);
      if (target) {
        fetch(
          `/api/requirements/${requirementId}/versions/${versionId}`
        )
          .then((r) => r.json())
          .then((data: VersionDetail) => {
            const diff = diffMarkdown(
              selectedVersion.prdMarkdown,
              data.prdMarkdown
            );
            setDiffResult(diff);
          })
          .catch(() => toast.error("加载对比版本失败"));
      }
    }
  }

  function handleDiffWithCurrent() {
    if (selectedVersion) {
      const diff = diffMarkdown(selectedVersion.prdMarkdown, currentMarkdown);
      setDiffResult(diff);
      setCompareVersionId("current");
    }
  }

  async function handleRollback() {
    if (!rollbackTarget) return;
    setRolling(true);
    try {
      const res = await fetch(
        `/api/requirements/${requirementId}/versions/rollback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionId: rollbackTarget.id }),
        }
      );
      if (!res.ok) {
        toast.error("回滚失败");
        return;
      }
      toast.success(`已回滚至 v${rollbackTarget.versionNo}`);
      setRollbackTarget(null);
      onOpenChange(false);
      onRollback();
    } catch {
      toast.error("网络错误");
    } finally {
      setRolling(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>版本历史</SheetTitle>
            <SheetDescription>
              查看 PRD 的修改历史，支持版本对比和回滚
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无版本记录</p>
            ) : (
              <>
                {/* Version list */}
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className={`rounded-md border p-3 cursor-pointer transition-colors ${
                        selectedVersion?.id === v.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleSelectVersion(v.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          v{v.versionNo}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.createdAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      {v.changeReason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {v.changeReason}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRollbackTarget(v);
                          }}
                        >
                          回滚
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected version detail */}
                {selectedVersion && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">
                        v{selectedVersion.versionNo} 内容预览
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDiffWithCurrent}
                        >
                          与当前版本对比
                        </Button>
                      </div>
                    </div>

                    {/* Compare with another version */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        对比其他版本：
                      </span>
                      <select
                        className="text-xs border rounded px-2 py-1"
                        value={compareVersionId ?? ""}
                        onChange={(e) => {
                          if (e.target.value) handleCompare(e.target.value);
                        }}
                      >
                        <option value="">选择版本...</option>
                        {versions
                          .filter((v) => v.id !== selectedVersion.id)
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              v{v.versionNo} -{" "}
                              {v.changeReason || "无备注"}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Diff view */}
                    {diffResult ? (
                      <div className="max-h-[400px] overflow-y-auto">
                        <VersionDiffViewer diffLines={diffResult} />
                      </div>
                    ) : (
                      <div className="max-h-[300px] overflow-y-auto rounded-md border p-3 bg-muted/30">
                        <pre className="text-xs whitespace-pre-wrap break-all">
                          {selectedVersion.prdMarkdown.slice(0, 2000)}
                          {selectedVersion.prdMarkdown.length > 2000 && "\n..."}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Rollback confirmation dialog */}
      <Dialog
        open={!!rollbackTarget}
        onOpenChange={() => setRollbackTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认回滚</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            确定要回滚到{" "}
            <strong>v{rollbackTarget?.versionNo}</strong> 吗？
          </p>
          <p className="text-xs text-muted-foreground">
            当前 PRD 内容将被替换为该版本的内容，并创建一个新版本记录。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRollbackTarget(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleRollback}
              disabled={rolling}
            >
              {rolling ? "回滚中..." : "确认回滚"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
