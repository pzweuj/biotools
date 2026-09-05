"use client"

import { useI18n } from "@/lib/i18n"
import { APP_VERSION } from "@/lib/config/version"

export function ProjectIntro() {
  const { t } = useI18n()

  return (
    <div className="flex min-h-full items-center px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {t("intro.eyebrow", "Bioinformatics / Local analysis")}
            </p>
            <h1 className="font-display text-6xl font-medium leading-[0.92] tracking-[-0.04em] text-primary sm:text-8xl">
              {t("nav.title", "BioTools")}
            </h1>
            <p className="max-w-2xl text-xl leading-8 text-muted-foreground sm:text-2xl">
              {t("intro.subtitle", "生物信息学工具库")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-4 text-sm text-muted-foreground">
            <span className="font-mono">v{APP_VERSION}</span>
            <span>{t("intro.usage", "选择左侧工具开始使用，点击右上角可切换语言")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
