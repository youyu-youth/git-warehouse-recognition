import type { SecretsCheck } from "@/lib/types";
import { EmptyLine, FactRow, SectionCard, SeverityPill, TonePill, type Tone } from "./shared";

export function SecretsCard({ secrets }: { secrets: SecretsCheck }) {
  const tone: Tone =
    secrets.bySeverity.high > 0
      ? "bad"
      : secrets.bySeverity.medium > 0
        ? "warn"
        : secrets.bySeverity.low > 0
          ? "neutral"
          : "ok";
  const label =
    secrets.bySeverity.high > 0
      ? "高风险"
      : secrets.bySeverity.medium > 0
        ? "待确认"
        : secrets.bySeverity.low > 0
          ? "低风险"
          : "良好";

  const gitignoreState = !secrets.gitignoreFound
    ? "bad"
    : secrets.gitignoreCoversEnv
      ? "ok"
      : "bad";
  const gitignoreValue = !secrets.gitignoreFound
    ? "缺少"
    : secrets.gitignoreCoversEnv
      ? "已忽略 .env"
      : "未忽略 .env";

  return (
    <SectionCard
      index="06"
      title="敏感信息"
      subtitle="密钥 / 私钥 / .env 入库"
      points={secrets.points}
      max={15}
      headRight={<TonePill tone={tone} label={label} />}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-px border border-line bg-line text-center">
          <div className="bg-surface px-2 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">高危</p>
            <p className="mt-0.5 font-mono text-lg leading-none text-danger">
              {secrets.bySeverity.high}
            </p>
          </div>
          <div className="bg-surface px-2 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">中危</p>
            <p className="mt-0.5 font-mono text-lg leading-none text-warn">
              {secrets.bySeverity.medium}
            </p>
          </div>
          <div className="bg-surface px-2 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">低危</p>
            <p className="mt-0.5 font-mono text-lg leading-none text-ink">
              {secrets.bySeverity.low}
            </p>
          </div>
        </div>

        <div className="pt-1">
          <FactRow
            state={secrets.envFilesCommitted.length > 0 ? "bad" : "ok"}
            label=".env 文件入库"
            value={
              secrets.envFilesCommitted.length > 0
                ? `${secrets.envFilesCommitted.length} 个`
                : "未发现"
            }
          />
          <FactRow state={gitignoreState} label=".gitignore" value={gitignoreValue} />
        </div>

        {secrets.findings.length > 0 ? (
          <>
            <ul className="divide-y divide-line/60 border-y border-line/60">
              {secrets.findings.slice(0, 5).map((finding) => (
                <li key={finding.id} className="py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[11px] font-medium text-ink">
                      {finding.rule}
                    </span>
                    <SeverityPill severity={finding.severity} />
                  </div>
                  <p
                    className="mt-0.5 truncate font-mono text-[10px] text-muted"
                    title={`${finding.path}:${finding.line}`}
                  >
                    {finding.path}
                    {finding.line > 0 ? `:${finding.line}` : ""} · {finding.masked}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-[11px] leading-5 text-muted">
              密钥内容已脱敏，只保留前缀和长度；完整值不会出现在页面或日志中。
              {secrets.total > 5 ? ` 另有 ${secrets.total - 5} 条见下方风险列表。` : ""}
            </p>
          </>
        ) : (
          <EmptyLine>在已读取的文件中，未发现明显密钥或私钥内容。</EmptyLine>
        )}
      </div>
    </SectionCard>
  );
}
