import { LIMITS } from "./limits";
import { AnalyzeError } from "./errors";
import { baseName, encodePath } from "./file-path";
import type {
  FileEntry,
  RepoInfo,
  RepoRef,
} from "./types";

const API_BASE = "https://api.github.com";
const USER_AGENT = "git-shibie/1.0";

export type DataSource = "github" | "jsdelivr";

export interface RepoSnapshot {
  repo: RepoInfo;
  files: FileEntry[];
  source: DataSource;
  contentSource: DataSource;
  truncated: boolean;
  warnings: string[];
  readFile: (path: string) => Promise<string | null>;
}

interface GithubTreeResponse {
  tree?: { path?: string; type?: string; size?: number }[];
  truncated?: boolean;
}

interface JsdelivrTreeResponse {
  version?: string;
  files?: { name?: string; size?: number }[];
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new AnalyzeError({
      code: "NETWORK",
      message: "连接 GitHub 超时或网络不可用。",
      hint: "请检查网络后重试；如果身处网络受限环境，可以稍后再试。",
      status: 502,
    });
  }
}

function isRateLimited(response: Response): boolean {
  return (
    response.status === 429 ||
    (response.status === 403 &&
      (response.headers.get("x-ratelimit-remaining") === "0" ||
        /rate limit/i.test(response.headers.get("x-ratelimit-message") ?? "")))
  );
}

function mapGithubError(response: Response): AnalyzeError {
  if (response.status === 401) {
    return new AnalyzeError({
      code: "UPSTREAM",
      message: "GitHub 鉴权失败，请检查 GITHUB_TOKEN 是否有效。",
      status: 502,
    });
  }
  if (isRateLimited(response)) {
    return new AnalyzeError({
      code: "RATE_LIMIT",
      message: "GitHub 接口访问次数超限了。",
      hint: "稍等几分钟再试，或在 .env.local 中配置 GITHUB_TOKEN 提高限额。",
      status: 429,
    });
  }
  if (response.status === 404) {
    return new AnalyzeError({
      code: "NOT_FOUND",
      message: "没有找到这个仓库。",
      hint: "请确认链接拼写正确，并且仓库是公开的。",
      status: 404,
    });
  }
  return new AnalyzeError({
    code: "UPSTREAM",
    message: `GitHub 返回了异常状态（HTTP ${response.status}）。`,
    hint: "请稍后重试。",
    status: 502,
  });
}

async function fetchRepoInfo(ref: RepoRef): Promise<RepoInfo> {
  const response = await fetchWithTimeout(
    `${API_BASE}/repos/${ref.owner}/${ref.name}`,
    { headers: githubHeaders() },
    15_000,
  );

  if (!response.ok) throw mapGithubError(response);

  const data = (await response.json()) as {
    private?: boolean;
    description?: string | null;
    default_branch?: string;
    stargazers_count?: number;
    forks_count?: number;
    language?: string | null;
    license?: { spdx_id?: string | null; name?: string | null } | null;
    archived?: boolean;
    size?: number;
    pushed_at?: string | null;
  };

  if (data.private) {
    throw new AnalyzeError({
      code: "PRIVATE_REPO",
      message: "这是一个私有仓库，当前工具只支持公开仓库。",
      hint: "请换成一个公开仓库链接。",
      status: 422,
    });
  }

  return {
    owner: ref.owner,
    name: ref.name,
    fullName: `${ref.owner}/${ref.name}`,
    url: ref.canonicalUrl,
    description: data.description ?? null,
    defaultBranch: data.default_branch || "main",
    stars: typeof data.stargazers_count === "number" ? data.stargazers_count : null,
    forks: typeof data.forks_count === "number" ? data.forks_count : null,
    language: data.language ?? null,
    license: data.license?.spdx_id && data.license.spdx_id !== "NOASSERTION"
      ? data.license.spdx_id
      : data.license?.name ?? null,
    archived: Boolean(data.archived),
    sizeKb: typeof data.size === "number" ? data.size : null,
    pushedAt: data.pushed_at ?? null,
  };
}

async function fetchGithubTree(
  ref: RepoRef,
  branch: string,
): Promise<{ files: FileEntry[]; truncated: boolean }> {
  const response = await fetchWithTimeout(
    `${API_BASE}/repos/${ref.owner}/${ref.name}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers: githubHeaders() },
    20_000,
  );

  if (!response.ok) throw mapGithubError(response);

  const data = (await response.json()) as GithubTreeResponse;
  const files = (data.tree ?? [])
    .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
    .map((entry) => ({
      path: entry.path as string,
      size: typeof entry.size === "number" ? entry.size : null,
    }));

  return { files, truncated: Boolean(data.truncated) };
}

async function fetchJsdelivrTree(
  ref: RepoRef,
  branches: string[],
): Promise<{ files: FileEntry[]; branch: string } | null> {
  for (const branch of branches) {
    let response: Response;
    try {
      response = await fetchWithTimeout(
        `https://data.jsdelivr.com/v1/packages/gh/${ref.owner}/${ref.name}@${encodeURIComponent(branch)}?structure=flat`,
        { headers: { "User-Agent": USER_AGENT } },
        15_000,
      );
    } catch {
      continue;
    }

    if (!response.ok) continue;

    let data: JsdelivrTreeResponse;
    try {
      data = (await response.json()) as JsdelivrTreeResponse;
    } catch {
      continue;
    }

    if (!Array.isArray(data.files) || data.files.length === 0) continue;

    const files = data.files
      .filter((file) => typeof file.name === "string")
      .map((file) => ({
        path: (file.name as string).replace(/^\/+/, ""),
        size: typeof file.size === "number" ? file.size : null,
      }))
      .filter((file) => file.path.length > 0);

    if (files.length > 0) return { files, branch };
  }

  return null;
}

