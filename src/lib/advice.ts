import type {
  Advice,
  AdviceItem,
  RepoInfo,
  RiskItem,
  ScoreResult,
} from "./types";

export function buildLocalAdvice(
  repo: RepoInfo,
  score: ScoreResult,
  risks: RiskItem[],
): Advice {
  const high = risks.filter((risk) => risk.severity === "high");
  const medium = risks.filter((risk) => risk.severity === "medium");

  let summary: string;
  if (high.length > 0) {
    summary = `${repo.fullName} 的接入就绪度为 ${score.total}/100（${score.grade}），${score.verdict}。当前有 ${high.length} 个高危、${medium.length} 个中危风险，建议先处理「${high[0].title}」。`;
  } else if (medium.length > 0) {
    summary = `${repo.fullName} 的接入就绪度为 ${score.total}/100（${score.grade}），${score.verdict}。没有高危阻断项，但还有 ${medium.length} 个中危问题需要补齐，例如「${medium[0].title}」。`;
  } else {
    summary = `${repo.fullName} 的接入就绪度为 ${score.total}/100（${score.grade}），${score.verdict}。在已扫描的文件里没有发现明显风险，建议再在干净的 Windows 环境完整复跑一次。`;
  }

  const suggestions: AdviceItem[] = [];
  const push = (item: AdviceItem) => {
    if (suggestions.length >= 5) return;
    if (suggestions.some((existing) => existing.title === item.title)) return;
    suggestions.push(item);
  };

  for (const risk of high.slice(0, 3)) {
    push({ title: risk.title, detail: risk.suggestion, priority: "high" });
  }
  for (const risk of medium.slice(0, 2)) {
    push({ title: risk.title, detail: risk.suggestion, priority: "medium" });
  }

  push({
    title: "在干净的 Windows 环境复跑一次",
    detail:
      "找一台没有安装过项目依赖的 Windows 机器，按 README 从安装到启动完整走一遍，把缺失步骤补回文档。",
    priority: "medium",
  });
  push({
    title: "统一环境变量与示例文件",
    detail:
      "把运行所需的环境变量整理进 .env.example，真实值只放在本地或密钥管理服务中，并确认 .gitignore 已忽略 .env。",
    priority: "medium",
  });
  push({
    title: "固化启动入口与运行时版本",
    detail:
      "把验证过的命令写进 npm scripts 或 scripts/ 目录，并在 README 标注 Node / Python 等运行时版本，减少“在我机器上能跑”的问题。",
    priority: "low",
  });

  return {
    source: "rules",
    summary,
    suggestions: suggestions.slice(0, 5),
    note: "基于本次扫描结果自动生成，未调用大模型。",
  };
}
