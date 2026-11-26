import type { ReactNode } from "react";
import { Check, CircleAlert, Minus, X } from "lucide-react";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/cn";

export type Tone = "ok" | "warn" | "bad" | "neutral";

export const SEVERITY_META: Record<
  Severity,
  { label: string; className: string; dot: string }
> = {
  high: {
    label: "高危",
    className: "border-danger/25 bg-danger-soft text-danger",
    dot: "bg-danger",
  },
  medium: {
    label: "中危",
    className: "border-warn/25 bg-warn-soft text-warn",
    dot: "bg-warn",
  },
  low: {
    label: "低危",
    className: "border-line-strong bg-paper text-muted",
    dot: "bg-muted/60",
  },
};

export const TONE_META: Record<Tone, { label: string; className: string; dot: string }> = {
  ok: { label: "良好", className: "border-ok/25 bg-ok-soft text-ok", dot: "bg-ok" },
  warn: { label: "待补", className: "border-warn/25 bg-warn-soft text-warn", dot: "bg-warn" },
  bad: { label: "缺失", className: "border-danger/25 bg-danger-soft text-danger", dot: "bg-danger" },
  neutral: { label: "—", className: "border-line-strong bg-paper text-muted", dot: "bg-muted/60" },
};

export function SeverityPill({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-0.5 text-[10px] font-medium leading-4",
        meta.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function TonePill({ tone, label }: { tone: Tone; label?: string }) {
  const meta = TONE_META[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border px-1.5 py-0.5 text-[10px] font-medium leading-4",
        meta.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {label ?? meta.label}
    </span>
  );
}

export function SectionCard({
  title,
  subtitle,
  points,
  max,
  headRight,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  points?: number;
  max?: number;
  headRight?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col border border-line bg-surface", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] leading-4 text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headRight}
          {points !== undefined && max !== undefined && (
            <span className="font-mono text-xs text-muted">
              <span className="text-ink">{points}</span>
              <span className="text-muted/70">/{max}</span>
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function MonoTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] leading-4 text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FactRow({
  state,
  label,
  value,
}: {
  state: "ok" | "bad" | "na";
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-xs last:border-b-0">
      <span className="flex items-center gap-1.5 text-muted">
        {state === "ok" ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
        ) : state === "bad" ? (
          <X className="h-3.5 w-3.5 shrink-0 text-danger/80" aria-hidden="true" />
        ) : (
          <Minus className="h-3.5 w-3.5 shrink-0 text-muted/50" aria-hidden="true" />
        )}
        {label}
      </span>
      {value && (
        <span className="max-w-[60%] truncate font-mono text-[10px] text-ink" title={value}>
          {value}
        </span>
      )}
    </div>
  );
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-paper/70 px-3.5 py-3 text-xs leading-5 text-muted">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function NoteLine({
  tone = "warn",
  children,
}: {
  tone?: "warn" | "bad" | "ok";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 border px-3 py-2.5 text-[11px] leading-5",
        tone === "bad"
          ? "border-danger/20 bg-danger-soft/40 text-danger"
          : tone === "ok"
            ? "border-line bg-paper/70 text-muted"
            : "border-warn/20 bg-warn-soft/40 text-warn",
      )}
    >
      {tone === "ok" ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
      ) : (
        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span className={tone === "warn" ? "text-muted" : undefined}>{children}</span>
    </div>
  );
}
