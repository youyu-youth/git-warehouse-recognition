import { ExternalLink, GitBranch, TriangleAlert } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-line px-2.5 py-2 first:border-l-0 first:pl-0">
      <p className="text-[11px] leading-4 text-muted">{label}</p>
      <p className="mt-1 font-mono text-[16px] font-medium leading-none text-ink">{value}</p>
    </div>
  );
}

export function ReportHeader({ result }: { result: AnalysisResult }) {
  const { repo, meta } = result;
  const treeSource = meta.source === "github" ? "GitHub API" : "jsDelivr 备用源";
  const fileSource =
    meta.contentSource === "github" ? "raw.githubusercontent.com" : "jsDelivr CDN";

  const facts = [
    { label: "语言", value: repo.language ?? "未知语言", mono: false },
    { label: "Star", value: formatNumber(repo.stars), mono: true },
    { label: "Fork", value: formatNumber(repo.forks), mono: true },
    { label: "许可证", value: repo.license ?? "无许可证信息", mono: false },
    { label: "默认分支", value: repo.defaultBranch, mono: true },
    { label: "最近更新", value: formatDate(repo.pushedAt), mono: true },
  ];

  return (
    <header className="rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[12px] leading-5 text-muted">
              <GitBranch className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              GitHub 公开仓库
            </span>
            {repo.archived && (
              <span className="rounded-[var(--radius-pill)] border border-warn/30 bg-warn-soft px-2 py-0.5 text-[11px] leading-4 text-warn">
                已归档
              </span>
            )}
          </div>

          <h2 className="mt-2 break-words font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[30px]">
            {repo.fullName}
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted">
            {repo.description ??
              (meta.source === "jsdelivr"
                ? "备用源模式下无法获取仓库简介。"
                : "仓库没有填写简介。")}
          </p>

          <dl className="mt-5 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <dt className="text-[11px] leading-4 text-muted">{fact.label}</dt>
                <dd
                  className={
                    fact.mono
                      ? "mt-0.5 truncate font-mono text-[13px] leading-5 text-ink"
                      : "mt-0.5 truncate text-[13px] leading-5 text-ink"
                  }
                  title={fact.value}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="key key-small mt-5"
          >
            在 GitHub 打开
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>

        <div className="shrink-0 lg:w-[280px]">
          <p className="text-[11px] leading-4 text-muted">本次扫描</p>
          <div className="mt-2 border-t border-ink pt-2">
            <div className="grid grid-cols-3">
              <Stat label="已扫描" value={String(meta.scannedFiles)} />
              <Stat label="仓库文件" value={formatNumber(meta.totalFiles)} />
              <Stat label="用时" value={formatDuration(meta.durationMs)} />
            </div>
          </div>
        </div>
      </div>

      <dl className="grid gap-2.5 border-t border-line px-5 py-3 sm:grid-cols-3 sm:gap-4 sm:px-6">
        <div className="min-w-0">
          <dt className="text-[11px] leading-4 text-muted">文件树来源</dt>
          <dd className="mt-0.5 truncate font-mono text-[11px] leading-4 text-ink-2">
            {treeSource}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] leading-4 text-muted">文件内容来源</dt>
          <dd className="mt-0.5 truncate font-mono text-[11px] leading-4 text-ink-2">
            {fileSource}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] leading-4 text-muted">扫描上限</dt>
          <dd className="mt-0.5 text-[11px] leading-4 text-ink-2">
            {meta.limits.maxFiles} 文件，单文件 {meta.limits.maxFileSizeKb} KB，总计{" "}
            {meta.limits.maxTotalSizeMb} MB
          </dd>
        </div>
      </dl>

      {meta.warnings.length > 0 && (
        <div className="border-t border-warn/25 bg-warn-soft px-5 py-3 sm:px-6">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
            <TriangleAlert className="h-3.5 w-3.5 text-warn" aria-hidden="true" />
            数据覆盖说明
          </p>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-5 text-ink-2">
            {meta.warnings.map((warning) => (
              <li key={warning} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-warn" aria-hidden="true" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
