"use client";

import { useId, type FormEvent, type RefObject } from "react";
import { ArrowRight, GitBranch, LoaderCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export const EXAMPLES = [
  { url: "https://github.com/psf/requests", label: "psf/requests", note: "Python 库" },
  {
    url: "https://github.com/PowerShell/PowerShell",
    label: "PowerShell/PowerShell",
    note: "大量 .ps1",
  },
  {
    url: "https://github.com/microsoft/terminal",
    label: "microsoft/terminal",
    note: "Windows 项目",
  },
];

const DIMENSIONS = [
  { weight: 20, label: "README 文档", detail: "安装 / 启动 / 配置" },
  { weight: 20, label: "依赖与锁定", detail: "清单 / 锁文件" },
  { weight: 20, label: "启动脚本", detail: "一键启动命令" },
  { weight: 15, label: "Windows 适配", detail: ".bat / .cmd / .ps1" },
  { weight: 10, label: "硬编码路径", detail: "C:\\ /Users/ /home/" },
  { weight: 15, label: "敏感信息", detail: "密钥 / 私钥 / .env" },
];

interface HeroProps {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: (url: string) => void;
  loading: boolean;
  compact: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function Hero({
  url,
  onUrlChange,
  onSubmit,
  loading,
  compact,
  inputRef,
}: HeroProps) {
  const inputId = useId();
  const hintId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(url);
  };

  return (
    <section className={cn("pt-12 sm:pt-16", compact && "pt-7 sm:pt-8")}>
      {!compact ? (
        <>
          <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            <span className="flex items-center gap-3">
              <span className="h-px w-8 bg-ink/25" aria-hidden="true" />
              Repo onboarding check
            </span>
            <span className="hidden sm:inline">6 个维度 · 100 分制</span>
          </div>
          <h1 className="mt-6 max-w-3xl text-[2.4rem] font-semibold leading-[1.08] tracking-tight text-balance sm:text-[3.4rem] sm:leading-[1.04]">
            仓库接入前，
            <br />
            先做一次体检。
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            粘贴公开 GitHub 仓库链接，一次看清文档、依赖、启动方式、Windows 适配与密钥风险，
            <br className="hidden sm:block" />
            拿到可执行的接入评分和整改清单。
          </p>
        </>
      ) : (
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight">再查一个仓库</h1>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:inline">
            Repo onboarding check
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={compact ? "mt-4" : "mt-9"}>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={inputId} className="text-[11px] font-medium text-ink">
            公开仓库链接
          </label>
          <span className="font-mono text-[10px] text-muted/80">github.com/owner/repo</span>
        </div>

        <div className="mt-1.5 border border-line-strong bg-surface p-1.5 transition-colors focus-within:border-accent">
          <div className="flex flex-col gap-1.5 sm:flex-row">
            <div className="relative flex-1">
              <GitBranch
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <input
                id={inputId}
                ref={inputRef}
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={url}
                onChange={(event) => onUrlChange(event.target.value)}
                disabled={loading}
                aria-describedby={hintId}
                placeholder="https://github.com/owner/repo"
                className="h-12 w-full bg-transparent pl-10 pr-3 font-mono text-[13px] text-ink outline-none placeholder:text-muted/60 focus-visible:outline-none disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? "体检中" : "开始体检"}
            </button>
          </div>
        </div>
      </form>

      {!compact && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] text-muted">试试</span>
            {EXAMPLES.map((example) => (
              <button
                key={example.url}
                type="button"
                disabled={loading}
                onClick={() => onSubmit(example.url)}
                className="inline-flex items-center gap-2 border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] text-ink transition-colors hover:border-line-strong hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
              >
                {example.label}
                <span className="text-[10px] text-muted">{example.note}</span>
              </button>
            ))}
          </div>

          <p
            id={hintId}
            className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={1.8} aria-hidden="true" />
            只读访问公开仓库 · 不保存仓库代码 · 密钥内容全程脱敏
          </p>

          <div className="mt-10">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[11px] font-medium text-ink">评分维度</span>
              <span className="text-[10px] text-muted">六项合计 100 分</span>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
              {DIMENSIONS.map((item) => (
                <li key={item.label} className="bg-surface px-3.5 py-3">
                  <p className="flex items-baseline gap-1">
                    <span className="font-mono text-[1.375rem] font-medium leading-none text-ink">
                      {item.weight}
                    </span>
                    <span className="text-[9px] text-muted">分</span>
                  </p>
                  <p className="mt-2.5 text-[11px] font-medium leading-4 text-ink">{item.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[9px] leading-4 text-muted">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
