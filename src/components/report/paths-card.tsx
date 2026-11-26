import type { PathsCheck } from "@/lib/types";
import { EmptyLine, SectionCard, SeverityPill, TonePill, type Tone } from "./shared";

const PATTERN_LABELS: Record<string, string> = {
  "windows-drive": "Windows 盘符",
  "home-dir": "用户目录",
  "unix-abs": "Unix 绝对路径",
  unc: "UNC 共享",
};

function toneFor(points: number): Tone {
  if (points >= 8) return "ok";
  if (points >= 4) return "warn";
  return "bad";
}

export function PathsCard({ paths }: { paths: PathsCheck }) {
  const tone = paths.bySeverity.medium > 0 ? toneFor(paths.points) : "ok";
  const label =
    paths.total === 0
      ? "良好"
      : paths.bySeverity.medium > 0
        ? paths.points >= 8
          ? "待补"
          : "较多"
        : "低风险";

  return (
    <SectionCard
      index="05"
      title="硬编码路径"
      subtitle={"C:\\ /Users/ / 绝对路径"}
      points={paths.points}
      max={10}
      headRight={<TonePill tone={tone} label={label} />}
    >
      <div className="space-y-3">
        {paths.total === 0 ? (
          <EmptyLine>在已读取的文件中，没有发现明显的硬编码绝对路径。</EmptyLine>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl leading-none text-ink">{paths.total}</span>
              <span className="text-xs text-muted">
                处命中 · 涉及 {paths.filesAffected} 个文件
              </span>
            </div>

            <div className="grid grid-cols-2 gap-px border border-line bg-line">
              {Object.entries(PATTERN_LABELS).map(([pattern, patternLabel]) => (
                <div key={pattern} className="bg-surface px-3 py-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                    {patternLabel}
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-ink">
                    {paths.byPattern[pattern as keyof typeof paths.byPattern]}
                  </p>
                </div>
              ))}
            </div>

            <ul className="divide-y divide-line/60 border-y border-line/60">
              {paths.findings.slice(0, 4).map((finding) => (
                <li key={finding.id} className="py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="min-w-0 truncate font-mono text-[10px] text-ink"
                      title={`${finding.path}:${finding.line}`}
                    >
                      {finding.path}:{finding.line}
                    </span>
                    <SeverityPill severity={finding.severity} />
                  </div>
                  <p
                    className="mt-1 truncate font-mono text-[10px] text-muted"
                    title={finding.snippet}
                  >
                    {finding.snippet}
                  </p>
                </li>
              ))}
            </ul>
            {paths.total > 4 && (
              <p className="font-mono text-[10px] text-muted">
                还有 {paths.total - 4} 处命中，完整清单见下方风险列表。
              </p>
            )}
          </>
        )}

        {paths.total > 0 && (
          <p className="text-[11px] leading-5 text-muted">
            配置文件、脚本和源码中的命中按中风险处理，文档与示例中的命中按低风险处理。
          </p>
        )}
      </div>
    </SectionCard>
  );
}
