import { LIMITS } from "../limits";
import type {
  PathFinding,
  PathPattern,
  PathsCheck,
  Severity,
} from "../types";
import { PATH_PLACEHOLDER_RE, PATH_RULES } from "./patterns";
import { classifyFile } from "./classify";

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

function displayPath(value: string, pattern: PathPattern): string {
  if (pattern === "unc") {
    const leadMatch = value.match(/^\\+/);
    const rest = value.slice(leadMatch ? leadMatch[0].length : 0).replace(/\\{2,}/g, "\\");
    return `${"\\".repeat(2)}${rest}`.trim();
  }
  return value.replace(/\\{2,}/g, "\\").trim();
}

function isInsideUrl(line: string, index: number): boolean {
  const before = line.slice(0, index);
  let boundary = -1;
  for (const char of [" ", "\t", '"', "'", "`", "(", "[", "{", ",", ";"]) {
    boundary = Math.max(boundary, before.lastIndexOf(char));
  }
  const token = before.slice(boundary + 1);
  return /(?:[a-z][a-z0-9+.-]*:\/\/|\/\/)/i.test(token);
}

export function scanPaths(
  contents: Map<string, string>,
  readmePath: string | null,
): PathsCheck {
  const findingsAll: PathFinding[] = [];
  const seen = new Set<string>();

  const byPattern: Record<PathPattern, number> = {
    "windows-drive": 0,
    "home-dir": 0,
    "unix-abs": 0,
    unc: 0,
  };
  const bySeverity: Record<Severity, number> = { high: 0, medium: 0, low: 0 };

  for (const [path, text] of contents) {
    if (!text) continue;
    const kind = classifyFile(path, readmePath);
    const severity: Severity = kind === "business" ? "medium" : "low";
    const lines = text.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.length === 0) continue;

      for (const rule of PATH_RULES) {
        for (const match of line.matchAll(rule.regex)) {
          const raw = rule.valueGroup ? match[rule.valueGroup] : match[0];
          if (!raw) continue;

          const offset = rule.valueGroup ? match[0].lastIndexOf(raw) : 0;
          if (isInsideUrl(line, (match.index ?? 0) + offset)) continue;

          const value = raw.replace(/[),;]+$/g, "").trim();
          if (value.length < 3) continue;

          const display = displayPath(value, rule.pattern);
          if (!display || PATH_PLACEHOLDER_RE.test(display)) continue;

          const dedupeValue =
            rule.pattern === "windows-drive" || rule.pattern === "unc"
              ? display.toLowerCase()
              : display;
          const key = `${path}|${rule.pattern}|${dedupeValue}`;
          if (seen.has(key)) continue;
          seen.add(key);

          findingsAll.push({
            id: `path-${findingsAll.length + 1}`,
            pattern: rule.pattern,
            path,
            line: index + 1,
            snippet: line.trim().slice(0, 200),
            severity,
          });
          byPattern[rule.pattern] += 1;
          bySeverity[severity] += 1;
        }
      }
    }
  }

  const filesAffected = new Set(findingsAll.map((finding) => finding.path)).size;
  const businessFiles = new Set(
    findingsAll.filter((finding) => finding.severity === "medium").map((finding) => finding.path),
  );
  const lowFiles = new Set(
    findingsAll.filter((finding) => finding.severity === "low").map((finding) => finding.path),
  );
  for (const path of businessFiles) lowFiles.delete(path);

  const points = Math.max(0, 10 - Math.min(businessFiles.size, 5) * 2 - Math.floor(lowFiles.size / 2));

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
    notes.push(`在已读取的 ${contents.size} 个文件中，未发现明显的硬编码绝对路径。`);
  } else {
    notes.push(
      `在 ${contents.size} 个已读取文件中发现 ${findingsAll.length} 处疑似硬编码路径，涉及 ${filesAffected} 个文件。`,
    );
    notes.push("配置文件、脚本和源码中的命中按中风险处理；文档与示例中的命中按低风险处理。");
  }

  return {
    total: findingsAll.length,
    filesAffected,
    findings,
    truncated: findingsAll.length > findings.length,
    byPattern,
    bySeverity,
    points,
    notes,
  };
}
