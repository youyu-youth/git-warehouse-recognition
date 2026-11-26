import { ListChecks, Sparkles } from "lucide-react";
import type { Advice, AdvicePriority } from "@/lib/types";
import { cn } from "@/lib/cn";

const PRIORITY_META: Record<AdvicePriority, { label: string; className: string }> = {
  high: {
    label: "优先处理",
    className: "border-danger/20 bg-danger-soft/40 text-danger",
  },
  medium: {
    label: "建议处理",
    className: "border-warn/20 bg-warn-soft/50 text-warn",
  },
  low: {
    label: "可以后置",
    className: "border-line bg-paper text-muted",
  },
};

export function AiAdvice({ advice }: { advice: Advice }) {
  const isAi = advice.source === "ai";

  return (
    <section className="border border-line border-l-2 border-l-accent bg-surface">
      <header className="flex flex-col gap-2 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            {isAi ? (
              <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            ) : (
              <ListChecks className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            )}
            接入建议
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">结合体检结果给出的下一步动作</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
              isAi
                ? "border-accent/25 bg-accent-soft text-accent"
                : "border-line bg-paper text-muted",
            )}
          >
            {isAi ? `AI · ${advice.model ?? "model"}` : "本地规则"}
          </span>
          {advice.aiScore !== undefined && (
            <span className="border border-line bg-paper px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] text-muted">
              AI 参考评分 <span className="text-accent">{advice.aiScore}</span>/100
            </span>
          )}
        </div>
      </header>

      <div className="p-4 sm:p-5">
        <p className="max-w-3xl text-sm leading-7 text-ink">{advice.summary}</p>

        <ol className="mt-5 space-y-4">
          {advice.suggestions.map((suggestion, index) => {
            const meta = PRIORITY_META[suggestion.priority];
            return (
              <li key={`${suggestion.title}-${index}`} className="flex gap-3.5">
                <span className="mt-0.5 shrink-0 font-mono text-[10px] leading-5 text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-ink">{suggestion.title}</p>
                    <span
                      className={cn(
                        "border px-1.5 py-0.5 text-[9px] leading-4 tracking-[0.04em]",
                        meta.className,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-6 text-muted">{suggestion.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {advice.note && (
          <p className="mt-5 border-t border-line pt-3 text-[10px] leading-5 text-muted">
            {advice.note}
          </p>
        )}
      </div>
    </section>
  );
}
