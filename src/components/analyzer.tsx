"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import type { AnalysisResult, ApiErrorBody } from "@/lib/types";
import { Report } from "@/components/report/report";
import { Hero } from "@/components/hero";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

type AnalyzerState =
  | { status: "idle" }
  | { status: "loading"; url: string }
  | { status: "error"; message: string; hint?: string; code?: string }
  | { status: "success"; result: AnalysisResult };

function isAnalysisResult(value: unknown): value is AnalysisResult {
  return Boolean(
    value &&
      typeof value === "object" &&
      "repo" in value &&
      "score" in value &&
      "checks" in value &&
      "risks" in value &&
      "advice" in value &&
      "meta" in value,
  );
}

function LoadingState({ url }: { url: string }) {
  return (
    <div className="border border-line bg-surface" role="status">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <LoaderCircle className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">正在分析仓库</p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{url}</p>
        </div>
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted sm:inline">
          5–20 秒
        </span>
      </div>

      <div className="h-0.5 overflow-hidden bg-line/70" aria-hidden="true">
        <span className="animate-scan block h-full w-1/4 bg-accent" />
      </div>

      <div className="space-y-6 p-5">
        <div className="space-y-2.5">
          <div className="h-2.5 w-1/3 animate-pulse bg-line/70" />
          <div className="h-2.5 w-2/3 animate-pulse bg-line/50" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse border border-line/80 bg-paper/60" />
          ))}
        </div>
        <div className="space-y-2.5">
          <div className="h-2.5 w-full animate-pulse bg-line/50" />
          <div className="h-2.5 w-5/6 animate-pulse bg-line/40" />
        </div>
      </div>
      <p className="border-t border-line px-5 py-3 text-[11px] leading-5 text-muted">
        正在拉取文件树、读取关键文件并生成评分。通常需要 5–20 秒，取决于仓库大小。
      </p>
    </div>
  );
}

function ErrorState({
  state,
  onFocusInput,
}: {
  state: Extract<AnalyzerState, { status: "error" }>;
  onFocusInput: () => void;
}) {
  return (
    <div className="border border-line border-l-2 border-l-danger bg-surface" role="alert">
      <div className="flex gap-3 p-5">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{state.message}</p>
          {state.hint && <p className="mt-1 text-xs leading-5 text-muted">{state.hint}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onFocusInput}
              className="border border-ink/25 px-3 py-1.5 text-xs font-medium transition-colors hover:border-ink/50 hover:bg-paper"
            >
              修改链接
            </button>
            {state.code && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {state.code}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Analyzer() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<AnalyzerState>({ status: "idle" });
  const [scrollSignal, setScrollSignal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const runAnalysis = async (rawUrl: string) => {
    const value = rawUrl.trim();

    if (!value) {
      setState({
        status: "error",
        message: "请先输入一个 GitHub 仓库链接。",
        hint: "例如 https://github.com/psf/requests",
      });
      inputRef.current?.focus();
      return;
    }

    setUrl(value);
    setState({ status: "loading", url: value });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const apiError = (payload as ApiErrorBody | null)?.error;
        setState({
          status: "error",
          message: apiError?.message ?? "分析失败，请稍后重试。",
          hint: apiError?.hint,
          code: apiError?.code,
        });
        return;
      }

      if (!isAnalysisResult(payload)) {
        setState({
          status: "error",
          message: "服务返回的数据格式不正确。",
          hint: "请刷新页面后重试。",
          code: "BAD_RESPONSE",
        });
        return;
      }

      setState({ status: "success", result: payload });
      setScrollSignal((value) => value + 1);
    } catch {
      setState({
        status: "error",
        message: "请求没有送达服务器。",
        hint: "请确认本地服务正在运行，然后重试。",
        code: "NETWORK",
      });
    }
  };

  useEffect(() => {
    if (scrollSignal === 0) return;
    const timer = window.setTimeout(() => {
      const report = document.getElementById("report");
      if (!report) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      report.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [scrollSignal]);

  const loading = state.status === "loading";
  const compact = state.status !== "idle";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 sm:px-6 lg:px-8">
        <Hero
          url={url}
          onUrlChange={setUrl}
          onSubmit={runAnalysis}
          loading={loading}
          compact={compact}
          inputRef={inputRef}
        />

        <div aria-live="polite" className={compact ? "mt-6" : ""}>
          {state.status === "loading" && <LoadingState url={state.url} />}
          {state.status === "error" && (
            <ErrorState state={state} onFocusInput={() => inputRef.current?.focus()} />
          )}
        </div>

        {state.status === "success" && <Report result={state.result} />}
      </main>
      <SiteFooter />
    </div>
  );
}
