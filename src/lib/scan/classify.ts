export type FileKind = "business" | "doc" | "test";

export function classifyFile(path: string, readmePath: string | null): FileKind {
  if (path === readmePath) return "doc";
  const lower = path.toLowerCase();

  if (/\.(?:md|mdx|markdown|rst|txt|adoc)$/i.test(lower)) return "doc";
  if (/^(?:docs?|documentation)\//.test(lower) || lower.includes("/docs/")) return "doc";
  if (lower.startsWith(".github/")) return "doc";

  if (
    /(?:^|\/)(?:test|tests|__tests__|spec|specs|fixtures?|examples?|samples?|demos?)\//.test(lower) ||
    /\.(?:test|spec|example|sample)\./.test(lower)
  ) {
    return "test";
  }

  return "business";
}
