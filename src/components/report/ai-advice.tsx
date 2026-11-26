import { ListChecks, Sparkles } from "lucide-react";
import type { Advice, AdvicePriority } from "@/lib/types";
import { cn } from "@/lib/cn";

const PRIORITY_META: Record<AdvicePriority, { label: string; className: string }> = {
  high: {
    label: "优先处理",
    className: "border-danger/25 bg-danger-soft text-danger",
  },
  medium: {
    label: "建议处理",
    className: "border-warn/25 bg-warn-soft text-warn",
  },
  low: {
    label: "可以后置",
    className: "border-line bg-paper-3 text-muted",
  },
};

export function AiAdvice({ advice }: { advice: Advice }) {
  const isAi = advice.source === "ai";

  return (
    <section className="border-t border-ink pt-3">
      <header className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-1.5 font-display text-[15px] font-semibold leading-5">
            {isAi ? (
              <Sparkles className="h-3.5 w-3.5 text-ink" aria-hidden="true" />
            ) : (
              <ListChecks className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            )}
            接入建议
          </h2>
          <p className="mt-0.5 text-[12px] leading-4 text-muted">结合体检结果给出的下一步动作</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-[var(--radius-pill)] border px-2 py-0.5 text-[11px] leading-4",
              isAi
                ? "border-accent/40 bg-accent-soft text-ink"
                : "border-line bg-paper-3 text-muted",
            )}
          >
            {isAi ? `AI 生成（${advice.model ?? "model"}）` : "本地规则"}
          </span>
          {advice.aiScore !== undefined && (
            <span className="rounded-[var(--radius-pill)] border border-line bg-paper-3 px-2 py-0.5 text-[11px] leading-4 text-muted">
              AI 参考评分 <span className="font-mono text-ink">{advice.aiScore}</span> / 100
            </span>
          )}
        </div>
      </header>

      <p className="max-w-3xl text-[14px] leading-7 text-ink">{advice.summary}</p>

      <ol className="mt-5 space-y-4 border-t border-line pt-4">
        {advice.suggestions.map((suggestion, index) => {
          const meta = PRIORITY_META[suggestion.priority];
          return (
            <li key={`${suggestion.title}-${index}`} className="flex gap-3.5">
              <span className="mt-0.5 shrink-0 font-mono text-[11px] leading-5 text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-medium text-ink">{suggestion.title}</p>
                  <span
                    className={cn(
                      "rounded-[var(--radius-pill)] border px-2 py-0.5 text-[11px] leading-4",
                      meta.className,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-6 text-muted">{suggestion.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {advice.note && (
        <p className="mt-5 border-t border-line pt-3 text-[11px] leading-5 text-muted">
          {advice.note}
        </p>
      )}
    </section>
  );
}
