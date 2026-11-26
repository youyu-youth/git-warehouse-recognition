# GitHub 仓库接入体检

粘贴一个公开 GitHub 仓库链接，自动检查 README、依赖清单、启动脚本、Windows 专用脚本、硬编码路径与敏感信息风险，并给出 100 分制的接入就绪度、等级、主要风险清单和整改建议。

## 本地运行

环境要求：Node.js 20+（推荐 22+）。

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

未配置 AI Key 时，工具会使用本地规则生成建议，并在页面标注“本地规则”，功能不会中断。

## 检查内容

- README：是否存在，是否包含安装、启动、配置、依赖说明和代码示例。
- 依赖：package.json、requirements.txt、pyproject.toml、go.mod、Cargo.toml、pom.xml、composer.json、Gemfile、*.csproj 等，以及对应锁文件。
- 启动：npm scripts、Makefile、Dockerfile、Docker Compose、Procfile，以及 README 中的启动命令。识别为库 / SDK 项目时，按 README 的安装与使用示例评估，不强制要求启动脚本。
- Windows 专用脚本：`.bat`、`.cmd`、`.ps1`、`.vbs`，并检查 README 是否说明执行方式与 PowerShell 执行策略。
- 硬编码路径：`C:\`、`C:/`、`/Users/`、`/home/`、`/opt`、`/var/www`、`/mnt`、`/srv`、`/root`、`/Volumes`、`/Applications` 及 UNC 共享路径。
- 敏感信息：常见云厂商 / 平台令牌、OpenAI `sk-`、AWS `AKIA`、腾讯云 `AKID`、GitHub / GitLab / Slack Token、Bearer、JWT、私钥块，以及 `.env` 文件入库和 `.gitignore` 覆盖情况。

## 评分规则

| 维度 | 分值 |
| --- | --- |
| README 文档 | 20 |
| 依赖与锁定 | 20 |
| 启动脚本 | 20 |
| Windows 适配 | 15 |
| 硬编码路径 | 10 |
| 敏感信息 | 15 |

等级：85 分及以上 A，70–84 B，55–69 C，55 分以下 D。页面里可以展开查看每个维度的具体得分依据。

## 数据来源与扫描边界

- 文件树和仓库元数据优先来自 GitHub REST API；接口不可用时自动切换到 jsDelivr 备用源。
- 文件内容优先从 raw.githubusercontent.com 读取，不可用时切换到 jsDelivr CDN。
- 扫描上限：最多读取 100 个文件，单文件 200 KB，总计 8 MB，按优先级抽样。页面会显示实际扫描数量，未覆盖的部分不会假装已检查。
- 仓库文件树被截断、文件读取失败、备用源缺元数据等情况都会在报告顶部明确提示。

## 安全说明

- 只读分析公开仓库，不下载完整仓库、不保存代码、不写数据库。
- 密钥内容在服务端脱敏后才返回页面，完整值不会出现在页面、日志或 AI 请求中。
- 调用 AI 时只发送聚合后的检查结果和风险标题/建议，不发送文件内容和完整密钥。
- 结果由自动化规则生成，可能存在误报，不能替代安全审计。

## 技术栈

Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4、Lucide React。

## 检查命令

```bash
npm run lint
npm run typecheck
npm run build
```
