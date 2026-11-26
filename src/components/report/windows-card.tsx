import type { StartCheck, WindowsCheck } from "@/lib/types";
import { FactRow, NoteLine, SectionCard, TonePill, type Tone } from "./shared";

function toneFor(points: number): Tone {
  if (points >= 12) return "ok";
  if (points > 0) return "warn";
  return "bad";
}

export function WindowsCard({
  windows,
  start,
}: {
  windows: WindowsCheck;
  start: StartCheck;
}) {
  const tone = toneFor(windows.points);
  const label = windows.points >= 12 ? "良好" : windows.points > 0 ? "待补" : "缺失";
  const hasPs1 = windows.scripts.some((script) => script.type === "ps1");

  return (
    <SectionCard
      index="04"
      title="Windows 适配"
      subtitle=".bat / .cmd / .ps1 / .vbs"
      points={windows.points}
      max={15}
      headRight={<TonePill tone={tone} label={label} />}
    >
      <div className="space-y-3">
        {windows.total > 0 ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl leading-none text-ink">{windows.total}</span>
              <span className="text-xs text-muted">个 Windows 专用脚本</span>
            </div>
            <ul className="divide-y divide-line/60 border-y border-line/60">
              {windows.scripts.slice(0, 6).map((script) => (
                <li key={script.path} className="flex items-center justify-between gap-3 py-1.5">
                  <span
                    className="min-w-0 truncate font-mono text-[10px] text-ink"
                    title={script.path}
                  >
                    {script.path}
                  </span>
                  <span className="shrink-0 border border-line bg-paper px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                    {script.type}
                  </span>
                </li>
              ))}
            </ul>
            {windows.total > 6 && (
              <p className="font-mono text-[10px] text-muted">还有 {windows.total - 6} 个未列出</p>
            )}
          </>
        ) : (
          <NoteLine tone={start.crossPlatform ? "ok" : "warn"}>
            {start.crossPlatform
              ? "没有发现 Windows 专用脚本，但现有启动方式跨平台，Windows 可以直接运行。"
              : "没有发现 Windows 专用脚本，现有启动方式可能无法在 Windows 直接运行。"}
          </NoteLine>
        )}

        <div className="pt-1">
          <FactRow
            state={windows.documented ? "ok" : windows.total > 0 ? "bad" : "na"}
            label="README 说明"
            value={windows.documented ? "已说明" : windows.total > 0 ? "未说明" : "无脚本"}
          />
          <FactRow
            state={windows.executionPolicyNote ? "ok" : hasPs1 ? "bad" : "na"}
            label="PowerShell 执行策略提示"
            value={
              windows.executionPolicyNote ? "已提示" : hasPs1 ? "未提示" : "无 .ps1"
            }
          />
          <FactRow
            state={start.crossPlatform ? "ok" : "bad"}
            label="Windows 可直接启动"
            value={start.crossPlatform ? "是" : "否"}
          />
          <FactRow
            state={windows.shellOnlyStart ? "bad" : "ok"}
            label="仅 .sh 启动"
            value={windows.shellOnlyStart ? "是" : "否"}
          />
        </div>
      </div>
    </SectionCard>
  );
}
