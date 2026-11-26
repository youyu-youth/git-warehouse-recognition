export type Severity = "high" | "medium" | "low";

export type DimensionKey =
  | "docs"
  | "deps"
  | "start"
  | "windows"
  | "paths"
  | "secrets";

export type PathPattern = "windows-drive" | "home-dir" | "unix-abs" | "unc";

export interface RepoRef {
  owner: string;
  name: string;
  canonicalUrl: string;
  branchHint?: string;
}

export interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  defaultBranch: string;
  stars: number | null;
  forks: number | null;
  language: string | null;
  license: string | null;
  archived: boolean;
  sizeKb: number | null;
  pushedAt: string | null;
}

export interface FileEntry {
  path: string;
  size: number | null;
}

export interface ReadmeCheck {
  found: boolean;
  path: string | null;
  chars: number;
  sections: {
    install: boolean;
    run: boolean;
    config: boolean;
    dependencies: boolean;
  };
  codeBlocks: number;
  envMention: boolean;
  points: number;
  notes: string[];
}

export interface DependencyCheck {
  manifests: { path: string; ecosystem: string }[];
  lockfiles: { path: string; ecosystem: string }[];
  mainManifest: string | null;
  mainEcosystem: string | null;
  lockfileExpected: boolean;
  lockfileFound: boolean;
  packageScripts: Record<string, string> | null;
  points: number;
  notes: string[];
}

export interface StartCheck {
  oneCommand: boolean;
  command: string | null;
  readmeCommands: string[];
  readmeHasStartCommand: boolean;
  alternatives: string[];
  crossPlatform: boolean;
  libraryProject: boolean;
  points: number;
  notes: string[];
}

export type WindowsScriptType = "bat" | "cmd" | "ps1" | "vbs";

export interface WindowsCheck {
  scripts: { path: string; type: WindowsScriptType }[];
  total: number;
  documented: boolean;
  executionPolicyNote: boolean;
  shellOnlyStart: boolean;
  points: number;
  notes: string[];
}

export interface PathFinding {
  id: string;
  pattern: PathPattern;
  path: string;
  line: number;
  snippet: string;
  severity: Severity;
}

export interface PathsCheck {
  total: number;
  filesAffected: number;
  findings: PathFinding[];
  truncated: boolean;
  byPattern: Record<PathPattern, number>;
  bySeverity: Record<Severity, number>;
  points: number;
  notes: string[];
}

export interface SecretFinding {
  id: string;
  rule: string;
  category: string;
  path: string;
  line: number;
  masked: string;
  severity: Severity;
}

export interface SecretsCheck {
  total: number;
  findings: SecretFinding[];
  truncated: boolean;
  bySeverity: Record<Severity, number>;
  envFilesCommitted: string[];
  gitignoreFound: boolean;
  gitignoreCoversEnv: boolean;
  points: number;
  notes: string[];
}

export interface DimensionScore {
  key: DimensionKey;
  label: string;
  earned: number;
  max: number;
  detail: string;
}

export interface ScoreResult {
  total: number;
  grade: "A" | "B" | "C" | "D";
  verdict: string;
  dimensions: DimensionScore[];
}

export interface RiskItem {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  evidence?: string;
  suggestion: string;
}

export type AdvicePriority = "high" | "medium" | "low";

export interface AdviceItem {
  title: string;
  detail: string;
  priority: AdvicePriority;
}

export interface Advice {
  source: "ai" | "rules";
  model?: string;
  summary: string;
  suggestions: AdviceItem[];
  aiScore?: number;
  note?: string;
}

export interface AnalysisMeta {
  scannedFiles: number;
  selectedFiles: number;
  totalFiles: number;
  truncated: boolean;
  source: "github" | "jsdelivr";
  contentSource: "github" | "jsdelivr";
  warnings: string[];
  durationMs: number;
  limits: {
    maxFiles: number;
    maxFileSizeKb: number;
    maxTotalSizeMb: number;
  };
}

export interface AnalysisResult {
  repo: RepoInfo;
  score: ScoreResult;
  checks: {
    readme: ReadmeCheck;
    deps: DependencyCheck;
    start: StartCheck;
    windows: WindowsCheck;
    paths: PathsCheck;
    secrets: SecretsCheck;
  };
  risks: RiskItem[];
  advice: Advice;
  meta: AnalysisMeta;
}

export type AnalyzeErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_HOST"
  | "NOT_FOUND"
  | "PRIVATE_REPO"
  | "EMPTY_REPO"
  | "RATE_LIMIT"
  | "NETWORK"
  | "UPSTREAM"
  | "UNKNOWN";

export interface ApiErrorBody {
  error: {
    code: AnalyzeErrorCode;
    message: string;
    hint?: string;
  };
}
