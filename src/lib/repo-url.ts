import { AnalyzeError } from "./errors";
import type { RepoRef } from "./types";

const OWNER_REPO_RE = /^[A-Za-z0-9_.-]+$/;

export function parseRepoUrl(input: string): RepoRef {
  const trimmed = (input ?? "").trim();
  if (!trimmed) {
    throw new AnalyzeError({
      code: "INVALID_URL",
      message: "请输入一个公开 GitHub 仓库链接。",
      hint: "例如 https://github.com/psf/requests",
    });
  }

  if (trimmed.length > 500) {
    throw new AnalyzeError({
      code: "INVALID_URL",
      message: "链接太长了，请检查后重试。",
    });
  }

  let candidate = trimmed;
  if (/^git@github\.com:/i.test(candidate)) {
    candidate = candidate.replace(/^git@github\.com:/i, "https://github.com/");
  } else if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, "")}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new AnalyzeError({
      code: "INVALID_URL",
      message: "这个链接格式不太对，无法解析。",
      hint: "支持 https://github.com/owner/repo 或 git@github.com:owner/repo.git",
    });
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new AnalyzeError({
      code: "INVALID_URL",
      message: "只支持 http / https 形式的仓库链接。",
    });
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "github.com") {
    throw new AnalyzeError({
      code: "UNSUPPORTED_HOST",
      message: `暂不支持 ${host}，目前只支持 GitHub 公开仓库。`,
      hint: "请换成 github.com 的仓库链接。",
    });
  }

  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  if (segments.length < 2) {
    throw new AnalyzeError({
      code: "INVALID_URL",
      message: "链接里缺少仓库名。",
      hint: "正确格式：https://github.com/owner/repo",
    });
  }

  const owner = segments[0];
  const name = segments[1].replace(/\.git$/i, "");

  if (!OWNER_REPO_RE.test(owner) || !OWNER_REPO_RE.test(name) || owner === "." || name === ".") {
    throw new AnalyzeError({
      code: "INVALID_URL",
      message: "仓库地址包含无法识别的字符。",
    });
  }

  const markerIndex = segments.findIndex(
    (segment, index) => index >= 2 && (segment === "tree" || segment === "blob"),
  );
  const branchHint =
    markerIndex >= 0 && segments[markerIndex + 1]
      ? segments.slice(markerIndex + 1).join("/")
      : undefined;

  return {
    owner,
    name,
    canonicalUrl: `https://github.com/${owner}/${name}`,
    branchHint,
  };
}
