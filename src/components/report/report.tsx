import type { AnalysisResult } from "@/lib/types";
import { ReportHeader } from "./report-header";
import { ScorePanel } from "./score-panel";
import { DependencyCard, ReadmeCard, StartCard } from "./check-cards";
import { WindowsCard } from "./windows-card";
import { PathsCard } from "./paths-card";
import { SecretsCard } from "./secrets-card";
import { RiskList } from "./risk-list";
import { AiAdvice } from "./ai-advice";

export function Report({ result }: { result: AnalysisResult }) {
  const aiScore = result.advice.source === "ai" ? result.advice.aiScore : undefined;

  return (
    <div
      id="report"
      className="animate-report-in mt-6 scroll-mt-4 space-y-6 sm:space-y-7"
    >
      <ReportHeader result={result} />

      <ScorePanel score={result.score} aiScore={aiScore} />

      <div className="grid gap-x-6 gap-y-6 md:grid-cols-3 sm:gap-x-8">
        <ReadmeCard readme={result.checks.readme} />
        <DependencyCard deps={result.checks.deps} />
        <StartCard start={result.checks.start} />
      </div>

      <div className="grid gap-x-6 gap-y-6 lg:grid-cols-2 sm:gap-x-10">
        <WindowsCard windows={result.checks.windows} start={result.checks.start} />
        <PathsCard paths={result.checks.paths} />
      </div>

      <SecretsCard secrets={result.checks.secrets} />
      <RiskList risks={result.risks} />
      <AiAdvice advice={result.advice} />

      <div className="flex flex-col gap-1.5 border-t border-line pt-4 text-[11px] leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          扫描 {result.meta.scannedFiles} / {result.meta.totalFiles} 个文件，单文件上限{" "}
          {result.meta.limits.maxFileSizeKb} KB，总计 {result.meta.limits.maxTotalSizeMb} MB
        </p>
        <p>报告结束，仅供接入评估参考。</p>
      </div>
    </div>
  );
}
