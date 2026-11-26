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
  { weight: 20, label: "README 文档", detail: "安装、启动、配置", mono: false },
  { weight: 20, label: "依赖与锁定", detail: "清单与锁文件", mono: false },
  { weight: 20, label: "启动脚本", detail: "一键启动命令", mono: false },
  { weight: 15, label: "Windows 适配", detail: ".bat / .cmd / .ps1", mono: true },
  { weight: 10, label: "硬编码路径", detail: "C:\\ /Users/ /home/", mono: true },
  { weight: 15, label: "敏感信息", detail: "密钥、私钥、.env", mono: false },
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
    <section className={cn("pt-10 sm:pt-14", compact && "pt-7 sm:pt-8")}>
      {!compact ? (
        <>
          <h1 className="max-w-3xl text-[2.35rem] font-semibold leading-[1.12] tracking-[-0.01em] sm:text-[3.25rem] sm:leading-[1.06]">
            仓库接入前，
            <br />
            先做一次体检。
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-muted">
            粘贴公开 GitHub 仓库链接，一次看清文档、依赖、启动方式、Windows 适配与密钥风险，拿到可执行的接入评分和整改清单。
          </p>
        </>
      ) : (
        <h1 className="text-[20px] font-semibold leading-tight">再查一个仓库</h1>
      )}

      <form onSubmit={handleSubmit} className={compact ? "mt-4" : "mt-8"}>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={inputId} className="text-[12px] font-medium text-ink">
            公开仓库链接
          </label>
          <span className="font-mono text-[11px] text-muted">github.com/owner/repo</span>
        </div>

        <div className="field-shell mt-2 flex flex-col gap-1.5 p-1.5 sm:flex-row">
          <div className="relative flex-1">
            <GitBranch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
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
              aria-describedby={compact ? undefined : hintId}
              placeholder="https://github.com/owner/repo"
              className="field-input w-full pl-9 pr-3 font-mono text-[16px] sm:text-[13px]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="key key-primary min-h-10 px-5"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
            {loading ? "体检中" : "开始体检"}
          </button>
        </div>
      </form>

      {!compact && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] text-muted">试试</span>
            {EXAMPLES.map((example) => (
              <button
                key={example.url}
                type="button"
                disabled={loading}
                onClick={() => onSubmit(example.url)}
                className="key key-small gap-2"
              >
                <span className="font-mono text-[11px] text-ink">{example.label}</span>
                <span className="text-[11px] text-muted">{example.note}</span>
              </button>
            ))}
          </div>

          <p
            id={hintId}
            className="mt-4 flex items-start gap-1.5 text-[12px] leading-5 text-muted"
          >
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-ok"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            只读访问公开仓库，不保存仓库代码，密钥内容全程脱敏。
          </p>

          <div className="mt-9">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[12px] font-medium text-ink">评分维度</span>
              <span className="text-[11px] text-muted">六项合计 100 分</span>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-ink pt-4 sm:grid-cols-3 lg:grid-cols-6">
              {DIMENSIONS.map((item) => (
                <li key={item.label}>
                  <p className="flex items-baseline gap-1">
                    <span className="font-mono text-[22px] font-medium leading-none text-ink">
                      {item.weight}
                    </span>
                    <span className="text-[11px] text-muted">分</span>
                  </p>
                  <p className="mt-2.5 text-[12px] font-medium leading-4 text-ink">
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 truncate text-[11px] leading-4 text-muted",
                      item.mono && "font-mono",
                    )}
                  >
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