function rawFileUrl(ref: RepoRef, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${ref.owner}/${ref.name}/${encodeURIComponent(branch)}/${encodePath(path)}`;
}

function cdnFileUrl(ref: RepoRef, branch: string, path: string): string {
  return `https://cdn.jsdelivr.net/gh/${ref.owner}/${ref.name}@${encodeURIComponent(branch)}/${encodePath(path)}`;
}

async function canUseRaw(
  ref: RepoRef,
  branch: string,
  samplePath: string,
): Promise<boolean> {
  try {
    const response = await fetch(rawFileUrl(ref, branch, samplePath), {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchText(url: string, timeoutMs = 10_000): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;

    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > LIMITS.maxFileBytes) return null;

    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > LIMITS.maxFileBytes) return null;
    return text;
  } catch {
    return null;
  }
}

function uniqueBranches(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))];
}

export async function loadSnapshot(ref: RepoRef): Promise<RepoSnapshot> {
  const warnings: string[] = [];

  let repo: RepoInfo | null = null;
  let repoError: AnalyzeError | null = null;

  try {
    repo = await fetchRepoInfo(ref);
  } catch (error) {
    if (error instanceof AnalyzeError && error.code === "PRIVATE_REPO") throw error;
    if (error instanceof AnalyzeError) {
      repoError = error;
      warnings.push("GitHub 仓库信息获取失败，已尝试备用数据源。");
    } else {
      throw error;
    }
  }

  const branches = uniqueBranches([
    ref.branchHint,
    repo?.defaultBranch,
    "main",
    "master",
  ]);

  let files: FileEntry[] | null = null;
  let truncated = false;
  let source: DataSource = "github";
  let usedBranch = ref.branchHint || repo?.defaultBranch || branches[0] || "main";
  let treeError: AnalyzeError | null = null;

  try {
    const tree = await fetchGithubTree(ref, usedBranch);
    files = tree.files;
    truncated = tree.truncated;
  } catch (error) {
    treeError = error instanceof AnalyzeError ? error : null;

    for (const branch of branches) {
      if (branch === usedBranch) continue;
      try {
        const tree = await fetchGithubTree(ref, branch);
        files = tree.files;
        truncated = tree.truncated;
        usedBranch = branch;
        treeError = null;
        break;
      } catch (branchError) {
        if (branchError instanceof AnalyzeError) treeError = branchError;
      }
    }

    if (!files) {
      const fallback = await fetchJsdelivrTree(ref, branches);
      if (fallback) {
        files = fallback.files;
        usedBranch = fallback.branch;
        source = "jsdelivr";
        warnings.push("GitHub 文件列表不可用，已切换 jsDelivr 备用源。");
      }
    }
  }

  if (!files) {
    if (repoError && (repoError.code === "NOT_FOUND" || repoError.code === "RATE_LIMIT")) {
      throw repoError;
    }
    if (treeError) throw treeError;
    throw new AnalyzeError({
      code: "NETWORK",
      message: "无法读取仓库文件列表。",
      hint: "请检查网络，或确认仓库是公开的。",
      status: 502,
    });
  }

  if (!repo) {
    repo = {
      owner: ref.owner,
      name: ref.name,
      fullName: `${ref.owner}/${ref.name}`,
      url: ref.canonicalUrl,
      description: null,
      defaultBranch: usedBranch,
      stars: null,
      forks: null,
      language: null,
      license: null,
      archived: false,
      sizeKb: null,
      pushedAt: null,
    };
    warnings.push("备用源模式：Star、语言、许可证等仓库元数据不可用。");
  }

  if (files.length === 0) {
    throw new AnalyzeError({
      code: "EMPTY_REPO",
      message: "这个仓库看不到任何文件，可能是空仓库。",
      hint: "请换一个有代码的公开仓库。",
      status: 422,
    });
  }

  const samplePath =
    files.find((file) => /^readme(\.|$)/i.test(baseName(file.path)))?.path ??
    files[0].path;

  let contentSource: DataSource = source;
  if (source === "github" && !(await canUseRaw(ref, usedBranch, samplePath))) {
    contentSource = "jsdelivr";
    warnings.push("GitHub 原始文件地址不可用，已切换 CDN 读取文件内容。");
  }

  const readFile = async (path: string): Promise<string | null> => {
    if (contentSource === "github") {
      const direct = await fetchText(rawFileUrl(ref, usedBranch, path));
      if (direct !== null) return direct;
      return fetchText(cdnFileUrl(ref, usedBranch, path));
    }
    return fetchText(cdnFileUrl(ref, usedBranch, path));
  };

  return {
    repo,
    files,
    source,
    contentSource,
    truncated,
    warnings,
    readFile,
  };
}
