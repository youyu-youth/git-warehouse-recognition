import { LIMITS } from "./limits";
import { baseName, depthOf, extName } from "./file-path";
import type { FileEntry } from "./types";

const IGNORED_SEGMENTS = new Set([
  ".git",
  "node_modules",
  "bower_components",
  "vendor",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  ".output",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "env",
  "target",
  "obj",
  "bin",
  "Pods",
  "third_party",
  ".gradle",
  ".idea",
  ".cache",
  ".turbo",
  ".parcel-cache",
]);

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp", ".tiff", ".ico", ".icns",
  ".svg", ".pdf", ".zip", ".gz", ".tgz", ".bz2", ".xz", ".7z", ".rar", ".tar",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".o", ".a", ".obj", ".lib", ".class", ".jar",
  ".war", ".pyc", ".pyo", ".wasm", ".node", ".db", ".sqlite", ".sqlite3",
  ".mp3", ".mp4", ".avi", ".mov", ".webm", ".mkv", ".wav", ".flac", ".ogg",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".psd", ".ai", ".sketch", ".fig", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".map", ".ds_store", ".lockb",
]);

const LOCKFILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lock", "bun.lockb",
  "npm-shrinkwrap.json", "poetry.lock", "pipfile.lock", "uv.lock", "pdm.lock",
  "go.sum", "cargo.lock", "composer.lock", "gemfile.lock", "pubspec.lock",
  "packages.lock.json", "gradle.lockfile",
]);

const MANIFESTS = new Set([
  "package.json", "requirements.txt", "pyproject.toml", "pipfile",
  "go.mod", "cargo.toml", "pom.xml", "build.gradle", "build.gradle.kts",
  "composer.json", "gemfile", "pubspec.yaml", "setup.py", "setup.cfg",
  "environment.yml", "environment.yaml", "deno.json", "deno.jsonc",
]);

const CONFIG_NAMES = new Set([
  "dockerfile", "makefile", "gnumakefile", "justfile", "procfile", "jenkinsfile",
  "vagrantfile", "caddyfile", "brewfile", ".dockerignore", ".editorconfig",
  ".gitattributes", "cmakelists.txt", "taskfile.yml", "taskfile.yaml",
]);

const CONFIG_EXTENSIONS = new Set([
  ".yml", ".yaml", ".toml", ".ini", ".cfg", ".conf", ".properties",
  ".json", ".jsonc", ".xml", ".gradle", ".plist", ".service", ".desktop",
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs",
  ".java", ".kt", ".kts", ".cs", ".php", ".rb", ".c", ".h", ".cc", ".cpp",
  ".hpp", ".swift", ".dart", ".lua", ".pl", ".scala", ".vue", ".svelte",
  ".astro", ".html", ".htm", ".css", ".scss", ".sass", ".less",
  ".sh", ".bash", ".zsh", ".fish", ".ps1", ".bat", ".cmd", ".vbs",
]);

const DOC_EXTENSIONS = new Set([".md", ".mdx", ".markdown", ".rst", ".txt", ".adoc"]);

const SECRET_NAME_RE = /^(?:\.npmrc|\.netrc|\.pypirc|credentials(?:\.json)?|secrets?\.(?:json|ya?ml|toml)|id_(?:rsa|dsa|ecdsa|ed25519))$/i;
const SECRET_EXT_RE = /\.(?:pem|key|p12|pfx|jks|keystore)$/i;
const ENV_NAME_RE = /^\.env(?:\.|$)|\.env$/i;

export function shouldIgnorePath(path: string): boolean {
  const segments = path.split("/");
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return true;
  const base = baseName(path).toLowerCase();
  if (BINARY_EXTENSIONS.has(extName(path))) return true;
  if (/\.min\.(?:js|css)$/i.test(base)) return true;
  if (/\.(?:bundle|generated)\.(?:js|css)$/i.test(base)) return true;
  return false;
}

function isReadme(base: string): boolean {
  return /^readme(?:\.(?:md|markdown|rst|txt))?$/i.test(base);
}

function priorityFor(path: string): number {
  const base = baseName(path).toLowerCase();
  const depth = depthOf(path);

  if (isReadme(base) && depth === 0) return 100;
  if (ENV_NAME_RE.test(base) || SECRET_NAME_RE.test(base) || SECRET_EXT_RE.test(base)) return 100;
  if (base === ".gitignore" && depth === 0) return 98;
  if (/\.(?:bat|cmd|ps1|vbs)$/i.test(base)) return 94;
  if (MANIFESTS.has(base)) return Math.max(50, 88 - depth);
  if (LOCKFILES.has(base)) return 0;
  if (depth === 0 && (CONFIG_NAMES.has(base) || base.startsWith("dockerfile."))) return 90;
  if (CONFIG_NAMES.has(base) || base.startsWith("dockerfile.")) return Math.max(40, 72 - depth);
  if (CONFIG_EXTENSIONS.has(extName(path))) return Math.max(35, 68 - depth * 2);
  if (SOURCE_EXTENSIONS.has(extName(path))) return Math.max(18, 52 - depth * 2);
  if (DOC_EXTENSIONS.has(extName(path))) return Math.max(6, 26 - depth);
  if (base === "license" || base.startsWith("license.")) return 15;
  return 0;
}

export interface SelectionResult {
  selected: FileEntry[];
  skippedBySize: number;
  estimatedBytes: number;
}

export function selectFiles(files: FileEntry[]): SelectionResult {
  const scored: { file: FileEntry; priority: number; depth: number }[] = [];

  for (const file of files) {
    if (shouldIgnorePath(file.path)) continue;
    const priority = priorityFor(file.path);
    if (priority <= 0) continue;
    scored.push({ file, priority, depth: depthOf(file.path) });
  }

  scored.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.file.path.localeCompare(b.file.path);
  });

  const selected: FileEntry[] = [];
  let estimatedBytes = 0;
  let skippedBySize = 0;

  for (const { file } of scored) {
    if (selected.length >= LIMITS.maxFiles) break;
    if (file.size !== null && file.size > LIMITS.maxFileBytes) {
      skippedBySize += 1;
      continue;
    }
    const estimatedSize = file.size ?? 32 * 1024;
    if (estimatedBytes + estimatedSize > LIMITS.maxTotalBytes) break;
    selected.push(file);
    estimatedBytes += estimatedSize;
  }

  return { selected, skippedBySize, estimatedBytes };
}
