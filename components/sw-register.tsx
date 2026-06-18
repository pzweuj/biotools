"use client"

import { useEffect } from "react"

/**
 * 注册 Service Worker —— 仅在生产环境。
 * 位于 body 底部；注册完成后 header 的 offline 指示器自动检测 navigator.serviceWorker.controller。
 */
export function SwRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // 当发现有新 SW 等待时提示刷新（可选；此处静默升级）
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // 新版本已就绪 —— 静默升级（skipWaiting 已在 sw.js 中处理）
            }
          })
        })
      })
      .catch(() => {
        // SW 注册失败（非 HTTPS / localhost 等）—— 静默
      })
  }, [])

  return null
}
