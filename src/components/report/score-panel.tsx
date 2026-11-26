import { ChevronDown } from "lucide-react";
import type { ScoreResult } from "@/lib/types";
import { cn } from "@/lib/cn";

const CX = 120;
const CY = 124;
const RADIUS = 90;

const RULES = [
  { label: "README 文档", points: 20 },
  { label: "依赖与锁定", points: 20 },
  { label: "启动脚本", points: 20 },
  { label: "Windows 适配", points: 15 },
  { label: "硬编码路径", points: 10 },
  { label: "敏感信息", points: 15 },
];

function angleFor(value: number): number {
  return Math.PI - (value / 100) * Math.PI;
}

function pointOnArc(value: number, radius: number) {
  return {
    x: Number((CX + radius * Math.cos(angleFor(value))).toFixed(2)),
    y: Number((CY - radius * Math.sin(angleFor(value))).toFixed(2)),
  };
}

function gaugeColor(score: number): string {
  if (score >= 85) return "var(--color-ok)";
  if (score >= 70) return "var(--color-accent)";
  if (score >= 55) return "var(--color-warn)";
  return "var(--color-danger)";
}

function gradeClass(grade: ScoreResult["grade"]): string {
  if (grade === "A") return "bg-ok text-paper";
  if (grade === "B") return "bg-accent text-paper";
  if (grade === "C") return "bg-warn text-paper";
  return "bg-danger text-paper";
}

function ScoreGauge({ score, grade }: { score: number; grade: ScoreResult["grade"] }) {
  const start = pointOnArc(0, RADIUS);
  const end = pointOnArc(100, RADIUS);
  const dot = pointOnArc(score, RADIUS);
  const markerInner = pointOnArc(score, RADIUS + 5);
  const markerOuter = pointOnArc(score, RADIUS + 14);
  const color = gaugeColor(score);
  const clamped = Math.min(Math.max(score, 0), 100);

  return (
    <svg
      viewBox="0 0 240 152"
      className="w-full max-w-[250px]"
      role="img"
      aria-label={`接入就绪度 ${score} 分，等级 ${grade}`}
    >
      <path
        d={`M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={5}
      />
      {clamped > 0 && (
        <path
          d={`M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth={5}
          pathLength={100}
          strokeDasharray={`${clamped} 100`}
        />
      )}

      {Array.from({ length: 21 }, (_, index) => index * 5).map((value) => {
        const major = value % 25 === 0;
        const inner = pointOnArc(value, RADIUS + 6);
        const outer = pointOnArc(value, RADIUS + (major ? 13 : 9));
        const passed = value <= clamped;
        return (
          <line
            key={value}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={passed ? "var(--color-ink)" : "var(--color-line-strong)"}
            strokeWidth={major ? 1.2 : 1}
            opacity={passed ? 0.4 : 0.9}
          />
        );
      })}

      <line
        x1={markerInner.x}
        y1={markerInner.y}
        x2={markerOuter.x}
        y2={markerOuter.y}
        stroke={color}
        strokeWidth={2}
      />
      <circle
        cx={dot.x}
        cy={dot.y}
        r={3}
        fill="var(--color-surface)"
        stroke={color}
        strokeWidth={2.5}
      />

      <text
        x={CX}
        y={92}
        textAnchor="middle"
        fontSize={44}
        fontWeight={600}
        letterSpacing="-1"
        fill="var(--color-ink)"
        className="font-mono"
      >
        {score}
      </text>
      <text
        x={CX}
        y={110}
        textAnchor="middle"
        fontSize={10}
        fill="var(--color-muted)"
        className="font-mono"
      >
        / 100
      </text>
      <text
        x={start.x}
        y={148}
        textAnchor="middle"
        fontSize={9}
        fill="var(--color-muted)"
        className="font-mono"
      >
        0
      </text>
      <text
        x={end.x}
        y={148}
        textAnchor="middle"
        fontSize={9}
        fill="var(--color-muted)"
        className="font-mono"
      >
        100
      </text>
    </svg>
  );
}

function DimensionBar({
  label,
  earned,
  max,
  detail,
}: {
  label: string;
  earned: number;
  max: number;
  detail: string;
}) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (earned / max) * 100)) : 0;
  const tone = percent >= 80 ? "bg-accent" : percent >= 50 ? "bg-warn" : "bg-danger";

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-ink">{label}</span>
        <span className="font-mono text-[11px] text-muted">
          <span className="text-ink">{earned}</span>
          <span className="text-muted/70">/{max}</span>
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden bg-line/70">
        <div className={cn("h-full", tone)} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 truncate font-mono text-[10px] leading-4 text-muted" title={detail}>
        {detail}
      </p>
    </li>
  );
}

export function ScorePanel({
  score,
  aiScore,
}: {
  score: ScoreResult;
  aiScore?: number;
}) {
  return (
    <section className="border border-line bg-surface">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[320px_1fr] lg:gap-0 lg:p-0">
        <div className="flex flex-col border-b border-line pb-6 lg:border-b-0 lg:border-r lg:p-6 lg:pb-6">
          <div className="flex w-full items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">接入就绪度</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              0–100
            </span>
          </div>

          <div className="mx-auto mt-1 w-full max-w-[250px]">
            <ScoreGauge score={score.total} grade={score.grade} />
          </div>

          <div className="mt-1 flex w-full items-center gap-3 border-t border-line pt-4">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center font-mono text-lg font-semibold",
                gradeClass(score.grade),
              )}
            >
              {score.grade}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-5">{score.verdict}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Grade {score.grade} · {score.total}/100
              </p>
            </div>
          </div>

          {aiScore !== undefined && (
            <p className="mt-3 w-full border-t border-line pt-2.5 font-mono text-[10px] text-muted">
              AI 参考评分 <span className="text-accent">{aiScore}</span>/100
            </p>
          )}
        </div>

        <div className="min-w-0 lg:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">评分构成</h2>
            <span className="text-[10px] text-muted">六项维度 · 合计 100 分</span>
          </div>
          <ul className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {score.dimensions.map((dimension) => (
              <DimensionBar
                key={dimension.key}
                label={dimension.label}
                earned={dimension.earned}
                max={dimension.max}
                detail={dimension.detail}
              />
            ))}
          </ul>

          <details className="group mt-6 border-t border-line pt-4">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink">
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
              查看评分规则
            </summary>
            <div className="mt-3 space-y-3 text-[11px] leading-5 text-muted">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
                {RULES.map((rule) => (
                  <div
                    key={rule.label}
                    className="flex items-baseline justify-between gap-2 border-b border-line/60 pb-1"
                  >
                    <span>{rule.label}</span>
                    <span className="font-mono text-[10px] text-ink">{rule.points}</span>
                  </div>
                ))}
              </div>
              <p>
                等级：85 分及以上 A，70–84 B，55–69 C，55 分以下 D。高危敏感信息会把“敏感信息”维度直接扣到 0 分。
              </p>
              <p>评分为自动化规则结果，用于快速判断接入成本，不替代安全审计。</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
