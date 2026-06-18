"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export function ThemeToggle() {
  const { t } = useI18n()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // next-themes 必须在挂载后才能稳定读取，避免水合不一致
  useEffect(() => setMounted(true), [])

  const current = resolvedTheme ?? theme
  const isDark = current === "dark"

  const toggle = () => setTheme(isDark ? "light" : "dark")

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
      onClick={toggle}
      aria-label={t("nav.toggleTheme", "Toggle theme")}
      title={t("nav.toggleTheme", "Toggle theme")}
    >
      {mounted ? (
        isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4 opacity-0" />
      )}
    </Button>
  )
}
