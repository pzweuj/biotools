"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"
import { GitHubIcon } from "./icons/github-icon"
import { Button } from "./ui/button"
import { APP_VERSION } from "@/lib/config/version"

export function Header() {
  const { t } = useI18n()
  const router = useRouter()
  const [swReady, setSwReady] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      setSwReady(true)
    }
    // 当 SW 激活后被 serviceWorker.controller 捕获
    const onController = () => setSwReady(true)
    navigator.serviceWorker?.addEventListener("controllerchange", onController)
    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onController)
    }
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="font-display text-xl font-medium tracking-tight text-primary transition-colors duration-200 hover:text-primary/80"
            aria-label={t("nav.backToHome")}
            title={t("nav.backToHome")}
          >
            {t("nav.title")}
          </button>
          <div className="font-mono text-xs text-muted-foreground">v{APP_VERSION}</div>
          {swReady && (
            <span
              className="flex items-center gap-1 text-[10px] text-muted-foreground"
              title="Offline-ready — 可离线使用"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Offline
            </span>
          )}
          <kbd className="hidden items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
            onClick={() => window.open('https://github.com/pzweuj/biotools', '_blank', 'noopener,noreferrer')}
            title="GitHub Repository"
          >
            <GitHubIcon className="w-4 h-4" />
          </Button>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}

