import { ChevronDown } from "lucide-react";
import type { ScoreResult } from "@/lib/types";
import { cn } from "@/lib/cn";

const CX = 120;
const CY = 126;
const RADIUS = 88;

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
  if (score >= 70) return "var(--color-accent)";
  if (score >= 55) return "var(--color-warn)";
  return "var(--color-danger)";
}

function gradeClass(grade: ScoreResult["grade"]): string {
  if (grade === "A") return "border-ok/30 bg-ok-soft text-ok";
  if (grade === "B") return "border-accent/30 bg-accent-soft text-accent";
  if (grade === "C") return "border-warn/30 bg-warn-soft text-warn";
  return "border-danger/30 bg-danger-soft text-danger";
}

function ScoreGauge({ score, grade }: { score: number; grade: ScoreResult["grade"] }) {
  const start = pointOnArc(0, RADIUS);
  const end = pointOnArc(100, RADIUS);
  const dot = pointOnArc(score, RADIUS);
  const color = gaugeColor(score);

  return (
    <svg
      viewBox="0 0 240 150"
      className="w-full max-w-[260px]"
      role="img"
      aria-label={`接入就绪度 ${score} 分，等级 ${grade}`}
    >
      <path
        d={`M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={9}
        pathLength={100}
      />
      {score > 0 && (
        <path
          d={`M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth={9}
          pathLength={100}
          strokeDasharray={`${Math.min(score, 100)} 100`}
        />
      )}

      {Array.from({ length: 11 }, (_, index) => index * 10).map((value) => {
        const inner = pointOnArc(value, RADIUS + 8);
        const outer = pointOnArc(value, RADIUS + 14);
        const passed = value <= score;
        return (
          <line
            key={value}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={passed ? "var(--color-ink)" : "var(--color-line-strong)"}
            strokeWidth={1}
            opacity={passed ? 0.45 : 0.7}
          />
        );
      })}

      <line
        x1={CX - RADIUS}
        y1={CY}
        x2={CX + RADIUS}
        y2={CY}
        stroke="var(--color-line-strong)"
        strokeWidth={1}
      />

      <circle
        cx={dot.x}
        cy={dot.y}
        r={4.5}
        fill={color}
        stroke="var(--color-surface)"
        strokeWidth={2}
      />

      <text
        x={CX}
        y={91}
        textAnchor="middle"
        fontSize={42}
        fontWeight={600}
        fill="var(--color-ink)"
        className="font-mono"
      >
        {score}
      </text>
      <text
        x={CX}
        y={108}
        textAnchor="middle"
        fontSize={10}
        fill="var(--color-muted)"
        className="font-mono"
      >
        / 100
      </text>
      <text x={CX - RADIUS} y={142} textAnchor="middle" fontSize={9} fill="var(--color-muted)" className="font-mono">
        0
      </text>
      <text x={CX + RADIUS} y={142} textAnchor="middle" fontSize={9} fill="var(--color-muted)" className="font-mono">
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
          <span className="text-ink">{earned}</span>/{max}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden bg-line/60">
        <div className={cn("h-full", tone)} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 truncate font-mono text-[10px] text-muted" title={detail}>
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
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[300px_1fr] lg:gap-8">
        <div className="flex flex-col items-center justify-center border-b border-line pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            接入就绪度
          </p>
          <div className="mt-1 w-full max-w-[260px]">
            <ScoreGauge score={score.total} grade={score.grade} />
          </div>
          <div className="mt-1 flex w-full items-center gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center border font-mono text-lg font-semibold",
                gradeClass(score.grade),
              )}
            >
              {score.grade}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-5">{score.verdict}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Grade {score.grade} · {score.total}/100
              </p>
            </div>
          </div>
          {aiScore !== undefined && (
            <p className="mt-3 w-full border-t border-line pt-2.5 text-center font-mono text-[10px] text-muted">
              AI 参考评分 <span className="text-accent">{aiScore}</span>/100
            </p>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">评分构成</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              6 dimensions
            </span>
          </div>
          <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
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

          <details className="group mt-5 border-t border-line pt-4">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink">
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
              查看评分规则
            </summary>
            <div className="mt-3 space-y-2 text-[11px] leading-5 text-muted">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[10px] sm:grid-cols-3">
                <span>README 文档 · 20</span>
                <span>依赖与锁定 · 20</span>
                <span>启动脚本 · 20</span>
                <span>Windows 适配 · 15</span>
                <span>硬编码路径 · 10</span>
                <span>敏感信息 · 15</span>
              </div>
              <p className="text-muted">
                等级：85 分及以上 A，70–84 B，55–69 C，55 分以下 D。高危敏感信息会把“敏感信息”维度直接扣到 0 分。
              </p>
              <p className="text-muted">
                评分为自动化规则结果，用于快速判断接入成本，不替代安全审计。
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
