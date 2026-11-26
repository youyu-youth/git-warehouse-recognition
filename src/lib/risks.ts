import { LIMITS } from "./limits";
import type {
  DependencyCheck,
  PathFinding,
  PathsCheck,
  ReadmeCheck,
  RiskItem,
  SecretsCheck,
  Severity,
  StartCheck,
  WindowsCheck,
} from "./types";

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
const CATEGORY_ORDER: Record<string, number> = {
  敏感信息: 0,
  启动: 1,
  依赖: 2,
  文档: 3,
  Windows: 4,
  路径: 5,
};

function sortRisks(risks: RiskItem[]): RiskItem[] {
  return risks.sort((a, b) => {
    if (SEVERITY_ORDER[a.severity] !== SEVERITY_ORDER[b.severity]) {
      return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    }
    const categoryDiff = (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99);
    if (categoryDiff !== 0) return categoryDiff;
    return a.title.localeCompare(b.title, "zh-CN");
  });
}

function readmeRisks(readme: ReadmeCheck): RiskItem[] {
  if (!readme.found) {
    return [
      {
        id: "readme-missing",
        severity: "high",
        category: "文档",
        title: "仓库缺少 README",
        description: "新同学拿到仓库后，无法从文档确认项目用途、安装方式和启动步骤。",
        suggestion:
          "补充根目录 README.md，至少包含项目简介、环境要求、安装步骤、启动命令和配置说明。",
      },
    ];
  }

  if (readme.chars === 0) return [];

  const risks: RiskItem[] = [];
  const missing: string[] = [];
  if (!readme.sections.install) missing.push("安装");
  if (!readme.sections.run) missing.push("启动");

  if (missing.length > 0) {
    risks.push({
      id: "readme-incomplete",
      severity: "medium",
      category: "文档",
      title: "README 的安装 / 启动说明不完整",
      description: `已找到 ${readme.path}，但缺少${missing.join("、")}相关内容，接入时需要额外摸索。`,
      suggestion: "在 README 中写清依赖安装、环境变量配置和可直接复制的启动命令。",
    });
  }

  if (!readme.sections.config && !readme.envMention) {
    risks.push({
      id: "readme-config-missing",
      severity: "low",
      category: "文档",
      title: "README 未说明配置项",
      description: "项目运行需要的环境变量或配置文件没有在文档中说明。",
      suggestion: "补充环境变量清单、示例文件和默认值说明。",
    });
  }

  return risks;
}

function dependencyRisks(deps: DependencyCheck): RiskItem[] {
  const risks: RiskItem[] = [];

  if (!deps.mainManifest) {
    risks.push({
      id: "deps-missing",
      severity: "high",
      category: "依赖",
      title: "未发现依赖清单",
      description: "无法确认项目依赖、版本和安装方式，接入时很容易缺少运行库。",
      suggestion:
        "添加 package.json、requirements.txt、go.mod 等依赖清单，并提交对应的锁文件。",
    });
    return risks;
  }

  if (deps.lockfileExpected && !deps.lockfileFound) {
    risks.push({
      id: "deps-lock-missing",
      severity: "medium",
      category: "依赖",
      title: "缺少依赖锁文件",
      description: `${deps.mainEcosystem} 项目通常需要锁文件固定依赖版本，当前仓库中没有找到。`,
      file: deps.mainManifest,
      suggestion:
        "提交 package-lock.json、pnpm-lock.yaml、poetry.lock 等锁文件，保证不同机器安装结果一致。",
    });
  }

  return risks;
}

function startRisks(start: StartCheck): RiskItem[] {
  if (start.libraryProject) return [];

  const risks: RiskItem[] = [];
  const hasAnyMethod =
    start.oneCommand ||
    start.readmeHasStartCommand ||
    start.alternatives.length > 0;

  if (!hasAnyMethod) {
    risks.push({
      id: "start-missing",
      severity: "high",
      category: "启动",
      title: "没有可用的启动方式",
      description: "仓库里没有启动脚本，README 中也没有识别到可执行的启动命令。",
      suggestion:
        "补充 npm run dev、make run 或 docker compose up 等启动入口，并把命令写进 README。",
    });
    return risks;
  }

  if (!start.oneCommand) {
    risks.push({
      id: "start-no-one-command",
      severity: "medium",
      category: "启动",
      title: "缺少一键启动脚本",
      description: start.readmeHasStartCommand
        ? "README 中能看到启动命令，但仓库没有固化成脚本，步骤容易遗漏。"
        : "目前只能依赖零散命令或容器配置启动，缺少统一的入口。",
      suggestion:
        "在 package.json scripts 或 Makefile 中提供统一的 dev / start 命令，减少手工步骤。",
    });
  } else if (!start.readmeHasStartCommand) {
    risks.push({
      id: "start-readme-missing",
      severity: "low",
      category: "启动",
      title: "README 未给出启动命令",
      description: `仓库里有启动入口（${start.command}），但 README 没有写出来。`,
      suggestion: "把实际可用的启动命令补充到 README 的“快速开始”部分。",
    });
  }

  return risks;
}

