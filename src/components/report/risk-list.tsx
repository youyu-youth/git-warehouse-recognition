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
    <section className="border border-line bg-surface">
      <header className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 font-mono text-[10px] tracking-[0.16em] text-muted">07</span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">主要风险清单</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              按严重程度排序，建议先处理高危项
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-0.5 border border-line bg-paper p-0.5">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className={cn(
                "px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors",
                filter === item.key
                  ? "bg-ink text-paper"
                  : "text-muted hover:bg-surface hover:text-ink",
              )}
            >
              {item.label}
              <span className="ml-1 opacity-70">{counts[item.key]}</span>
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="p-4 sm:p-5">
          <EmptyLine>当前筛选条件下没有风险项。</EmptyLine>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((risk, index) => (
            <li key={risk.id}>
              <details
                className="group"
                open={index === 0 && risk.severity === "high"}
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 transition-colors hover:bg-paper/60 sm:px-5">
                  <SeverityPill severity={risk.severity} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-medium leading-5 text-ink">
                        {risk.title}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        {risk.category}
                      </span>
                    </div>
                    {risk.file && (
                      <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
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
                <div className="border-t border-line/60 px-4 pb-4 pt-3 sm:pl-[5.25rem] sm:pr-5">
                  <p className="text-xs leading-6 text-muted">{risk.description}</p>
                  {risk.evidence && (
                    <p className="mt-2 whitespace-pre-wrap break-all border border-line bg-paper px-3 py-2 font-mono text-[10px] leading-5 text-ink">
                      {risk.evidence}
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-6">
                    <span className="font-medium text-ink">建议：</span>
                    <span className="text-muted">{risk.suggestion}</span>
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-line px-4 py-3 text-[11px] text-muted sm:px-5">
        共 {risks.length} 条风险
        {filter !== "all" ? `，当前显示 ${filtered.length} 条` : ""}。规则命中可能存在误报，处理前请先确认文件上下文。
      </p>
    </section>
  );
}
