# GitHub 仓库接入体检

粘贴一个公开 GitHub 仓库链接，自动检查 README、依赖清单、启动脚本、Windows 专用脚本、硬编码路径与敏感信息风险，并给出 100 分制的接入就绪度、等级、主要风险清单和整改建议。

## 本地运行

环境要求：Node.js 20.9+（推荐 22 LTS 或更高）。

```bash
npm install
npm run dev
```

打开 http://localhost:3000，输入仓库链接即可。生产构建：

```bash
npm run build
npm start
```

## 可选配置

复制 `.env.example` 为 `.env.local`，按需填写：

| 变量 | 作用 |
| --- | --- |
| `GITHUB_TOKEN` | 可选。提高 GitHub API 限额（未登录约 60 次/小时）。 |
| `AI_API_KEY` | 可选。配置后调用 OpenAI 兼容接口生成接入建议。 |
| `AI_BASE_URL` | 可选。默认 `https://api.openai.com/v1`，可换成其他兼容服务。 |
| `AI_MODEL` | 可选。默认 `gpt-4o-mini`。 |

未配置 AI Key 时，工具会使用本地规则生成建议，并在页面标注“本地规则”，功能不会中断。配置了 AI 但请求失败时，也会自动回退本地规则建议，并在报告中提示。AI 只生成建议，不参与 100 分制评分；评分始终由本地规则计算。

## 检查内容

- README：是否存在，是否包含安装、启动、配置、依赖说明和代码示例。
- 依赖：package.json、requirements.txt、pyproject.toml、go.mod、Cargo.toml、pom.xml、composer.json、Gemfile、*.csproj 等，以及对应锁文件。
- 启动：npm scripts、根目录的 Makefile / Dockerfile / Docker Compose / Procfile、`.devcontainer/devcontainer.json`，以及 README 中的启动命令。识别为库 / SDK 项目时，按 README 的安装与使用示例评估，不强制要求启动脚本。
- Windows 专用脚本：`.bat`、`.cmd`、`.ps1`、`.vbs`；检查 README 是否提到 Windows / PowerShell 相关说明，以及是否提示 PowerShell 执行策略。
- 硬编码路径：`C:\`、`C:/`、`/Users/`、`/home/`、`/opt`、`/var/www`、`/mnt`、`/srv`、`/root`、`/Volumes`、`/Applications` 及 UNC 共享路径。
- 敏感信息：常见云厂商 / 平台令牌（OpenAI `sk-`、AWS `AKIA`、腾讯云 `AKID`、Google API Key、Stripe 线上密钥、npm 发布令牌、GitHub / GitLab / Slack Token）、Bearer、JWT、私钥块和疑似硬编码凭据，以及 `.env` 文件入库和根目录 `.gitignore` 覆盖情况。

## 评分规则

| 维度 | 分值 |
| --- | --- |
| README 文档 | 20 |
| 依赖与锁定 | 20 |
| 启动脚本 | 20 |
| Windows 适配 | 15 |
| 硬编码路径 | 10 |
| 敏感信息 | 15 |

等级：85 分及以上 A，70–84 B，55–69 C，55 分以下 D。A 表示接入风险低，B 表示整体可控，C 表示存在明显缺口，D 表示阻断项较多。

每个维度下方会显示得分依据，页面里还可以展开查看评分规则。出现高危敏感信息时，“敏感信息”维度直接记 0 分。

## 数据来源与扫描边界

- 文件树和仓库元数据优先来自 GitHub REST API。文件树接口不可用时，会切换到 jsDelivr 备用源；仓库信息接口失败时，Star、语言、许可证等元数据可能显示为未知，报告中会明确提示。
- 文件内容优先从 raw.githubusercontent.com 读取，不可用时切换到 jsDelivr CDN。
- 只支持公开 GitHub 仓库；私有仓库、非 GitHub 域名和非法链接会直接返回错误提示。
- 只分析一个分支的当前文件：优先使用链接中指定的分支，未指定或读取失败时使用仓库默认分支；不扫描其他分支或 Git 历史。
- 扫描上限：最多读取 100 个文件，单文件 200 KB，总计 8 MB，按优先级抽样；优先 README、`.env` / 密钥类文件、Windows 脚本、依赖清单和配置。页面会显示实际扫描数量，未覆盖的部分不会假装已检查。
- 会自动跳过 `node_modules`、构建产物、依赖目录和二进制文件；锁文件只按路径识别，不读取内容。
- 风险条目与路径 / 敏感信息命中各最多展示 60 条，超出时报告中会提示。
- 仓库文件树被截断、文件读取失败、备用源缺元数据等情况都会在报告顶部明确提示。

## 安全说明

- 只读分析公开仓库，不下载完整仓库、不保存代码、不写数据库。
- 密钥内容在服务端脱敏后才返回页面，完整值不会出现在页面、日志或 AI 请求中。
- 调用 AI 时只发送聚合后的检查结果和风险标题/建议，不发送文件内容和完整密钥；请求发往 `AI_BASE_URL` 指定的服务。
- 结果由自动化规则生成，可能存在误报，不能替代安全审计。

## 技术栈

Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4、Lucide React。

## 检查命令

```bash
npm run lint
npm run typecheck
npm run build
```
