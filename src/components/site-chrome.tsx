export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-[3px] bg-accent" aria-hidden="true" />
          <p className="font-display text-[15px] font-semibold leading-none">
            Git 仓库接入体检
          </p>
        </div>

        <p className="text-[12px] leading-5 text-muted">只读扫描 GitHub 公开仓库</p>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-[12px] leading-5 text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>自动化规则结果可能存在误报，请结合仓库实际情况人工复核。</p>
        <p>仅支持公开仓库，不保存代码。</p>
      </div>
    </footer>
  );
}
