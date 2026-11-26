import { baseName, depthOf, extName } from "../file-path";
import { shouldIgnorePath } from "../select-files";
import type {
  DependencyCheck,
  FileEntry,
  ReadmeCheck,
  StartCheck,
  WindowsCheck,
  WindowsScriptType,
} from "../types";

interface ManifestSpec {
  label: string;
  test: (base: string) => boolean;
  locks: string[];
  expectsLock: boolean;
}

const MANIFEST_SPECS: ManifestSpec[] = [
  {
    label: "Node.js",
    test: (base) => base === "package.json",
    locks: ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "npm-shrinkwrap.json"],
    expectsLock: true,
  },
  {
    label: "Python",
    test: (base) =>
      /^requirements.*\.txt$/i.test(base) ||
      ["pyproject.toml", "pipfile", "setup.py", "setup.cfg", "environment.yml", "environment.yaml"].includes(base),
    locks: ["poetry.lock", "pipfile.lock", "uv.lock", "pdm.lock"],
    expectsLock: true,
  },
  {
    label: "Go",
    test: (base) => base === "go.mod",
    locks: ["go.sum"],
    expectsLock: true,
  },
  {
    label: "Rust",
    test: (base) => base === "cargo.toml",
    locks: ["cargo.lock"],
    expectsLock: true,
  },
  {
    label: "PHP",
    test: (base) => base === "composer.json",
    locks: ["composer.lock"],
    expectsLock: true,
  },
  {
    label: "Ruby",
    test: (base) => base === "gemfile",
    locks: ["gemfile.lock"],
    expectsLock: true,
  },
  {
    label: "Java（Maven）",
    test: (base) => base === "pom.xml",
    locks: [],
    expectsLock: false,
  },
  {
    label: "Java（Gradle）",
    test: (base) => base === "build.gradle" || base === "build.gradle.kts",
    locks: ["gradle.lockfile"],
    expectsLock: false,
  },
  {
    label: "C# / .NET",
    test: (base) => base.endsWith(".csproj") || base.endsWith(".sln"),
    locks: ["packages.lock.json"],
    expectsLock: false,
  },
  {
    label: "Dart / Flutter",
    test: (base) => base === "pubspec.yaml",
    locks: ["pubspec.lock"],
    expectsLock: true,
  },
];

function findSpec(base: string): ManifestSpec | undefined {
  return MANIFEST_SPECS.find((spec) => spec.test(base));
}

const INSTALL_COMMAND_RE =
  /(?:npm|pnpm|yarn|bun|pip3?|poetry|uv|go\s+get|cargo|composer|apt-get|brew)\s+(?:install|add|get)/i;

