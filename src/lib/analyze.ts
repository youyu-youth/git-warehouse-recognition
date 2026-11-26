import { buildAiAdvice } from "./ai";
import { buildLocalAdvice } from "./advice";
import { AnalyzeError } from "./errors";
import { findReadmePath, scanDependencies, scanReadme, scanStart, scanWindows } from "./scan/basic";
import { scanPaths } from "./scan/paths";
import { scanSecrets } from "./scan/secrets";
import { loadSnapshot } from "./github";
import { LIMITS, LIMIT_LABELS } from "./limits";
import { parseRepoUrl } from "./repo-url";
import { buildRisks } from "./risks";
import { buildScore } from "./score";
import { selectFiles } from "./select-files";
import type { AnalysisResult } from "./types";

async function mapLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

export async function analyzeRepository(input: string): Promise<AnalysisResult> {
  const startedAt = Date.now();
  const ref = parseRepoUrl(input);
  const snapshot = await loadSnapshot(ref);
  const warnings = [...snapshot.warnings];

  if (snapshot.truncated) {
    warnings.push("仓库文件树被截断，结果只覆盖可见文件。");
  }
  if (snapshot.repo.sizeKb !== null && snapshot.repo.sizeKb > 200_000) {
    warnings.push(
      `仓库体积约 ${Math.round(snapshot.repo.sizeKb / 1024)} MB，已按优先级抽样扫描。`,
    );
  }

  const { selected, skippedBySize } = selectFiles(snapshot.files);
  if (skippedBySize > 0) {
    warnings.push(`${skippedBySize} 个文件超过单文件大小上限，未读取内容。`);
  }
  if (selected.length === 0) {
    throw new AnalyzeError({
      code: "EMPTY_REPO",
      message: "仓库里没有找到可读取的文本文件。",
      hint: "请换一个有源码或配置文件的仓库。",
      status: 422,
    });
  }

  const contents = new Map<string, string>();
  let failedReads = 0;

  await mapLimit(selected, LIMITS.concurrency, async (file) => {
    const text = await snapshot.readFile(file.path);
    if (text === null) {
      failedReads += 1;
      return;
    }
    contents.set(file.path, text);
  });

  if (failedReads > 0) {
    warnings.push(`${failedReads} 个文件读取失败，扫描结果可能不完整。`);
  }
  if (contents.size === 0) {
    throw new AnalyzeError({
      code: "NETWORK",
      message: "仓库文件内容读取失败。",
      hint: "请检查网络后重试；如果问题持续出现，可以换一个仓库测试。",
      status: 502,
    });
  }

  const readmePathCandidate = findReadmePath(snapshot.files);
  const readmeText = readmePathCandidate ? contents.get(readmePathCandidate) ?? null : null;
  if (readmePathCandidate && readmeText === null) {
    warnings.push("README 内容未能读取，文档完整度评分可能偏低。");
  }

  const readme = scanReadme(snapshot.files, contents);
  const deps = scanDependencies(snapshot.files, contents);
  const start = scanStart(snapshot.files, contents, readmeText, deps);
  const windows = scanWindows(snapshot.files, readmeText, start);
  const effectiveReadmePath = readme.found ? readme.path : null;
  const paths = scanPaths(contents, effectiveReadmePath);
  const secrets = scanSecrets(snapshot.files, contents, effectiveReadmePath);

  const checks = { readme, deps, start, windows, paths, secrets };
  const score = buildScore(checks);
  const { risks, truncated: risksTruncated } = buildRisks(checks);

  if (risksTruncated) warnings.push(`风险条目较多，仅展示前 ${LIMITS.maxRisks} 条。`);
  if (paths.truncated) warnings.push(`路径命中较多，仅展示前 ${LIMITS.maxFindings} 条。`);
  if (secrets.truncated) warnings.push(`敏感信息命中较多，仅展示前 ${LIMITS.maxFindings} 条。`);

  let advice = buildLocalAdvice(snapshot.repo, score, risks);
  if (process.env.AI_API_KEY?.trim()) {
    const aiAdvice = await buildAiAdvice({
      repo: snapshot.repo,
      score,
      checks,
      risks,
      scannedFiles: contents.size,
    });
    if (aiAdvice) {
      advice = aiAdvice;
    } else {
      warnings.push("AI 建议生成失败，已改用本地规则建议。");
    }
  }

  return {
    repo: snapshot.repo,
    score,
    checks,
    risks,
    advice,
    meta: {
      scannedFiles: contents.size,
      selectedFiles: selected.length,
      totalFiles: snapshot.files.length,
      truncated: snapshot.truncated,
      source: snapshot.source,
      contentSource: snapshot.contentSource,
      warnings: [...new Set(warnings)],
      durationMs: Date.now() - startedAt,
      limits: LIMIT_LABELS,
    },
  };
}
