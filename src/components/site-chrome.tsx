import { Activity } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-ink text-paper">
            <Activity className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-none tracking-tight">
              Git 仓库接入体检
            </p>
            <p className="mt-1.5 font-mono text-[9px] uppercase leading-none tracking-[0.2em] text-muted">
              Repo readiness check
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <span className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
            GitHub 公开仓库
          </span>
          <span className="hidden h-3 w-px bg-line-strong sm:block" aria-hidden="true" />
          <span className="hidden sm:inline">只读扫描</span>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>自动化规则结果可能存在误报，请结合仓库实际情况人工复核。</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
          Public repos only · No code stored
        </p>
      </div>
    </footer>
  );
}