const USAGE_IMPORT_RE =
  /(?:^|\n)\s*(?:>>>\s*)?(?:import\s+[\w.]+|from\s+[\w.]+\s+import\s+|(?:const|let|var)\s+\w+\s*=\s*require\(|require\(['"][\w@/.-]+['"]\)|use\s+[\w\\]+;)/m;

const LIBRARY_WORD_RE = /\b(?:library|package|sdk|module|framework)\b|库|组件包/i;

function hasLibrarySignals(readmeText: string | null): boolean {
  return Boolean(
    readmeText &&
      INSTALL_COMMAND_RE.test(readmeText) &&
      USAGE_IMPORT_RE.test(readmeText) &&
      LIBRARY_WORD_RE.test(readmeText),
  );
}

export function findReadmePath(files: FileEntry[]): string | null {
  const candidates = files.filter((file) => {
    const base = baseName(file.path).toLowerCase();
    return /^readme(?:\.(?:md|markdown|rst|txt))?$/i.test(base);
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const depthDiff = depthOf(a.path) - depthOf(b.path);
    if (depthDiff !== 0) return depthDiff;
    return a.path.localeCompare(b.path);
  });

  return candidates[0].path;
}

export function scanReadme(
  files: FileEntry[],
  contents: Map<string, string>,
): ReadmeCheck {
  const path = findReadmePath(files);
  const notes: string[] = [];

  if (!path) {
    return {
      found: false,
      path: null,
      chars: 0,
      sections: { install: false, run: false, config: false, dependencies: false },
      codeBlocks: 0,
      envMention: false,
      points: 0,
      notes: ["仓库中没有找到 README 文件。"],
    };
  }

  const text = contents.get(path) ?? null;
  const chars = text?.length ?? 0;

  if (!text) {
    notes.push("README 存在，但内容未能读取（可能过大或拉取失败）。");
    return {
      found: true,
      path,
      chars: 0,
      sections: { install: false, run: false, config: false, dependencies: false },
      codeBlocks: 0,
      envMention: false,
      points: 8,
      notes,
    };
  }

  const install =
    /\binstall(?:ing|ation)?\b|安装|下载|\bdownload\b/i.test(text) ||
    INSTALL_COMMAND_RE.test(text);

  const runCommand =
    /(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:dev|start|serve)\b/i.test(text) ||
    /\bdocker\s+compose\s+up\b|\bdocker-compose\s+up\b/i.test(text) ||
    /\bmake\s+(?:run|dev|start|serve)\b/i.test(text) ||
    /\b(?:go\s+run|cargo\s+run|dotnet\s+run|pwsh)(?:\b|\.)/i.test(text);

  const libraryUsage = hasLibrarySignals(text);

  const run =
    /(?:^|\n)\s*#{1,6}[^\n]*(?:usage|使用|运行|启动|quick\s*-?\s*start|getting started|how to run|build|构建|编译)/i.test(text) ||
    runCommand ||
    libraryUsage;

  const config =
    /(?:environment variable|env file|environment|\.env|环境变量|配置)/i.test(text);
  const dependencies =
    /(?:dependencies|requirements|prerequisites|依赖|前置条件)/i.test(text);
  const envMention = /\.env|environment variable|环境变量/i.test(text);
  const codeBlocks = Math.floor(((text.match(/```/g) ?? []).length) / 2);

  let points = 8;
  if (install && run) points += 6;
  else if (install || run) points += 3;
  if (config) points += 3;
  if (codeBlocks > 0) points += 3;

  if (!install) notes.push("README 没有明显提到安装步骤。");
  if (!run) notes.push("README 没有明显提到运行 / 启动方式。");
  if (!config) notes.push("README 没有说明环境变量或配置项。");

  return {
    found: true,
    path,
    chars,
    sections: { install, run, config, dependencies },
    codeBlocks,
    envMention,
    points,
    notes,
  };
}

export function scanDependencies(
  files: FileEntry[],
  contents: Map<string, string>,
): DependencyCheck {
  const manifests: { path: string; ecosystem: string }[] = [];

  for (const file of files) {
    if (shouldIgnorePath(file.path)) continue;
    const base = baseName(file.path).toLowerCase();
    const spec = findSpec(base);
    if (!spec) continue;
    manifests.push({ path: file.path, ecosystem: spec.label });
  }

  manifests.sort((a, b) => {
    const depthDiff = depthOf(a.path) - depthOf(b.path);
    if (depthDiff !== 0) return depthDiff;
    return a.path.localeCompare(b.path);
  });

  const lockfiles: { path: string; ecosystem: string }[] = [];
  for (const file of files) {
    if (shouldIgnorePath(file.path)) continue;
    const base = baseName(file.path).toLowerCase();
    for (const spec of MANIFEST_SPECS) {
      if (spec.locks.includes(base)) {
        lockfiles.push({ path: file.path, ecosystem: spec.label });
        break;
      }
    }
  }

  lockfiles.sort((a, b) => a.path.localeCompare(b.path));

  const notes: string[] = [];
  const main = manifests[0] ?? null;
  const mainSpec = main ? MANIFEST_SPECS.find((spec) => spec.label === main.ecosystem) : undefined;
  const lockfileFound = main ? lockfiles.some((lock) => lock.ecosystem === main.ecosystem) : false;
  const lockfileExpected = mainSpec?.expectsLock ?? false;

  let packageScripts: Record<string, string> | null = null;

  if (main?.ecosystem === "Node.js") {
    const content = contents.get(main.path);
    if (content) {
      try {
        const parsed = JSON.parse(content) as { scripts?: Record<string, unknown> };
        if (parsed.scripts && typeof parsed.scripts === "object") {
          packageScripts = {};
          for (const [key, value] of Object.entries(parsed.scripts)) {
            if (typeof value === "string") packageScripts[key] = value;
          }
        }
        if (!packageScripts || Object.keys(packageScripts).length === 0) {
          notes.push("package.json 中没有可用的 npm scripts。");
        }
      } catch {
        notes.push("package.json 解析失败，无法读取启动脚本。");
      }
    } else {
      notes.push("package.json 内容未能读取，无法确认启动脚本。");
    }
  }

  if (!main) {
    notes.push("没有找到常见生态的依赖清单。");
  } else {
    notes.push(`主依赖清单：${main.path}（${main.ecosystem}）。`);
    if (lockfileExpected && !lockfileFound) {
      notes.push("该生态缺少依赖锁文件，不同机器安装的版本可能不一致。");
    } else if (lockfileFound) {
      notes.push("已找到对应的依赖锁文件。");
    }
  }

  let points = 0;
  if (main) {
    points += 12;
    if (!lockfileExpected || lockfileFound) points += 8;
  }

  return {
    manifests: manifests.slice(0, 10),
    lockfiles: lockfiles.slice(0, 10),
    mainManifest: main?.path ?? null,
    mainEcosystem: main?.ecosystem ?? null,
    lockfileExpected,
    lockfileFound,
    packageScripts,
    points,
    notes,
  };
}

function extractReadmeCommands(text: string | null): {
  commands: string[];
  hasStart: boolean;
} {
  if (!text) return { commands: [], hasStart: false };

  const pattern =
    /^\s*(?:\$|>)?\s*((?:npm|pnpm|yarn|bun|pip3?|python3?|poetry|uv|go|cargo|make|docker(?:\s+compose|-compose)?|dotnet|mvn|gradlew?|composer)\b[^\n\r]{0,120})$/i;

  const commands: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(pattern);
    if (!match) continue;
    const command = match[1].trim();
    if (commands.includes(command)) continue;
    commands.push(command);
    if (commands.length >= 6) break;
  }

  const startPattern =
    /(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:dev|start|serve)\b|\bdocker\s+compose\s+up\b|\bdocker-compose\s+up\b|\bmake\s+(?:run|dev|start|serve)\b|\bgo\s+run\b|\bcargo\s+run\b|\bdotnet\s+run\b|\bpython3?\s+(?:-m\s+)?[^\s]+\.py\b|\buvicorn\b|\bgunicorn\b/i;

  return {
    commands,
    hasStart: commands.some((command) => startPattern.test(command)),
  };
}

export function scanStart(
  files: FileEntry[],
  contents: Map<string, string>,
  readmeText: string | null,
  deps: DependencyCheck,
): StartCheck {
  const notes: string[] = [];
  const scripts = deps.packageScripts ?? {};

  const lockNames = new Set(deps.lockfiles.map((lock) => baseName(lock.path).toLowerCase()));
  const packageManager = lockNames.has("pnpm-lock.yaml")
    ? "pnpm"
    : lockNames.has("yarn.lock")
      ? "yarn"
      : lockNames.has("bun.lock") || lockNames.has("bun.lockb")
        ? "bun"
        : "npm";

  const scriptName = ["dev", "start", "serve"].find(
    (name) => typeof scripts[name] === "string" && scripts[name].trim().length > 0,
  );

  let packageCommand: string | null = null;
  if (scriptName) {
    packageCommand = packageManager === "npm" && scriptName === "start"
      ? "npm start"
      : `${packageManager} run ${scriptName}`;
  }

  const makefile = files.find(
    (file) => depthOf(file.path) === 0 && baseName(file.path).toLowerCase() === "makefile",
  );
  const makefileText = makefile ? contents.get(makefile.path) ?? null : null;
  let makeTarget: string | null = null;
  if (makefileText) {
    const targets = [...makefileText.matchAll(/^([A-Za-z0-9_.-]+)\s*:/gm)].map((match) => match[1]);
    makeTarget = ["run", "dev", "start", "serve"].find((target) => targets.includes(target)) ?? null;
  }

  const composeFile = files.find((file) => {
    const base = baseName(file.path).toLowerCase();
    return (
      depthOf(file.path) === 0 &&
      ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"].includes(base)
    );
  });

  const dockerfile = files.find((file) => {
    const base = baseName(file.path).toLowerCase();
    return depthOf(file.path) === 0 && (base === "dockerfile" || base.startsWith("dockerfile."));
  });

  const procfile = files.find(
    (file) => depthOf(file.path) === 0 && baseName(file.path).toLowerCase() === "procfile",
  );

  const devcontainer = files.find(
    (file) => file.path === ".devcontainer/devcontainer.json",
  );

  let oneCommand = false;
  let command: string | null = null;

  if (packageCommand) {
    oneCommand = true;
    command = packageCommand;
  } else if (composeFile) {
    oneCommand = true;
    command = "docker compose up";
  } else if (makeTarget) {
    oneCommand = true;
    command = `make ${makeTarget}`;
  }

  const readmeExtract = extractReadmeCommands(readmeText);
  const alternatives = [dockerfile?.path, composeFile?.path, makefile?.path, procfile?.path, devcontainer?.path]
    .filter((value): value is string => Boolean(value));

  const libraryProject =
    !packageCommand &&
    !composeFile &&
    !devcontainer &&
    !procfile &&
    !dockerfile &&
    Boolean(deps.mainManifest) &&
    hasLibrarySignals(readmeText);

  const crossPlatform =
    Boolean(packageCommand) ||
    Boolean(composeFile) ||
    Boolean(devcontainer) ||
    libraryProject ||
    (readmeExtract.hasStart &&
      /(?:npm|pnpm|yarn|bun|docker|python|go\s+run|cargo\s+run|dotnet|mvn|gradlew?|uvicorn|gunicorn)/i.test(
        readmeExtract.commands.join(" "),
      ));

  if (oneCommand) notes.push(`检测到可用的启动命令：${command}。`);
  else if (libraryProject) notes.push("看起来是库 / SDK 项目，安装后可被引用，不要求启动脚本。");
  else notes.push("没有找到明确的一键启动脚本。");
  if (readmeExtract.hasStart) notes.push("README 中给出了启动命令。");
  else if (libraryProject) notes.push("README 提供了安装方式和代码使用示例。");
  else notes.push("README 中没有识别到启动命令。");
  if (alternatives.length > 0) notes.push(`发现辅助启动方式：${alternatives.join("、")}。`);

  if (makeTarget && !packageCommand) {
    notes.push("Makefile 在 Windows 默认环境下通常不能直接运行。");
  }

  let points = 0;
  if (oneCommand) points += 10;
  if (readmeExtract.hasStart) points += 6;
  if (alternatives.length > 0) points += 4;
  if (libraryProject) points = Math.max(points, 16);

  return {
    oneCommand,
    command,
    readmeCommands: readmeExtract.commands,
    readmeHasStartCommand: readmeExtract.hasStart,
    alternatives,
    crossPlatform,
    libraryProject,
    points,
    notes,
  };
}

const WINDOWS_SCRIPT_TYPES: Record<string, WindowsScriptType> = {
  ".bat": "bat",
  ".cmd": "cmd",
  ".ps1": "ps1",
  ".vbs": "vbs",
};

export function scanWindows(
  files: FileEntry[],
  readmeText: string | null,
  start: StartCheck,
): WindowsCheck {
  const scripts: { path: string; type: WindowsScriptType }[] = [];

  for (const file of files) {
    if (shouldIgnorePath(file.path)) continue;
    const type = WINDOWS_SCRIPT_TYPES[extName(file.path)];
    if (!type) continue;
    scripts.push({ path: file.path, type });
  }

  scripts.sort((a, b) => a.path.localeCompare(b.path));

  const documented = Boolean(
    readmeText && /windows|powershell|\.ps1|\.bat\b|\.cmd\b|cmd\.exe|win32/i.test(readmeText),
  );
  const executionPolicyNote = Boolean(
    readmeText && /executionpolicy|set-executionpolicy|执行策略|运行策略/i.test(readmeText),
  );

  const hasShellEntry = files.some((file) => {
    if (shouldIgnorePath(file.path)) return false;
    const base = baseName(file.path).toLowerCase();
    return (
      /\.(?:sh|bash|zsh)$/i.test(base) &&
      /^(?:start|run|setup|install|dev|bootstrap|build)\.(?:sh|bash|zsh)$/i.test(base)
    );
  });

  const shellOnlyStart =
    hasShellEntry && scripts.length === 0 && !start.crossPlatform;

  const notes: string[] = [];
  if (scripts.length === 0) {
    notes.push("仓库中没有发现 Windows 专用脚本（.bat / .cmd / .ps1 / .vbs）。");
  } else {
    notes.push(`发现 ${scripts.length} 个 Windows 专用脚本。`);
  }
  if (documented) notes.push("README 中提到了 Windows 或相关脚本。");
  else if (scripts.length > 0) notes.push("README 中没有说明这些 Windows 脚本怎么用。");
  if (scripts.some((script) => script.type === "ps1") && !executionPolicyNote) {
    notes.push("存在 PowerShell 脚本，但 README 没有提示执行策略问题。");
  }
  if (shellOnlyStart) notes.push("启动入口只有 .sh 脚本，Windows 用户无法直接运行。");

  let points = 0;
  if (start.crossPlatform || scripts.length > 0) points += 8;
  if (documented) points += 4;
  if (!shellOnlyStart) points += 3;

  return {
    scripts: scripts.slice(0, 30),
    total: scripts.length,
    documented,
    executionPolicyNote,
    shellOnlyStart,
    points,
    notes,
  };
}
