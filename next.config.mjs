/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

// 生产环境 CSP：仅允许必要的来源
// - script-src 仍需 'unsafe-inline' 以兼容 Next.js 注入的 hydration script；后续可改 nonce
// - connect-src 'self' 已足够：所有外部 API（mutalyzer / spliceai / transvar）都走 /api/* 代理
//   Vercel Analytics 走 va.vercel-scripts.com / vitals.vercel-insights.com
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live wss://vercel.live",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Content-Security-Policy', value: csp },
]

const nextConfig = {
  // TypeScript / ESLint 错误必须阻断构建（CI gate）
  // 如确需绕过，请在本地修复后再合并
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // 当前没有动态图片资产，保留 unoptimized 以便静态部署
    // 后续如引入截图请把它打开
    unoptimized: true,
  },
  compiler: {
    // 生产构建剥离 console.* 调用，但保留 console.error 用于异常追踪
    removeConsole: isProd ? { exclude: ['error'] } : false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
