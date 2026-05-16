export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNoOld?: number;
  lineNoNew?: number;
}

export function diffMarkdown(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const m = oldLines.length;
  const n = newLines.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m,
    j = n;
  const temp: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      temp.push({
        type: "unchanged",
        content: oldLines[i - 1],
        lineNoOld: i,
        lineNoNew: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({
        type: "added",
        content: newLines[j - 1],
        lineNoNew: j,
      });
      j--;
    } else {
      temp.push({
        type: "removed",
        content: oldLines[i - 1],
        lineNoOld: i,
      });
      i--;
    }
  }

  // Reverse since we backtracked
  for (let k = temp.length - 1; k >= 0; k--) {
    result.push(temp[k]);
  }

  return result;
}
