"use client"

import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "./language-switcher"

export function Header() {
  const { t } = useI18n()

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold text-primary font-mono">{t("nav.title")}</div>
          <div className="text-sm text-muted-foreground font-mono">v1.0.0</div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
