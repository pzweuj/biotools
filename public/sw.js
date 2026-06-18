// BioTools Service Worker — 离线可用 + 后台更新
// 策略：关键资产预缓存（install），其余 NetworkFirst + 缓存回退
const CACHE = "biotools-v1"

const PRECACHE = ["/", "/site.webmanifest", "/favicon.png", "/logo.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  // 只处理 GET
  if (request.method !== "GET") return

  // 外部 API 代理：NetworkOnly（不做缓存）
  const url = new URL(request.url)
  if (url.pathname.startsWith("/api/")) return

  // 静态资源：CacheFirst（不可变文件名）或 NetworkFirst（页面）
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetchAndCache(request)),
    )
    return
  }

  // 页面 / 工具 / 其他：NetworkFirst + 缓存
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request)),
  )
})

async function fetchAndCache(request) {
  const response = await fetch(request)
  if (response.ok) {
    caches.open(CACHE).then((cache) => cache.put(request, response.clone()))
  }
  return response
}
