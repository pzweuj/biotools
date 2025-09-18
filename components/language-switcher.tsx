"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export function LanguageSwitcher() {
  const { locale, switchLocale } = useI18n()

  return (
    <div className="flex items-center gap-1 bg-muted rounded-md p-1">
      <Button
        variant={locale === "zh" ? "default" : "ghost"}
        size="sm"
        onClick={() => switchLocale("zh")}
        className="h-7 px-2 text-xs font-mono"
      >
        中文
      </Button>
      <Button
        variant={locale === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => switchLocale("en")}
        className="h-7 px-2 text-xs font-mono"
      >
        EN
      </Button>
    </div>
  )
}
