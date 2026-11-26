import { ExternalLink, GitBranch, TriangleAlert } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-2 py-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-base leading-none text-ink">{value}</p>
    </div>
  );
}

function Dot() {
  return <span className="text-line-strong" aria-hidden="true">/</span>;
}

export function ReportHeader({ result }: { result: AnalysisResult }) {
  const { repo, meta } = result;
  const treeSource = meta.source === "github" ? "GitHub API" : "jsDelivr 备用源";
  const fileSource =
    meta.contentSource === "github" ? "raw.githubusercontent.com" : "jsDelivr CDN";

  return (
    <header className="border border-line bg-surface">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            <GitBranch className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
            <span>GitHub · Public</span>
            <span className="text-line-strong" aria-hidden="true">/</span>
            <span>Scan report</span>
            {repo.archived && (
              <span className="border border-warn/30 bg-warn-soft px-1.5 py-0.5 text-warn">
                已归档
              </span>
            )}
          </div>

          <h2 className="mt-3 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
            {repo.fullName}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            {repo.description ??
              (meta.source === "jsdelivr"
                ? "备用源模式下无法获取仓库简介。"
                : "仓库没有填写简介。")}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] text-muted">
            <span>{repo.language ?? "未知语言"}</span>
            <Dot />
            <span>★ {formatNumber(repo.stars)}</span>
            <Dot />
            <span>Fork {formatNumber(repo.forks)}</span>
            <Dot />
            <span>{repo.license ?? "无许可证信息"}</span>
            <Dot />
            <span>分支 {repo.defaultBranch}</span>
            <Dot />
            <span>更新 {formatDate(repo.pushedAt)}</span>
          </div>

          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            在 GitHub 打开
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-px border border-line bg-line text-center lg:w-[300px]">
          <Stat label="已扫描" value={String(meta.scannedFiles)} />
          <Stat label="仓库文件" value={formatNumber(meta.totalFiles)} />
          <Stat label="用时" value={formatDuration(meta.durationMs)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-2.5 font-mono text-[10px] tracking-[0.08em] text-muted sm:px-6">
        <span>文件树：{treeSource}</span>
        <span>文件内容：{fileSource}</span>
        <span>
          扫描上限：{meta.limits.maxFiles} 文件 / {meta.limits.maxFileSizeKb} KB /{" "}
          {meta.limits.maxTotalSizeMb} MB
        </span>
      </div>

      {meta.warnings.length > 0 && (
        <div className="border-t border-warn/20 bg-warn-soft/50 px-5 py-3 sm:px-6">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-warn">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            数据覆盖说明
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px] leading-5 text-muted">
            {meta.warnings.map((warning) => (
              <li key={warning} className="flex gap-1.5">
                <span className="text-warn/60" aria-hidden="true">·</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
