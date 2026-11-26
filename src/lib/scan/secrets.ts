import { LIMITS } from "../limits";
import { baseName } from "../file-path";
import type {
  FileEntry,
  SecretFinding,
  SecretsCheck,
  Severity,
} from "../types";
import { shouldIgnorePath } from "../select-files";
import {
  SECRET_PLACEHOLDER_RE,
  SECRET_RULES,
  shannonEntropy,
  type SecretRule,
} from "./patterns";
import { classifyFile, type FileKind } from "./classify";

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

const ENV_EXAMPLE_RE = /\.(?:example|sample|template|dist)$/i;

const BARE_PLACEHOLDER_RE =
  /^(?:password|passwd|secret|token|access[_-]?token|api[_-]?key|secret[_-]?key)$/i;

const KNOWN_TOKEN_PREFIX_RE =
  /^(?:sk-|AKIA|AKID|gh[pousr]_|github_pat_|glpat-|xox[baprs]-|AIza|[sr]k_live_|eyJ)/;

function isCommittedEnvFile(base: string): boolean {
  if (ENV_EXAMPLE_RE.test(base)) return false;
  return /^\.env(?:\.|$)/i.test(base);
}

function maskToken(value: string): string {
  const prefix = value.slice(0, Math.min(4, value.length));
  return `${prefix}••••（${value.length} 位）`;
}

function maskGeneric(match: RegExpMatchArray, rule: SecretRule, value: string): string {
  const keyName = rule.id === "generic-env-secret"
    ? (match[1] ?? "").trim()
    : (match[0].split(/[:=]/)[0] ?? "").trim().slice(0, 40);
  return `${keyName || rule.label} = ••••（${value.length} 位）`;
}

function gitignoreCoversEnv(text: string): boolean {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .some((line) => {
      const cleaned = line.replace(/^!/, "");
      return (
        /(?:^|\/)\.env(?:\*|$|\.)/.test(cleaned) ||
        /^\*\.env$/.test(cleaned) ||
        /(?:^|\/)\.env\*$/.test(cleaned)
      );
    });
}

function severityFor(rule: SecretRule, kind: FileKind): Severity {
  if (rule.kind === "private-key") {
    if (kind === "test") return "low";
    if (kind === "doc") return "medium";
    return "high";
  }
  if (rule.kind === "generic") return kind === "business" ? "medium" : "low";
  if (
    rule.kind === "bearer" ||
    rule.id === "jwt-token" ||
    rule.id === "google-api-key"
  ) {
    return kind === "business" ? rule.severity : "low";
  }
  return rule.severity;
}

export function scanSecrets(
  files: FileEntry[],
  contents: Map<string, string>,
  readmePath: string | null,
): SecretsCheck {
  const envFilesCommitted = files
    .filter((file) => !shouldIgnorePath(file.path) && isCommittedEnvFile(baseName(file.path)))
    .map((file) => file.path)
    .sort();

  const findingsAll: SecretFinding[] = envFilesCommitted.map((path, index) => ({
    id: `secret-env-${index + 1}`,
    rule: ".env 文件已入库",
    category: "敏感文件",
    path,
    line: 0,
    masked: "环境变量文件已提交到仓库",
    severity: "high",
  }));

  const seen = new Set<string>();

  for (const [path, text] of contents) {
    if (!text) continue;
    const kind = classifyFile(path, readmePath);
    const lines = text.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.length === 0) continue;

      for (const rule of SECRET_RULES) {
        for (const match of line.matchAll(rule.regex)) {
          const value = (rule.valueGroup ? match[rule.valueGroup] : match[0]) ?? "";
          if (!value || value.length < 8) continue;
          if (SECRET_PLACEHOLDER_RE.test(value)) continue;
          if (/^https?:\/\//i.test(value)) continue;

          if (rule.kind === "generic") {
            if (BARE_PLACEHOLDER_RE.test(value)) continue;
            if (KNOWN_TOKEN_PREFIX_RE.test(value)) continue;
            if (value.length < 10 || shannonEntropy(value) < 3.0) continue;
          }

          const key = `${rule.id}|${path}|${index + 1}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const severity = severityFor(rule, kind);
          let masked: string;
          if (rule.kind === "private-key") masked = "私钥内容（已隐藏）";
          else if (rule.kind === "bearer") masked = `Bearer ••••（${value.length} 位）`;
          else if (rule.kind === "generic") masked = maskGeneric(match, rule, value);
          else if (rule.id === "npm-token") masked = `_authToken=••••（${value.length} 位）`;
          else masked = maskToken(value);

          findingsAll.push({
            id: `secret-${findingsAll.length + 1}`,
            rule: rule.label,
            category: rule.category,
            path,
            line: index + 1,
            masked,
            severity,
          });
        }
      }
    }
  }

  const gitignore = files.find(
    (file) => /^\.gitignore$/i.test(baseName(file.path)) && file.path === ".gitignore",
  );
  const gitignoreFound = Boolean(gitignore);
  const gitignoreText = gitignore ? contents.get(gitignore.path) ?? null : null;
  const gitignoreCovers = gitignoreText ? gitignoreCoversEnv(gitignoreText) : false;

  const bySeverity: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const finding of findingsAll) bySeverity[finding.severity] += 1;

  let points = 15;
  if (bySeverity.high > 0) points = 0;
  else points = Math.max(0, 15 - bySeverity.medium * 3 - bySeverity.low);

  const sorted = [...findingsAll].sort((a, b) => {
    if (SEVERITY_ORDER[a.severity] !== SEVERITY_ORDER[b.severity]) {
      return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    }
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return a.line - b.line;
  });
  const findings = sorted.slice(0, LIMITS.maxFindings);

  const notes: string[] = [];
  if (findingsAll.length === 0) {
    notes.push(`在已读取的 ${contents.size} 个文件中，未发现明显的密钥或敏感信息。`);
  } else {
    notes.push(
      `在已读取的 ${contents.size} 个文件中发现 ${findingsAll.length} 条敏感信息线索（已脱敏展示）。`,
    );
  }
  if (envFilesCommitted.length > 0) {
    notes.push(`发现 ${envFilesCommitted.length} 个 .env 类文件被提交到仓库。`);
  }
  if (!gitignoreFound) {
    notes.push("仓库根目录没有 .gitignore，后续很容易误提交密钥。");
  } else if (!gitignoreCovers) {
    notes.push(".gitignore 没有明确忽略 .env 文件。");
  } else {
    notes.push(".gitignore 已忽略 .env 文件。");
  }

  return {
    total: findingsAll.length,
    findings,
    truncated: findingsAll.length > findings.length,
    bySeverity,
    envFilesCommitted,
    gitignoreFound,
    gitignoreCoversEnv: gitignoreCovers,
    points,
    notes,
  };
}
