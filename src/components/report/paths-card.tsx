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
              <span className="font-mono text-[24px] font-medium leading-none text-ink">
                {paths.total}
              </span>
              <span className="text-[12px] text-muted">
                处命中，涉及 {paths.filesAffected} 个文件
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 border-t border-ink pt-2">
              {Object.entries(PATTERN_LABELS).map(([pattern, patternLabel]) => {
                const count = paths.byPattern[pattern as keyof typeof paths.byPattern];
                return (
                  <div
                    key={pattern}
                    className="flex items-baseline justify-between gap-2 border-b border-line py-1.5"
                  >
                    <span className="text-[11px] leading-4 text-muted">{patternLabel}</span>
                    <span
                      className={
                        count > 0
                          ? "font-mono text-[16px] leading-none text-ink"
                          : "font-mono text-[16px] leading-none text-muted"
                      }
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            <ul className="border-t border-line">
              {paths.findings.slice(0, 4).map((finding) => (
                <li key={finding.id} className="border-b border-line/70 py-2 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="min-w-0 truncate font-mono text-[11px] text-ink"
                      title={`${finding.path}:${finding.line}`}
                    >
                      {finding.path}:{finding.line}
                    </span>
                    <SeverityPill severity={finding.severity} />
                  </div>
                  <p
                    className="mt-1 truncate font-mono text-[11px] text-muted"
                    title={finding.snippet}
                  >
                    {finding.snippet}
                  </p>
                </li>
              ))}
            </ul>
            {paths.total > 4 && (
              <p className="text-[11px] text-muted">
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
