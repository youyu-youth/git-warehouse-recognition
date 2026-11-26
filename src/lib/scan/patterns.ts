import type { PathPattern, Severity } from "../types";

export interface PathRule {
  pattern: PathPattern;
  label: string;
  regex: RegExp;
  valueGroup?: number;
}

export const PATH_RULES: PathRule[] = [
  {
    pattern: "windows-drive",
    label: "Windows 盘符路径",
    regex: /(?<![A-Za-z0-9])[A-Za-z]:[\\/](?:[^\s"'`<>|*?\r\n]|[\\/])+/g,
  },
  {
    pattern: "home-dir",
    label: "用户目录绝对路径",
    regex: /(?<![A-Za-z0-9.:/])\/(?:Users|home|Volumes|Applications)\/[A-Za-z0-9._-]+(?:\/[^\s"'`<>)]*)?/g,
  },
  {
    pattern: "unix-abs",
    label: "Unix 绝对路径",
    regex: /(?<![A-Za-z0-9.:/])\/(?:opt|var\/www|mnt|srv)\/[^\s"'`<>)]+/g,
  },
  {
    pattern: "unc",
    label: "UNC 网络共享路径",
    regex: /(?:^|[\s"'`=(])((?:\\\\){1,2}[A-Za-z0-9._-]+\\[^\s"'`<>|]+)/g,
    valueGroup: 1,
  },
];

export const PATH_PLACEHOLDER_RE =
  /(?:example\.com|your[_-]?(?:name|user|path|project)|username|\buser\b|<[^>]+>|xxx+|C:[\\/](?:path|to|foo|bar|baz|temp|tmp)[\\/]|\/Users\/(?:you|user|username|name)\b|\/home\/(?:user|username|you|name)\b|%USERPROFILE%|\$\{|\$\(|process\.env|os\.homedir|import\.meta|\/path\/to\/)/i;

export interface SecretRule {
  id: string;
  label: string;
  category: string;
  severity: Severity;
  regex: RegExp;
  valueGroup?: number;
  kind?: "token" | "private-key" | "bearer" | "generic";
}

export const SECRET_RULES: SecretRule[] = [
  {
    id: "private-key",
    label: "私钥内容",
    category: "私钥",
    severity: "high",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
    kind: "private-key",
  },
  {
    id: "openai-key",
    label: "OpenAI 风格密钥",
    category: "API 密钥",
    severity: "high",
    regex: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}/g,
    kind: "token",
  },
  {
    id: "aws-access-key",
    label: "AWS Access Key",
    category: "云厂商密钥",
    severity: "high",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    kind: "token",
  },
  {
    id: "tencent-secret-id",
    label: "腾讯云 SecretId",
    category: "云厂商密钥",
    severity: "high",
    regex: /\bAKID[0-9A-Za-z]{13,}\b/g,
    kind: "token",
  },
  {
    id: "github-token",
    label: "GitHub Token",
    category: "访问令牌",
    severity: "high",
    regex: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
    kind: "token",
  },
  {
    id: "gitlab-token",
    label: "GitLab Token",
    category: "访问令牌",
    severity: "high",
    regex: /\bglpat-[A-Za-z0-9_-]{20,}\b/g,
    kind: "token",
  },
  {
    id: "slack-token",
    label: "Slack Token",
    category: "访问令牌",
    severity: "high",
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
    kind: "token",
  },
  {
    id: "stripe-key",
    label: "Stripe 线上密钥",
    category: "支付密钥",
    severity: "high",
    regex: /\b[sr]k_live_[A-Za-z0-9]{16,}\b/g,
    kind: "token",
  },
  {
    id: "npm-token",
    label: "npm 发布令牌",
    category: "访问令牌",
    severity: "high",
    regex: /(?:\/\/[^\s]*:_authToken=|_authToken\s*=\s*)([^\s]+)/g,
    valueGroup: 1,
    kind: "token",
  },
  {
    id: "google-api-key",
    label: "Google API Key",
    category: "API 密钥",
    severity: "medium",
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    kind: "token",
  },
  {
    id: "bearer-token",
    label: "Bearer 令牌",
    category: "访问令牌",
    severity: "medium",
    regex: /\bBearer\s+([A-Za-z0-9\-._~+/]{20,}=*)/g,
    valueGroup: 1,
    kind: "bearer",
  },
  {
    id: "jwt-token",
    label: "JWT 令牌",
    category: "访问令牌",
    severity: "medium",
    regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    kind: "token",
  },
  {
    id: "generic-quoted-secret",
    label: "疑似硬编码凭据",
    category: "硬编码凭据",
    severity: "medium",
    regex: /(?:api[_-]?key|apikey|secret|client[_-]?secret|password|passwd|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'`]([^"'`\s]{10,})["'`]/gi,
    valueGroup: 1,
    kind: "generic",
  },
  {
    id: "generic-env-secret",
    label: "疑似环境变量密钥",
    category: "硬编码凭据",
    severity: "medium",
    regex: /\b([A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|PASSWD|ACCESS_KEY)[A-Z0-9_]*)\s*=\s*([^\s#"'`]{12,})/g,
    valueGroup: 2,
    kind: "generic",
  },
];

export const SECRET_PLACEHOLDER_RE =
  /(?:your|example|placeholder|changeme|change_me|dummy|sample|xxxx|\.\.\.|redacted|<[^>]*>|\$\{|\$\(|process\.env|os\.environ|import\.meta|getenv|env\[|null|undefined|none|true|false)/i;

export function shannonEntropy(value: string): number {
  if (!value) return 0;
  const counts = new Map<string, number>();
  for (const char of value) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}
