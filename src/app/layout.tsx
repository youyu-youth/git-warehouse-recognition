import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git 仓库接入体检",
  description:
    "粘贴公开 GitHub 仓库链接，检查 README、依赖清单、启动脚本、Windows 专用脚本、硬编码路径与敏感信息风险，生成接入就绪度评分和整改清单。",
  keywords: [
    "GitHub",
    "仓库体检",
    "接入检查",
    "README 检查",
    "敏感信息扫描",
    "Windows 脚本",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
