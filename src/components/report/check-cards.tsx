import { Check, X } from "lucide-react";
import type { DependencyCheck, ReadmeCheck, StartCheck } from "@/lib/types";
import { cn } from "@/lib/cn";
import { FactRow, MonoTag, NoteLine, SectionCard, TonePill, type Tone } from "./shared";

function toneFor(points: number, max: number): Tone {
  const ratio = max > 0 ? points / max : 0;
  if (ratio >= 0.8) return "ok";
  if (points > 0) return "warn";
  return "bad";
}

function labelFor(points: number, max: number): string {
  const ratio = max > 0 ? points / max : 0;
  if (ratio >= 0.8) return "齐全";
  if (points > 0) return "有缺口";
  return "缺失";
}

function CheckChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-0.5 text-[11px] leading-4",
        ok
          ? "border-line bg-paper-3 text-ink-2"
          : "border-danger/25 bg-danger-soft text-danger",
      )}
    >
      {ok ? (
        <Check className="h-3 w-3 text-ok" aria-hidden="true" />
      ) : (
        <X className="h-3 w-3 text-danger" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

export function ReadmeCard({ readme }: { readme: ReadmeCheck }) {
  return (
    <SectionCard
      title="README 文档"
      subtitle="安装、启动、配置说明"
      points={readme.points}
      max={20}
      headRight={
        <TonePill tone={toneFor(readme.points, 20)} label={labelFor(readme.points, 20)} />
      }
    >
      {readme.found ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <MonoTag>{readme.path}</MonoTag>
            <span className="font-mono text-[11px] text-muted">
              {readme.chars.toLocaleString("zh-CN")} 字符
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <CheckChip ok={readme.sections.install} label="安装" />
            <CheckChip ok={readme.sections.run} label="启动" />
            <CheckChip ok={readme.sections.config} label="配置" />
            <CheckChip ok={readme.sections.dependencies} label="依赖" />
          </div>
          <FactRow
            state={readme.codeBlocks > 0 ? "ok" : "bad"}
            label="代码示例"
            value={`${readme.codeBlocks} 个代码块`}
          />
          {(readme.chars === 0 || readme.notes.some((note) => note.includes("未能读取"))) && (
            <NoteLine>
              {readme.chars === 0 ? "README 内容未能读取，仅确认了文件存在。" : readme.notes[0]}
            </NoteLine>
          )}
        </div>
      ) : (
        <NoteLine tone="bad">没有找到 README，接入时需要额外补充项目说明。</NoteLine>
      )}
    </SectionCard>
  );
}

export function DependencyCard({ deps }: { deps: DependencyCheck }) {
  const extraNotes = deps.notes.filter((note) =>
    /解析失败|未能读取|没有可用|没有找到/.test(note),
  );

  return (
    <SectionCard
      title="依赖与锁定"
      subtitle="依赖清单、锁文件、脚本"
      points={deps.points}
      max={20}
      headRight={<TonePill tone={toneFor(deps.points, 20)} label={labelFor(deps.points, 20)} />}
    >
      {deps.mainManifest ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <MonoTag>{deps.mainManifest}</MonoTag>
            <span className="text-[11px] text-muted">{deps.mainEcosystem}</span>
          </div>

          <FactRow
            state={
              deps.lockfileFound ? "ok" : deps.lockfileExpected ? "bad" : "na"
            }
            label="依赖锁文件"
            mono={deps.lockfileFound}
            value={
              deps.lockfileFound
                ? deps.lockfiles.find((lock) => lock.ecosystem === deps.mainEcosystem)?.path
                : deps.lockfileExpected
                  ? "未找到"
                  : "该生态通常不需要"
            }
          />
          {deps.mainEcosystem === "Node.js" && (
            <FactRow
              state={deps.packageScripts ? "ok" : "bad"}
              label="npm scripts"
              value={
                deps.packageScripts
                  ? `${Object.keys(deps.packageScripts).length} 个`
                  : "未读取"
              }
            />
          )}

          {deps.manifests.length > 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-line/70 pt-3">
              {deps.manifests.slice(0, 4).map((manifest) => (
                <MonoTag key={manifest.path}>{manifest.path}</MonoTag>
              ))}
              {deps.manifests.length > 4 && (
                <span className="font-mono text-[11px] text-muted">
                  +{deps.manifests.length - 4}
                </span>
              )}
            </div>
          )}

          {deps.packageScripts && Object.keys(deps.packageScripts).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(deps.packageScripts).slice(0, 6).map((name) => (
                <MonoTag key={name}>{name}</MonoTag>
              ))}
            </div>
          )}

          {extraNotes.length > 0 && (
            <p className="text-[11px] leading-5 text-muted">{extraNotes[0]}</p>
          )}
        </div>
      ) : (
        <NoteLine tone="bad">没有找到依赖清单，无法确认安装方式和依赖版本。</NoteLine>
      )}
    </SectionCard>
  );
}

export function StartCard({ start }: { start: StartCheck }) {
  const extraNotes = start.notes.filter((note) => note.includes("Makefile"));

  return (
    <SectionCard
      title="启动脚本"
      subtitle={start.libraryProject ? "库 / SDK 项目的使用入口" : "一条命令能否跑起来"}
      points={start.points}
      max={20}
      headRight={<TonePill tone={toneFor(start.points, 20)} label={labelFor(start.points, 20)} />}
    >
      {start.libraryProject ? (
        <div className="space-y-3">
          <NoteLine tone="ok">
            看起来是库 / SDK 项目，安装后通过 import / require 使用，不要求启动脚本。
          </NoteLine>
          <FactRow state="ok" label="README 安装说明" value="已提供" />
          <FactRow state="ok" label="代码使用示例" value="已提供" />
          {start.alternatives.length > 0 && (
            <FactRow
              state="na"
              label="仓库辅助文件"
              value={start.alternatives.slice(0, 2).join("、")}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {start.command ? (
            <div className="rounded-[var(--radius-pill)] border border-line bg-paper-3 px-3 py-2.5">
              <p className="text-[11px] text-muted">推荐启动</p>
              <p className="mt-1 break-all font-mono text-[13px] leading-5 text-ink">
                {start.command}
              </p>
            </div>
          ) : (
            <FactRow state="bad" label="一键启动命令" value="未发现" />
          )}

          <FactRow
            state={start.readmeHasStartCommand ? "ok" : "bad"}
            label="README 启动命令"
            value={start.readmeCommands.length > 0 ? `${start.readmeCommands.length} 条` : "未识别"}
          />

          {start.readmeCommands.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {start.readmeCommands.slice(0, 3).map((command) => (
                <MonoTag key={command} className="max-w-full">
                  <span className="truncate">{command}</span>
                </MonoTag>
              ))}
            </div>
          )}

          <FactRow
            state={start.alternatives.length > 0 ? "ok" : "na"}
            label="容器 / 构建入口"
            value={
              start.alternatives.length > 0
                ? start.alternatives.slice(0, 2).join("、")
                : "未发现"
            }
          />

          {extraNotes.length > 0 && (
            <p className="text-[11px] leading-5 text-muted">{extraNotes[0]}</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
