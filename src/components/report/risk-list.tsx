"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { RiskItem, Severity } from "@/lib/types";
import { cn } from "@/lib/cn";
import { EmptyLine, SeverityPill } from "./shared";

type Filter = "all" | Severity;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "high", label: "高危" },
  { key: "medium", label: "中危" },
  { key: "low", label: "低危" },
];

export function RiskList({ risks }: { risks: RiskItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts: Record<Filter, number> = {
    all: risks.length,
    high: risks.filter((risk) => risk.severity === "high").length,
    medium: risks.filter((risk) => risk.severity === "medium").length,
    low: risks.filter((risk) => risk.severity === "low").length,
  };

  const filtered = filter === "all" ? risks : risks.filter((risk) => risk.severity === filter);

  return (
    <section className="border-t border-ink pt-3">
      <header className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-[15px] font-semibold leading-5">主要风险清单</h2>
            <span className="font-mono text-[11px] leading-4 text-muted">{risks.length} 条</span>
          </div>
          <p className="mt-0.5 text-[12px] leading-4 text-muted">按严重程度排序，建议先处理高危项</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className="key key-small gap-1.5 px-2.5"
            >
              {item.label}
              <span
                className={cn(
                  "font-mono text-[11px]",
                  filter === item.key ? "text-accent-ink" : "text-muted",
                )}
              >
                {counts[item.key]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <EmptyLine>当前筛选条件下没有风险项。</EmptyLine>
      ) : (
        <ul className="border-t border-line">
          {filtered.map((risk, index) => (
            <li key={risk.id} className="border-b border-line/70">
              <details className="group" open={index === 0 && risk.severity === "high"}>
                <summary className="flex cursor-pointer list-none items-start gap-3 py-3 transition-colors hover:bg-paper-3/60">
                  <SeverityPill severity={risk.severity} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-[13px] font-medium leading-5 text-ink">
                        {risk.title}
                      </span>
                      <span className="rounded-[var(--radius-pill)] border border-line bg-paper-3 px-1.5 py-px text-[11px] leading-4 text-muted">
                        {risk.category}
                      </span>
                    </div>
                    {risk.file && (
                      <p className="mt-1 truncate font-mono text-[11px] text-muted">
                        {risk.file}
                        {risk.line ? `:${risk.line}` : ""}
                      </p>
                    )}
                  </div>
                  <ChevronDown
                    className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="border-t border-line/70 pb-4 pt-3 sm:pl-[5.5rem]">
                  <p className="text-[12px] leading-6 text-muted">{risk.description}</p>
                  {risk.evidence && (
                    <p className="mt-2 whitespace-pre-wrap break-all rounded-[var(--radius-pill)] border border-line bg-paper-3 px-3 py-2 font-mono text-[12px] leading-5 text-ink">
                      {risk.evidence}
                    </p>
                  )}
                  <p className="mt-2 text-[12px] leading-6">
                    <span className="font-medium text-ink">建议：</span>
                    <span className="text-muted">{risk.suggestion}</span>
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-line pt-3 text-[11px] leading-5 text-muted">
        共 {risks.length} 条风险
        {filter !== "all" ? `，当前显示 ${filtered.length} 条` : ""}。规则命中可能存在误报，处理前请先确认文件上下文。
      </p>
    </section>
  );
}