function windowsRisks(
  start: StartCheck,
  windows: WindowsCheck,
  readme: ReadmeCheck,
): RiskItem[] {
  const risks: RiskItem[] = [];
  const hasAnyMethod =
    start.oneCommand ||
    start.readmeHasStartCommand ||
    start.alternatives.length > 0;

  if (hasAnyMethod && !start.crossPlatform && windows.total === 0) {
    risks.push({
      id: "windows-no-entry",
      severity: "medium",
      category: "Windows",
      title: "缺少 Windows 可用的启动方式",
      description: windows.shellOnlyStart
        ? "启动入口只有 .sh 脚本，Windows 默认环境下无法直接运行。"
        : "现有启动方式依赖 Makefile、Shell 或未识别的入口，Windows 新机器可能无法直接跑起来。",
      suggestion:
        "补充 npm scripts、.bat / .cmd / .ps1 启动脚本，或在 README 中明确说明需要 WSL / Git Bash。",
    });
  }

  if (windows.total > 0 && !windows.documented && readme.found) {
    const first = windows.scripts[0];
    risks.push({
      id: "windows-undocumented",
      severity: "low",
      category: "Windows",
      title: "README 未说明 Windows 脚本用法",
      description: `发现 ${windows.total} 个 Windows 专用脚本，但 README 没有说明用途和执行顺序。`,
      ...(first ? { file: first.path } : {}),
      suggestion: "在 README 中列出这些脚本的用途、运行顺序和需要的权限。",
    });
  }

  const firstPs1 = windows.scripts.find((script) => script.type === "ps1");
  if (firstPs1 && !windows.executionPolicyNote && readme.found) {
    risks.push({
      id: "windows-execution-policy",
      severity: "low",
      category: "Windows",
      title: "PowerShell 脚本缺少执行策略提示",
      description: "Windows 默认执行策略可能阻止 .ps1 脚本运行，新机器上容易卡住。",
      file: firstPs1.path,
      suggestion:
        "在 README 提示先执行 Set-ExecutionPolicy -Scope Process Bypass，或提供 .cmd 包装脚本。",
    });
  }

  return risks;
}

function pathRisks(paths: PathsCheck): RiskItem[] {
  const byFile = new Map<string, PathFinding[]>();
  for (const finding of paths.findings) {
    const existing = byFile.get(finding.path);
    if (existing) existing.push(finding);
    else byFile.set(finding.path, [finding]);
  }

  const groups = [...byFile.entries()]
    .map(([path, findings]) => ({
      path,
      findings,
      severity: findings.some((finding) => finding.severity === "medium")
        ? ("medium" as const)
        : ("low" as const),
    }))
    .sort((a, b) => {
      if (SEVERITY_ORDER[a.severity] !== SEVERITY_ORDER[b.severity]) {
        return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      }
      return b.findings.length - a.findings.length;
    })
    .slice(0, 10);

  return groups.map((group, index) => {
    const first = group.findings[0];
    return {
      id: `paths-file-${index + 1}`,
      severity: group.severity,
      category: "路径",
      title: `发现硬编码绝对路径（${group.findings.length} 处）`,
      description:
        group.severity === "medium"
          ? "代码或配置写死了本机目录，换一台机器很可能找不到文件或目录。"
          : "文档或示例中出现了本机绝对路径，照抄到其他机器时可能失效。",
      file: group.path,
      line: first.line,
      evidence: first.snippet,
      suggestion:
        "改用相对路径、项目根目录变量（如 __dirname / process.cwd()）或从环境变量读取。",
    };
  });
}

