"use client"

import { useI18n } from "@/lib/i18n"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "./language-switcher"
import { GitHubIcon } from "./icons/github-icon"
import { Button } from "./ui/button"

export function Header() {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')}
            className="text-xl font-bold text-primary font-mono hover:text-primary/80 transition-colors duration-200 cursor-pointer"
          >
            {t("nav.title")}
          </button>
          <div className="text-sm text-muted-foreground font-mono">v1.0.0</div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
            onClick={() => window.open('https://github.com/pzweuj/biotools', '_blank')}
            title="GitHub Repository"
          >
            <GitHubIcon className="w-4 h-4" />
          </Button>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
