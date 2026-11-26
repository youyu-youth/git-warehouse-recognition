import { Activity } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-ink/70">
            <Activity className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none tracking-tight">Git 仓库接入体检</p>
            <p className="mt-1.5 font-mono text-[9px] uppercase leading-none tracking-[0.2em] text-muted">
              Repo onboarding check
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          GitHub · 公开仓库
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>自动化规则结果可能存在误报，请结合仓库实际情况人工复核。</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
          Public repos only · No code stored
        </p>
      </div>
    </footer>
  );
}
