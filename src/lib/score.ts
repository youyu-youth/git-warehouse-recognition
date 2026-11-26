import type {
  DependencyCheck,
  DimensionScore,
  PathsCheck,
  ReadmeCheck,
  ScoreResult,
  SecretsCheck,
  StartCheck,
  WindowsCheck,
} from "./types";

export function buildScore(checks: {
  readme: ReadmeCheck;
  deps: DependencyCheck;
  start: StartCheck;
  windows: WindowsCheck;
  paths: PathsCheck;
  secrets: SecretsCheck;
}): ScoreResult {
  const { readme, deps, start, windows, paths, secrets } = checks;

  const readmeDetail = !readme.found
    ? "未找到 README"
    : `README ${readme.sections.install ? "含安装" : "缺安装"}、${readme.sections.run ? "含启动" : "缺启动"}说明`;

  const depsDetail = deps.mainManifest
    ? `${deps.mainManifest}${deps.lockfileFound ? " + 锁文件" : deps.lockfileExpected ? "，缺锁文件" : ""}`
    : "未发现依赖清单";

  const startDetail = start.libraryProject
    ? "库 / SDK 项目，安装后可被引用"
    : start.oneCommand
      ? `可执行 ${start.command}`
      : start.readmeHasStartCommand
        ? "仅 README 中有启动命令"
        : "没有明确启动方式";

  const windowsDetail =
    windows.total > 0
      ? `${windows.total} 个 Windows 脚本${windows.documented ? "，README 有说明" : "，README 未说明"}`
      : start.crossPlatform
        ? "未发现专用脚本，但启动方式跨平台"
        : windows.shellOnlyStart
          ? "仅提供 .sh 启动脚本"
          : "缺少 Windows 启动方式";

  const pathsDetail =
    paths.total > 0 ? `${paths.total} 处，涉及 ${paths.filesAffected} 个文件` : "未发现硬编码路径";

  const secretsDetail =
    secrets.total > 0
      ? `高 ${secrets.bySeverity.high} / 中 ${secrets.bySeverity.medium} / 低 ${secrets.bySeverity.low}`
      : "未发现明显密钥";

  const dimensions: DimensionScore[] = [
    { key: "docs", label: "README 文档", earned: readme.points, max: 20, detail: readmeDetail },
    { key: "deps", label: "依赖与锁定", earned: deps.points, max: 20, detail: depsDetail },
    { key: "start", label: "启动脚本", earned: start.points, max: 20, detail: startDetail },
    { key: "windows", label: "Windows 适配", earned: windows.points, max: 15, detail: windowsDetail },
    { key: "paths", label: "硬编码路径", earned: paths.points, max: 10, detail: pathsDetail },
    { key: "secrets", label: "敏感信息", earned: secrets.points, max: 15, detail: secretsDetail },
  ];

  const total = Math.max(
    0,
    Math.min(100, dimensions.reduce((sum, dimension) => sum + dimension.earned, 0)),
  );

  const grade: ScoreResult["grade"] =
    total >= 85 ? "A" : total >= 70 ? "B" : total >= 55 ? "C" : "D";

  const verdict =
    grade === "A"
      ? "接入风险低，可以直接开始"
      : grade === "B"
        ? "整体可控，补齐少量问题即可接入"
        : grade === "C"
          ? "存在明显缺口，建议先完成重点整改"
          : "阻断项较多，暂不建议直接接入";

  return { total, grade, verdict, dimensions };
}
