import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Red_Hat_Display, Red_Hat_Mono, Red_Hat_Text } from "next/font/google";
import "./globals.css";

const display = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-red-hat-display",
  display: "swap",
});

const text = Red_Hat_Text({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-red-hat-text",
  display: "swap",
});

const mono = Red_Hat_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-red-hat-mono",
  display: "swap",
});

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
    <html
      lang="zh-CN"
      className={`${display.variable} ${text.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