function secretRisks(secrets: SecretsCheck, readme: ReadmeCheck): RiskItem[] {
  const risks: RiskItem[] = [];

  secrets.envFilesCommitted.slice(0, 5).forEach((path, index) => {
    risks.push({
      id: `env-committed-${index + 1}`,
      severity: "high",
      category: "敏感信息",
      title: ".env 文件已提交到仓库",
      description: "环境变量文件通常包含真实密钥，即使之后删除，内容也会留在 Git 历史中。",
      file: path,
      suggestion:
        "立即轮换出现过的密钥，把 .env 加到 .gitignore，并提供 .env.example 作为模板。",
    });
  });

  const findings = secrets.findings.filter(
    (finding) => finding.rule !== ".env 文件已入库",
  );

  const lowGroups = new Map<string, typeof findings>();
  const individual: typeof findings = [];

  for (const finding of findings) {
    if (finding.severity === "low") {
      const group = lowGroups.get(finding.rule) ?? [];
      group.push(finding);
      lowGroups.set(finding.rule, group);
    } else {
      individual.push(finding);
    }
  }

  let groupIndex = 0;
  for (const [rule, group] of lowGroups) {
    if (group.length === 1) {
      individual.push(group[0]);
      continue;
    }
    groupIndex += 1;
    const first = group[0];
    const groupTitle = rule.startsWith("疑似")
      ? `${rule}（${group.length} 处）`
      : `${rule}疑似泄露（${group.length} 处）`;
    risks.push({
      id: `secret-group-${groupIndex}`,
      severity: "low",
      category: "敏感信息",
      title: groupTitle,
      description:
        "在多个文件命中疑似凭据，通常来自测试或示例目录，需要人工确认是否包含真实密钥。",
      file: first.path,
      line: first.line,
      evidence: group
        .slice(0, 5)
        .map((finding) => `${finding.path}:${finding.line}`)
        .join("\n"),
      suggestion:
        "逐项确认是否为测试证书或占位示例；如果是真实密钥，立即吊销并轮换。",
    });
  }

  individual.slice(0, 25).forEach((finding) => {
    const isHigh = finding.severity === "high";
    const findingTitle = finding.rule.startsWith("疑似")
      ? finding.rule
      : `${finding.rule}疑似泄露`;
    risks.push({
      id: `secret-${finding.id}`,
      severity: finding.severity,
      category: "敏感信息",
      title: findingTitle,
      description: isHigh
        ? "命中真实格式的密钥，一旦仓库公开，其他人可以直接使用。"
        : "命中疑似凭据，需要人工确认是真实值还是占位示例。",
      file: finding.path,
      line: finding.line,
      evidence: finding.masked,
      suggestion: isHigh
        ? "确认后立即在对应平台吊销并重新生成密钥，并从代码与 Git 历史中移除。"
        : "确认是否为占位符；如果是真实凭据，改为从环境变量或密钥管理服务读取。",
    });
  });

  if (!secrets.gitignoreFound) {
    risks.push({
      id: "gitignore-missing",
      severity: "medium",
      category: "敏感信息",
      title: "缺少 .gitignore",
      description: "没有 .gitignore 时，本地 .env、密钥文件和构建产物很容易被顺手提交。",
      suggestion: "添加 .gitignore，至少忽略 .env、密钥文件、依赖目录和构建产物。",
    });
  } else if (!secrets.gitignoreCoversEnv) {
    const envRelated = readme.envMention || secrets.envFilesCommitted.length > 0;
    risks.push({
      id: "gitignore-env",
      severity: envRelated ? "medium" : "low",
      category: "敏感信息",
      title: ".gitignore 未忽略 .env",
      description: envRelated
        ? "环境变量文件可能包含真实密钥，当前规则没有明确忽略它。"
        : "仓库目前没有发现 .env 或环境变量说明；如果后续接入时会用到环境变量，建议先补上忽略规则。",
      file: ".gitignore",
      suggestion: "在 .gitignore 中加入 .env 和 .env.*（保留 .env.example）。",
    });
  }

  return risks;
}

export function buildRisks(checks: {
  readme: ReadmeCheck;
  deps: DependencyCheck;
  start: StartCheck;
  windows: WindowsCheck;
  paths: PathsCheck;
  secrets: SecretsCheck;
}): { risks: RiskItem[]; truncated: boolean } {
  const all = [
    ...secretRisks(checks.secrets, checks.readme),
    ...startRisks(checks.start),
    ...dependencyRisks(checks.deps),
    ...readmeRisks(checks.readme),
    ...windowsRisks(checks.start, checks.windows, checks.readme),
    ...pathRisks(checks.paths),
  ];

  const sorted = sortRisks(all);
  const truncated = sorted.length > LIMITS.maxRisks;

  return {
    risks: sorted.slice(0, LIMITS.maxRisks),
    truncated,
  };
}
