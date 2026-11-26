import type { ReactNode } from "react";
import { Check, CircleAlert, Minus, X } from "lucide-react";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/cn";

export type Tone = "ok" | "warn" | "bad" | "neutral";

export const SEVERITY_META: Record<Severity, { label: string; className: string }> = {
  high: {
    label: "高危",
    className: "border-danger/30 bg-danger-soft text-danger",
  },
  medium: {
    label: "中危",
    className: "border-warn/30 bg-warn-soft text-warn",
  },
  low: {
    label: "低危",
    className: "border-line-strong bg-paper-3 text-muted",
  },
};

export const TONE_META: Record<Tone, { label: string; className: string }> = {
  ok: { label: "良好", className: "border-ok/30 bg-ok-soft text-ok" },
  warn: { label: "待补", className: "border-warn/30 bg-warn-soft text-warn" },
  bad: { label: "缺失", className: "border-danger/30 bg-danger-soft text-danger" },
  neutral: { label: "不适用", className: "border-line-strong bg-paper-3 text-muted" },
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
        "inline-flex shrink-0 items-center rounded-[var(--radius-pill)] border px-2 py-0.5 text-[11px] font-medium leading-4",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function TonePill({ tone, label }: { tone: Tone; label?: string }) {
  const meta = TONE_META[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-[var(--radius-pill)] border px-2 py-0.5 text-[11px] font-medium leading-4",
        meta.className,
      )}
    >
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
    <section className={cn("flex flex-col border-t border-ink pt-3", className)}>
      <header className="flex items-start justify-between gap-3 pb-3">
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-semibold leading-5">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12px] leading-4 text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headRight}
          {points !== undefined && max !== undefined && (
            <span className="font-mono text-[12px] text-muted">
              <span className="text-ink">{points}</span>
              <span>/{max}</span>
            </span>
          )}
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export function MonoTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-[var(--radius-pill)] border border-line bg-paper-3 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-ink-2",
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
  mono = false,
}: {
  state: "ok" | "bad" | "na";
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/70 py-2 text-[12px] last:border-b-0">
      <span className="flex items-center gap-1.5 text-muted">
        {state === "ok" ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
        ) : state === "bad" ? (
          <X className="h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
        ) : (
          <Minus className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
        )}
        {label}
      </span>
      {value && (
        <span
          className={cn(
            "max-w-[60%] truncate text-[12px] text-ink",
            mono && "font-mono text-[11px]",
          )}
          title={value}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-pill)] bg-paper-3 px-3 py-2.5 text-[12px] leading-5 text-ink-2">
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
        "flex items-start gap-2 rounded-[var(--radius-pill)] border px-3 py-2.5 text-[12px] leading-5",
        tone === "bad"
          ? "border-danger/25 bg-danger-soft text-ink-2"
          : tone === "ok"
            ? "border-line bg-paper-3 text-ink-2"
            : "border-warn/25 bg-warn-soft text-ink-2",
      )}
    >
      {tone === "ok" ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden="true" />
      ) : (
        <CircleAlert
          className={cn(
            "mt-0.5 h-3.5 w-3.5 shrink-0",
            tone === "bad" ? "text-danger" : "text-warn",
          )}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </div>
  );
}
