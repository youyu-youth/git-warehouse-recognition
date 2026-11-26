export function baseName(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(index + 1) : normalized;
}

export function extName(path: string): string {
  const base = baseName(path);
  const index = base.lastIndexOf(".");
  return index > 0 ? base.slice(index).toLowerCase() : "";
}

export function depthOf(path: string): number {
  return path.split("/").filter(Boolean).length - 1;
}

export function isRootFile(path: string): boolean {
  return depthOf(path) === 0;
}

export function encodePath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
