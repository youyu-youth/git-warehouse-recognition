import type {
  Advice,
  AdviceItem,
  AdvicePriority,
  AnalysisResult,
  RepoInfo,
  RiskItem,
  ScoreResult,
} from "./types";

interface AiContext {
  repo: RepoInfo;
  score: ScoreResult;
  checks: AnalysisResult["checks"];
  risks: RiskItem[];
  scannedFiles: number;
}

function aiEndpoint(): string {
  const base = (process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}

function compactContext(context: AiContext) {
  const { repo, score, checks, risks, scannedFiles } = context;

  return {
    repo: {
      fullName: repo.fullName,
      description: repo.description,
      language: repo.language,
      stars: repo.stars,
      defaultBranch: repo.defaultBranch,
      archived: repo.archived,
    },
    score: {
      total: score.total,
      grade: score.grade,
      verdict: score.verdict,
      dimensions: score.dimensions.map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        earned: dimension.earned,
        max: dimension.max,
        detail: dimension.detail,
      })),
    },
    checks: {
      readme: {
        found: checks.readme.found,
        chars: checks.readme.chars,
        sections: checks.readme.sections,
        codeBlocks: checks.readme.codeBlocks,
      },
      deps: {
        manifests: checks.deps.manifests.map((manifest) => manifest.path).slice(0, 5),
        mainEcosystem: checks.deps.mainEcosystem,
        mainManifest: checks.deps.mainManifest,
        lockfileExpected: checks.deps.lockfileExpected,
        lockfileFound: checks.deps.lockfileFound,
        scripts: Object.keys(checks.deps.packageScripts ?? {}),
      },
      start: {
        oneCommand: checks.start.oneCommand,
        command: checks.start.command,
        readmeHasStartCommand: checks.start.readmeHasStartCommand,
        alternatives: checks.start.alternatives,
        crossPlatform: checks.start.crossPlatform,
      },
      windows: {
        total: checks.windows.total,
        documented: checks.windows.documented,
        executionPolicyNote: checks.windows.executionPolicyNote,
        shellOnlyStart: checks.windows.shellOnlyStart,
      },
      paths: {
        total: checks.paths.total,
        filesAffected: checks.paths.filesAffected,
        bySeverity: checks.paths.bySeverity,
        byPattern: checks.paths.byPattern,
      },
      secrets: {
        total: checks.secrets.total,
        bySeverity: checks.secrets.bySeverity,
        envFilesCommitted: checks.secrets.envFilesCommitted,
        gitignoreFound: checks.secrets.gitignoreFound,
        gitignoreCoversEnv: checks.secrets.gitignoreCoversEnv,
      },
    },
    risks: risks.slice(0, 15).map((risk) => ({
      severity: risk.severity,
      category: risk.category,
      title: risk.title,
      file: risk.file,
      description: risk.description,
      suggestion: risk.suggestion,
    })),
    scannedFiles,
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizePriority(value: unknown): AdvicePriority {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function parseAdvice(content: string, model: string): Advice | null {
  const parsed = extractJson(content);
  if (!parsed || typeof parsed !== "object") return null;

  const data = parsed as {
    summary?: unknown;
    suggestions?: unknown;
    aiScore?: unknown;
  };

  if (typeof data.summary !== "string" || data.summary.trim().length === 0) return null;
  if (!Array.isArray(data.suggestions)) return null;

  const suggestions: AdviceItem[] = [];
  for (const item of data.suggestions.slice(0, 5)) {
    if (!item || typeof item !== "object") continue;
    const suggestion = item as { title?: unknown; detail?: unknown; priority?: unknown };
    if (typeof suggestion.title !== "string" || suggestion.title.trim().length === 0) continue;
    if (typeof suggestion.detail !== "string" || suggestion.detail.trim().length === 0) continue;
    suggestions.push({
      title: suggestion.title.trim(),
      detail: suggestion.detail.trim(),
      priority: normalizePriority(suggestion.priority),
    });
  }

  if (suggestions.length === 0) return null;

  const aiScore =
    typeof data.aiScore === "number" && Number.isFinite(data.aiScore)
      ? Math.max(0, Math.min(100, Math.round(data.aiScore)))
      : undefined;

  return {
    source: "ai",
    model,
    summary: data.summary.trim(),
    suggestions,
    ...(aiScore !== undefined ? { aiScore } : {}),
    note: "AI 建议仅供参考，接入评分以规则结果为准。",
  };
}

export async function buildAiAdvice(context: AiContext): Promise<Advice | null> {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  const payload = compactContext(context);

  const systemPrompt =
    "你是一家公司的基础设施接入审查工程师。你会收到公开 GitHub 仓库的自动化体检结果，请用中文给出接入建议。只输出 JSON，不要输出 Markdown 或额外解释。";
  const userPrompt = [
    "体检结果 JSON：",
    JSON.stringify(payload),
    "",
    "请输出以下 JSON 结构：",
    '{"summary":"2-3 句总体判断，说明是否建议接入及首要原因","suggestions":[{"title":"建议标题","detail":"具体可执行的说明","priority":"high|medium|low"}],"aiScore":0}',
    "要求：",
    "1. suggestions 给 3-5 条，按优先级排序，聚焦接入步骤，不要复述所有发现。",
    "2. aiScore 是基于数据的参考分，和规则分偏差不要超过 15 分。",
    "3. 不要虚构扫描结果之外的信息，不要假设仓库中有未检测到的文件或配置。",
  ].join("\n");

  try {
    const response = await fetch(aiEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      console.warn(`[ai] request failed with HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) return null;

    return parseAdvice(content, model);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(`[ai] request error: ${message}`);
    return null;
  }
}
