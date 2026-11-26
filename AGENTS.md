# AGENTS.md — git-shibie

## 1. 项目是什么

一个 Web 工具：粘贴公开 GitHub 仓库链接，只读扫描 README、依赖清单、启动脚本、Windows 专用脚本、硬编码路径和敏感信息，输出 100 分制接入就绪度、风险清单和整改建议。全站中文界面。

不下载完整仓库、不保存代码、不写数据库，只支持公开仓库。

## 2. 技术栈与命令

- Next.js 16 App Router、React 19、TypeScript（strict）、Tailwind CSS 4、Lucide React。
- 包管理器用 **npm**（仓库只有 `package-lock.json`），Node 20+。
- 本仓库**没有测试框架**，`package.json` 里没有 test 脚本。验证改动只跑相关检查，不要声称跑过不存在的测试。

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
npm start
```

## 3. 目录与数据流

```
app/page.tsx → components/analyzer.tsx（客户端状态机）
  └─ POST /api/analyze  { url }
       └─ lib/analyze.ts  编排
            parseRepoUrl → loadSnapshot → selectFiles → 并发读取文件
            → scan* → buildScore → buildRisks → buildLocalAdvice / buildAiAdvice
```

- `src/app/api/analyze/route.ts`：唯一接口。`maxDuration = 60`，请求体超过 10 KB 直接 413；错误统一返回 `{ error: { code, message, hint? } }`。
- `src/lib/github.ts`：GitHub API 拉仓库信息和文件树，失败时切 jsDelivr；文件内容优先 raw.githubusercontent，不可用再切 jsDelivr。所有请求带超时且 `cache: "no-store"`。
- `src/lib/select-files.ts`：按优先级抽样。忽略 `node_modules`、构建产物和二进制；锁文件优先级为 0，只按路径识别、不读内容。
- `src/lib/scan/`：`basic.ts`（README / 依赖 / 启动 / Windows）、`paths.ts`、`secrets.ts`；`patterns.ts` 存规则，`classify.ts` 把文件分为 business / doc / test 并影响严重级别。
- `src/lib/score.ts`：六维权重 README 20、依赖 20、启动 20、Windows 15、路径 10、敏感信息 15；85 / 70 / 55 分对应 A / B / C / D。
- `src/lib/risks.ts`：生成风险条目并排序（严重级别 → 类别）。
- `src/lib/ai.ts`：仅当配置 `AI_API_KEY` 时调用 OpenAI 兼容接口生成建议；只发送聚合结果和风险标题/建议，**不发送文件内容、不发送完整密钥**。失败时回退到 `advice.ts` 的本地规则建议并加 warning。
- `src/lib/limits.ts`：所有扫描上限的唯一来源（100 文件 / 单文件 200 KB / 总计 8 MB / 并发 10 / 风险与命中各 60 条）。不要在别处复制这些数字。
- `src/lib/types.ts`：前后端共用的返回结构；改字段时同步 `components/report/*` 和 `analyzer.tsx` 的类型守卫。
- `src/components/report/shared.tsx`：报告 UI 基础件（`SectionCard`、`SeverityPill`、`TonePill`、`FactRow`、`NoteLine`、`EmptyLine`）。新增卡片优先复用，不要引入 UI 库。

## 4. 不可破坏的约束

- **密钥脱敏在服务端完成**：返回页面、写日志、发 AI 前，只能出现 `maskToken` / `maskGeneric` 处理后的值。不要为了调试打印原始文件内容或完整密钥。
- **扫描范围要如实呈现**：文件树截断、文件读取失败、切换备用源、超过大小/数量上限，都必须写进 `meta.warnings` 并在页面显示。未检查的部分不能假装已检查。
- **只读**：不 clone、不写入目标仓库、不持久化仓库内容。
- **只支持 GitHub 公开仓库**：私有仓库、非 GitHub 域名、非法链接都走 `AnalyzeError` 的固定错误码，不要返回通用 500。
- **备用源要可追踪**：`meta.source` / `meta.contentSource` 必须是实际使用的来源，不能沿用默认值。
- 环境变量只在服务端读取：`GITHUB_TOKEN`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`。`.env*` 已被忽略，只能提交 `.env.example`，且只写变量名和安全占位值。

## 5. 改规则时的联动清单

新增或调整检查维度时，至少同步这几处，否则会出现评分与页面不一致：

1. `lib/types.ts` 增加 check 结构；
2. `lib/scan/*` 实现扫描；
3. `lib/score.ts` 增加维度、调整满分（总和仍为 100）；
4. `lib/risks.ts` 补充风险条目与类别排序；
5. `components/report/` 新增或更新卡片，并在 `report.tsx` 挂载；
6. `lib/ai.ts` 的 `compactContext` 只加聚合字段（不要加文件内容）；
7. `README.md` 的检查范围、评分表、扫描边界保持同步。

## 6. 代码与 UI 约定

- 路径别名 `@/*` → `src/*`；服务端逻辑放 `src/lib`，展示组件放 `src/components`，页面专属组件就近放置。
- TypeScript strict：不使用 `any` 绕过类型；外部 API 响应用显式结构收窄后再使用。
- 所有网络请求必须有超时和失败分支，错误信息面向用户、可执行，不暴露堆栈。
- UI 只有浅色模式（`color-scheme: light`），方角边框卡片，暖纸色系主题令牌定义在 `src/app/globals.css` 的 `@theme` 中：`paper` / `surface` / `ink` / `muted` / `line` / `accent` / `danger` / `warn` / `ok`。用语义令牌，不要写死十六进制颜色。
- 路径、分数、命令用 `font-mono`；小标签用 `text-[10px]` + 大写字母间距；避免渐变、紫罗兰配色和同色系浅底图标块。
- 动效克制，全局已处理 `prefers-reduced-motion`；交互元素要有 hover / focus-visible / disabled / loading / 错误状态。
- 打字时使用语义 HTML 和 `aria-*`，保证键盘可操作。

## 7. 注意

- Tailwind 4 通过 `next.config.ts` 的 Turbopack 规则（`@tailwindcss/turbopack`）接入，没有 `postcss.config.*` 和 `tailwind.config.*`。不要按 Tailwind 3 的方式新增配置。
- `next.config.ts` 开启了 `cacheComponents` 和 `partialPrefetching`；改动数据获取方式前先确认与这两个开关兼容。
- 仓库上级目录还有一份 `AGENTS.md`，描述的是另一个项目（KnowRealm-AI 官网，pnpm + shadcn + Fumadocs）。那些技术栈约定不适用于本仓库；本文件与 `package.json` 为准。
- 本仓库的 `README.md` 是面向用户的权威说明，修改检查项、评分或上限后必须同步更新。
