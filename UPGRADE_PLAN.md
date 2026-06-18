# BioTools 升级与优化计划

> 复盘对象：`biotools` v1.5.3 — Next.js 16 + React 19 + Tailwind v4 + Radix UI 的本地生信工具集（33 个工具组件 / 4 条代理 API）。
> 复盘日期：2026‑06‑18
> 核心原则：**保留"输入数据不出本地浏览器"的本地计算特性**。所有优化项都遵守这一红线 —— 本地 SDN/蛋白序列、引物、qPCR、TMB 等数据**必须**继续在浏览器内完成，不为了性能引入服务端计算。

---

## ✅ 已完成（2026‑06‑18）

下列工作已经直接落地到代码（37 个单元测试通过；TypeScript 严格模式通过；`pnpm build` 通过；41 个静态页面预渲染成功）：

### 决策变更
- **PageAgent 实验功能整体下线** — 用户决定该方向暂不推进。删除 `components/page-agent-plugin.tsx`、`app/api/agent/`、`page-agent` 依赖、相关 CSS 与 `<html>` 注入。这同时把"零服务端处理用户输入"做扎实，作为隐私叙事的硬保证。

### M1 安全闭环
- ✅ 删除 `/api/agent` 开放代理（与 PageAgent 一并下线）
- ✅ `header.tsx` GitHub 跳转加 `noopener,noreferrer`
- ✅ `vercel.json` 删除（headers 唯一来源 = `next.config.mjs`）
- ✅ CSP 收紧：默认 `default-src 'self'`，`connect-src` 不再放任意 `https:`，外部 API 全部经 `/api/*` 自代理
- ✅ 安全头：HSTS、Permissions-Policy（含 interest-cohort）、X-Content-Type-Options、X-Frame-Options、Referrer-Policy
- ✅ `@types/react`/`@types/react-dom` 升到 `^19`，移除 `typescript.ignoreBuildErrors`
- ✅ 生产构建剥离 `console.log/warn`（保留 `console.error`）
- ✅ 删除 `app/tools/[toolId]/tool-page-client.tsx`（死代码）
- ✅ 三条外部代理（mutalyzer / spliceai / transvar）：加 30s/60s `AbortSignal.timeout`、严格输入校验、输入长度上限、不回显上游错误体、显式拒绝错误 HTTP 方法（405）、超时返回 504、其他错误返回 502

### M2 打包瘦身 + SSR
- ✅ `lib/config/tools.meta.ts` ↔ `lib/config/tools.loaders.ts` 拆分；`tools.ts` 改为聚合层
- ✅ 33 个工具组件全部 `next/dynamic` 懒加载（每工具独立 chunk）
- ✅ `app/tools/[toolId]/page.tsx` 改回 server component + `generateStaticParams`（41 页全静态生成）+ `generateMetadata`（含 OG / Twitter card）
- ✅ `app/page.tsx` 中 `useMemo(getToolCategories)`
- ✅ `app/sitemap.ts` 改为从 `TOOL_IDS` 单一源派生

### M2 i18n + 主题
- ✅ `en` locale 改 `dynamic import`（中文用户首屏不再下载 ~60KB 英文字典）
- ✅ `<html lang>` 在切换语言时同步更新
- ✅ `next-themes` 真正接通 + `<ThemeToggle>` 加入 header
- ✅ `globals.css` 已有的 `.dark` 变量起作用
- ✅ 增加 `nav.toggleTheme`、`nav.localTool`、`nav.externalTool` 文案

### UX & 治理
- ✅ `app/error.tsx` 与 `app/tools/[toolId]/error.tsx` ErrorBoundary
- ✅ `app/tools/[toolId]/not-found.tsx` 双语
- ✅ 侧边栏：滚动写入节流（200ms）、按分类折叠（默认）/ 搜索时展开扁平、🌐 Online 徽章标识外部工具、搜索按 name + description + id 多字段匹配
- ✅ `lib/bio/`：`alphabet.ts` / `sequence.ts` / `tm.ts` / `codons.ts` 抽取共享生信工具函数（含完整 README）
- ✅ `vitest` + `vitest.config.ts` + 37 个单测覆盖 sequence/tm/codons
- ✅ `.github/workflows/ci.yml`：typecheck + test + build 三段 gate
- ✅ `package.json` 新增 `typecheck`、`test`、`test:watch`、`test:coverage` 脚本
- ✅ `app/layout.tsx`：完整 `metadata`（含 metadataBase、template、OG、Twitter、keywords）+ `viewport.themeColor`（响应系统暗色）+ 移除多余 `<head>` 内 `<link>`（已由 metadata.icons 输出）
- ✅ `public/site.webmanifest` 完整化（scope、categories、maskable icon）

### 验证（实测）
- `pnpm test` → **37/37 通过**（sequence 24、tm 7、codons 6）
- `pnpm typecheck` → **0 错误**（已剥离 `ignoreBuildErrors`，真正 strict）
- `pnpm build` → **成功**，41 个静态页面（含 34 个工具页 + home + sitemap + not-found + 4 路由）；总 chunks ~2.9 MB（未压缩），最大单 chunk 224 KB —— 工具组件已按 chunk 拆分，首屏不再加载未访问的工具

---

## 🚧 剩余待办（按建议顺序）

> 下列内容仍在原始计划中保留，但需要更大改动 / 需要决策。

### M3 — Web Worker + 算法准确性
- [ ] 把 `findRepeats` / `alignSequences` / `gcSkew` / `restriction-enzymes` 等重型算法搬入 `lib/workers/bio.worker.ts`
- [ ] 把 33 个 tool 组件中各自重复实现的 `reverseComplement` / `cleanSequence` / `parseFasta` 替换为 `@/lib/bio` 的实现（任务量大但可分批；可一边用一边迁移）
- [ ] `findRepeats` 修正子串重叠重复计数 bug
- [ ] `tm-calculator` 实现真正的 SantaLucia 1998 双链热力学（dinucleotide ΔH/ΔS 已经在 `primer-dimer-detector` 里抄一份就行）
- [ ] 给每个工具补 5+ 单测（NCBI / EBI 给定的"金标"序列）

### M4 — Service Worker（剩余部分）
- [ ] `pnpm add @serwist/next serwist`
- [ ] `app/sw.ts` 配置：precache 框架壳；运行时缓存 tool chunks（StaleWhileRevalidate）；外部 API 走 NetworkOnly
- [ ] `next.config.mjs` 用 `withSerwist` 包装
- [ ] header 加"离线就绪 ●"指示灯（监听 `navigator.serviceWorker.controller`）

### M5 — UX 大升级（剩余部分）
- [ ] 输入持久化（每个工具的输入自动写 sessionStorage，加"清空"按钮）
- [ ] 拖放上传 + `FileReader` 流式读
- [ ] 统一 `ResultActions` 组件（CSV / TSV / JSON / FASTA / Markdown copy）
- [ ] 每个工具的 "Try example" 按钮
- [ ] `Ctrl+K` 命令面板（`cmdk` 已经在 deps 中）
- [ ] 收藏夹 + 最近使用
- [ ] 分享链接（hash + LZ-string，不出网）

### M6 — 治理（剩余部分）
- [ ] Playwright E2E（5 个核心路径 + 移动端视口）
- [ ] Lighthouse-CI gate
- [ ] Issue / PR 模板 + CONTRIBUTING.md
- [ ] OG image 自动生成（`@vercel/og` 或 `next/og`）
- [ ] 评估删除 `react-day-picker`（无 calendar UI 在用）

---

## TL;DR — 优先级矩阵

| 等级 | 类目 | 关键项 | 收益 |
|---|---|---|---|
| 🔴 P0（高危/立即） | 安全 | `/api/agent` 是开放 SSRF 代理 | 阻断关键安全漏洞 |
| 🔴 P0 | 安全 | TS 编译错误被 `ignoreBuildErrors` 静默 | 阻断隐藏 Bug |
| 🟠 P1（性能/UX 关键） | 打包 | 33 个工具组件被全量打入首屏 bundle | 首屏 JS 体积 ‑60%+ |
| 🟠 P1 | 计算 | 重型算法跑在主线程，长输入会卡死 UI | 大序列可用性 |
| 🟠 P1 | 离线 | 没有 Service Worker，"本地计算"工具仍需联网 | 离线可用 / PWA |
| 🟡 P2（体验显著） | UX | 输入不持久 / 无示例 / 无分享 / 无导出 | 重度用户留存 |
| 🟡 P2 | i18n | `<html lang>` 不更新；服务端默认中文造成首屏闪烁 | SEO + 可访问性 |
| 🟢 P3（治理） | 维护 | 无测试、生信工具函数代码重复、sitemap 手维护 | 长期可演化性 |

---

## 1. 安全漏洞（按严重度）

### 1.1 🔴 `/api/agent/route.ts` — 任意 URL 转发 + 开放代理（SSRF）

```ts
// app/api/agent/route.ts
const { baseURL, apiKey, model, messages } = body
const response = await fetch(`${baseURL}/chat/completions`, ...)
```

**问题**：
- `baseURL` 完全由前端传入，**没有 allowlist、没有协议校验、没有 host 黑名单**。
- 攻击者可通过你的 Vercel Function 访问内网（`http://169.254.169.254/latest/meta-data/` 取云厂商凭据、`http://localhost`、`http://10.x.x.x`）。
- 可被滥用为面向第三方的"匿名代理"——账单、滥用风险都落到部署者头上。
- 没有 `AbortSignal` 超时；无并发/速率限制；错误信息原文回显（信息泄漏）。
- 用户的 LLM API Key 被服务端转发，且日志可能落盘。

**修复方案**（保持 PageAgent 功能，但收紧）：
1. 引入 **provider allowlist**（`dashscope.aliyuncs.com`、`api.openai.com`、`api.anthropic.com`、`api.deepseek.com`、`generativelanguage.googleapis.com` 等用户常用），其余拒绝。
2. URL 解析后强制：`url.protocol === 'https:'` 且 `!isPrivateIP(url.hostname)`（用 `node:dns` 解析后比对 RFC1918 / 链路本地 / loopback）。
3. `fetch(..., { signal: AbortSignal.timeout(30_000) })`。
4. 边缘速率限制（Vercel KV + sliding window，10 req / IP / min）。
5. 不要把 `error.message` 透给前端 —— 仅返回稳定错误码。
6. **更彻底的方案**：把 LLM 请求改成"前端直连"——`PageAgent` 本来就在客户端运行，把 baseURL/Key/Model 直接交给 PageAgent SDK 即可，删掉这条 API。这同时把"密钥不落本服务"做扎实。**强烈推荐**。

### 1.2 🟠 其他三条代理路由（mutalyzer / spliceai / transvar）
- 无超时 → 应加 `AbortSignal.timeout`（30 s）。
- 无 IP 速率限制 → DoS 风险。可借边缘 KV 实现 token bucket。
- `spliceai` 把上游错误体 `details: errorText` 直接转出 → 可能泄漏上游栈信息。
- 仅接受 `GET`，但没拒绝其他方法 → 增加 `export const runtime = 'edge'` 与 method guard。
- 应在响应上加 `Vary: Accept-Encoding` 并复用 `revalidate`，避免缓存爆炸。

### 1.3 🟠 CSP 不一致 + 较松
- `next.config.mjs` 只设了 `connect-src 'self' https: wss:`（其它指令缺失）。
- `vercel.json` 设了 `script-src 'self' 'unsafe-eval' 'unsafe-inline'`。
- 两份 header 同时下发会被浏览器合并取**交集**，可能让 `connect-src` 变成两份策略中更严的那个，行为不可预期。
- **`'unsafe-eval'`** 给 Next.js dev 用 — 生产应去掉（Next 16 已支持 nonce）。
- 修复：**单一来源** — 只在 `next.config.mjs` 用 `headers()`（Vercel 会按它生效），删除 `vercel.json` 中重复 header；生产改用 `nonce`/`strict-dynamic`，去掉 `'unsafe-inline'` `'unsafe-eval'`。

### 1.4 🟠 反向标签劫持（Tabnabbing）
- `components/header.tsx:34` `window.open(url, '_blank')` 缺 `noopener,noreferrer`（其它工具都已修复，唯独 GitHub 按钮没修）。
- 一行修复：`window.open(url, '_blank', 'noopener,noreferrer')` 或换成 `<a target="_blank" rel="noopener noreferrer">`。

### 1.5 🟠 TypeScript 编译错误被吞
```js
typescript: { ignoreBuildErrors: true }
```
- `package.json` 中 `react: "^19"` 但 `@types/react: "^18"` —— 这是**根因**：升级 React 19 后类型定义没跟上，开发者用 `ignoreBuildErrors` 绕过。
- 风险：真实类型错误（包括 props 形状错配、API 签名变更）静默通过。
- 修复：升 `@types/react: "^19"` 与 `@types/react-dom: "^19"`，然后**移除 `ignoreBuildErrors`**。CI 加 `tsc --noEmit` gate。

### 1.6 🟡 PageAgent 凭据暴露面
- 用户的 LLM `apiKey` 用 `localStorage.setItem('page-agent-config', JSON.stringify(config))` 明文存储。
- 任何 XSS（CSP 一旦放宽就有风险）就能被读取。
- 缓解：
  - 在设置页面**明确告知**"此密钥仅保存在本浏览器"。
  - 提供"会话级仅保存"开关（仅 sessionStorage，关闭标签即丢）。
  - 严格 CSP（见 1.3）使 XSS 注入难度上升。

### 1.7 🟡 输入未做长度上限
- 大量工具如 `sequence-stats`、`primer-dimer-detector`、`sequence-translation-orf`、`gc-skew-analyzer` 没限制输入长度。粘贴 50 MB FASTA 或恶意构造的高熵序列会让浏览器卡死或 OOM —— 用户体感像"网站崩了"。
- `index-checker` 已有 `MAX_INDICES = 200`，**模式可推广**。
- 修复：每个工具组件统一从 `lib/bio/limits.ts` 读取阈值并在 UI 顶部显示"限制 X bp，超过将分段处理"。

### 1.8 🟢 `recharts` 内部使用 `dangerouslySetInnerHTML`
- `components/ui/chart.tsx:83` —— 这是 shadcn 的实现，输入是受控的 CSS 字符串，**无 XSS 风险**。但生成的内联 `<style>` 块每次渲染都重排，可在 chart 多实例时引入小幅性能损失。

---

## 2. 性能瓶颈

### 2.1 🔴 全量工具被打进首屏 bundle（最大 win）
**问题**：
- `lib/config/tools.ts` 静态 `import` 了 33 个 `Tool*` 组件 + 30+ 个图标组件。
- `app/page.tsx` 是 `"use client"` 并调用 `getToolCategories()` —— 等价于"打开首页就把所有工具的 JS 都下载完"。
- 估算：33 个工具组件，平均 18 KB/个 → **未压缩 ~600 KB**，再叠加 Radix（30+ 包）、recharts、react-day-picker、page-agent —— 首屏可能 1.5–2 MB JS。
- 用户大多数情况只会用 1‑2 个工具，浪费 95%+ 的下载量。

**升级方案**（不破坏本地计算）：
1. **每个工具改用 `next/dynamic` 懒加载**：
   ```ts
   // lib/config/tools.ts
   import dynamic from 'next/dynamic'
   const SequenceStats = dynamic(() => import('@/components/tools/sequence-stats')
     .then(m => m.SequenceStats), { ssr: false, loading: () => <ToolSkeleton /> })
   ```
   工具切换时按需拉取该 chunk —— 单工具仍是浏览器本地运行，不损失"本地计算"特性。
2. **路由改用 server component**：
   ```ts
   // app/tools/[toolId]/page.tsx — 服务端解析 toolId、注入 metadata、static-params 全量预渲染
   export const dynamicParams = false
   export async function generateStaticParams() { return TOOL_IDS.map(id => ({ toolId: id })) }
   export async function generateMetadata({ params }) { ... }
   ```
   首页 HTML 直接把工具壳渲染好，client component 只负责交互，TTFB / SEO 双赢。
3. **把"工具元数据"和"工具组件"拆成两份配置**：
   ```ts
   // lib/config/tools.meta.ts —— 纯数据，<3 KB
   export const TOOLS_META = [{ id, nameKey, category, iconName, descriptionKey }, ...]
   // lib/config/tools.loaders.ts —— 仅在 [toolId]/page.tsx 内被引入
   export const TOOL_LOADERS: Record<string, () => Promise<ComponentType>> = { ... }
   ```
   sidebar、sitemap、首页只依赖 `TOOLS_META`。

**预估收益**：首屏 JS 体积下降 60–80%，LCP 在 4G 下从 ~3‑4 s 降到 ~1 s。

### 2.2 🟠 重型算法在主线程上运行
| 工具 | 算法 | 复杂度 | 阻塞风险 |
|---|---|---|---|
| `sequence-stats.findRepeats` | 双重循环 + 子串匹配 | **O(n² × maxLen)** | 长序列卡死 |
| `sequence-stats.calculateComplexity` | 每碱基 `match(new RegExp)` | O(4n) + 4 次正则编译 | 频繁 GC |
| `primer-dimer-detector.findBestAlignment` | 全位置对齐 | O(n×m) | 多对引物时慢 |
| `gc-skew-analyzer` | 滑动窗口 | O(n) | 长基因组（≥10 Mb）UI 卡 |
| `sgrna-designer` | 全序列扫描 + Tm 评估 | O(n) × 评估开销 | 中等 |
| `sequence-translation-orf` | 6 框翻译 + ORF 搜索 | O(n) | 长 cDNA 慢 |
| `restriction-enzymes-tool` | 多酶 × 全序列 KMP/朴素匹配 | O(n × E) | 数百酶时显著 |

**升级方案**（三选一组合）：
1. **Web Worker** —— 新建 `lib/workers/bio.worker.ts`，把 `findRepeats`、`alignSequences`、`gcSkew` 等纯函数搬进去：
   ```ts
   const worker = useMemo(() => new Worker(new URL('@/lib/workers/bio.worker.ts', import.meta.url)), [])
   const result = await new Promise(res => { worker.postMessage(seq); worker.onmessage = e => res(e.data) })
   ```
   主线程永远不卡，可显示进度条。**Worker 仍跑在用户浏览器，本地计算特性不变。**
2. **`useTransition` / `useDeferredValue`** —— 适合中等复杂度（< 200 ms），让 React 19 把计算调度到空闲帧。
3. **算法层面优化**（不依赖 Worker）：
   - `findRepeats`：改后缀数组 / 后缀自动机（O(n log n) 找极大重复）；当前实现只能扫到长度 ≤ 20 的子串，且**有正确性问题** —— 子串重叠时计数会重复。
   - `calculateComplexity`：单次扫描计数 + Shannon，避免 4 次正则。
   - `restriction-enzymes`：把酶序列编入一个 Aho‑Corasick 自动机，O(n + m) 单次扫描。
   - `findBestAlignment`：在尝试所有 (i, j) 之前用 k‑mer 索引剪枝。

### 2.3 🟠 缺乏 Service Worker / PWA
**问题**：
- 30+ 工具的核心是"本地计算"，但用户每次访问仍需联网下载 HTML+JS。地铁、实验室断网情境下完全不可用 —— 与"本地计算"叙事矛盾。
- 没有 manifest（layout.tsx 里 `manifest: "/site.webmanifest"` 但 `public/` 中**没有该文件**）—— 浏览器 console 会一直报 404。

**升级方案**：
1. 用 `@serwist/next`（Next 16 已经支持）生成 SW：
   - `precache` 框架壳 + 图标 + 主 CSS。
   - `runtimeCaching`：工具 chunk 走 `StaleWhileRevalidate`（更新无感）；外部 API 代理（mutalyzer/spliceai/transvar）走 `NetworkOnly`（避免缓存可变结果）。
2. 提供 `public/site.webmanifest`：
   ```json
   { "name": "BioTools", "short_name": "BioTools",
     "start_url": "/", "display": "standalone",
     "background_color": "#ffffff", "theme_color": "#000000",
     "icons": [...] }
   ```
3. 显示"可离线"徽章 —— 当 `navigator.serviceWorker.controller` 已注册时，header 显示绿色 ● 离线就绪。
4. 列表里把工具分成**🟢 完全本地** / **🌐 需联网（external-tools 分类）**，让用户对隐私边界一目了然。

### 2.4 🟡 i18n locale 文件全量打进 JS
- `lib/i18n/locales/zh.ts`（56 KB）+ `en.ts`（59 KB）都被 `import` 进上下文，约 **115 KB 未压缩**，无论用户用哪种语言都被下载。
- 修复：`I18nProvider` 在 `useEffect` 中按语言异步 `import()` 当前 locale；首屏渲染走 `<html lang>` 推断的语言，避免闪烁。
- 进一步：把 i18n key 改成"按工具拆分"——每个工具自带 `i18n.zh.json` / `i18n.en.json`，与工具一起被 dynamic import，节省下另外一半。

### 2.5 🟡 `getToolCategories()` 在首页未 memo
```ts
// app/page.tsx
export default function HomePage() {
  const toolCategories = getToolCategories()  // ❌ 每次渲染都重建一个新引用
}
```
- 与 `app/tools/[toolId]/page.tsx` 的 `useState(() => getToolCategories())` **行为不一致** ——前者每次渲染都 build，重建图标/组件引用，子组件 props 变更触发不必要重渲。
- 修复：要么提到组件外（直接 `const toolCategories = getToolCategories()` 模块级单例），要么 `useMemo`。

### 2.6 🟡 `notFound()` 在客户端组件中调用
- `app/tools/[toolId]/tool-page-client.tsx` 标了 `"use client"` 却调用 `notFound()`。Next 16 中 `notFound()` 在客户端组件中只在 build 时正确，运行时 ToolID 不匹配会报"notFound() is not supported in client components"。
- 此外 `tool-page-client.tsx` 文件**根本没被任何地方导入** —— 是死代码，应直接删掉，并把 `[toolId]/page.tsx` 改回服务端组件 + `generateStaticParams`。

### 2.7 🟢 滚动事件未节流
- `tool-sidebar.tsx` `handleScroll` 每像素都写 `sessionStorage`，约 60 fps 时是 ~60 次/秒 IO。
- 修复：用 `requestIdleCallback` 或简单的 `setTimeout` 节流到 200 ms。

### 2.8 🟢 `images: { unoptimized: true }` + 自维护 favicon
- 关闭了 Next/Image 优化。如果未来加截图、示意图，会损失 AVIF/WebP / 响应式。
- 当前没图片资产，影响不大；保留，但加图片时要打开。

### 2.9 🟢 `react-day-picker` 看似未使用
- 工具里没有日期选择 UI（grep 也没命中），但仍在 dependency 中（约 100 KB）。
- 验证后从 `package.json` 删除，运行 `pnpm prune`。

### 2.10 🟢 `recharts` 仅 `standard-curve-fitting` / `gc-skew-analyzer` 等少数工具用
- recharts ≈ 250 KB gzip，应只在用到的 chunk 内 dynamic import：
  ```ts
  const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
  ```

---

## 3. 用户体验（UX）改进

### 3.1 输入与状态持久化
- **痛点**：粘贴 50 KB 序列、调好参数、误关标签 → 全没了。
- **升级**：每个工具的输入用 `useDebouncedSync` 自动写入 `sessionStorage[`tool:${id}`]`，加"清空"按钮。**纯本地，不上传。**
- 进一步：每个工具支持"分享链接" —— 把输入做 LZ-string 压缩 + base64url 写入 hash（`#data=xxx`），不发服务器，仍是本地。
  ```ts
  // 引物示例
  https://use.biotools.site/tools/tm-calculator#d=AGCT...&m=santa-lucia&s=50
  ```

### 3.2 文件上传 + 拖放
- 没有任何工具支持拖放 FASTA/FASTQ 文件。把"粘贴"和"上传"并列：
  ```tsx
  <DropZone onFile={async f => setSequences(await f.text())} accept=".fa,.fasta,.fq,.txt" />
  ```
- 大文件用 `FileReader` 流式读，避免一次性 `text()` 把 100 MB 全塞内存。

### 3.3 结果导出
- 33 个工具中**绝大多数没有"导出"按钮**。统一抽象 `<ResultActions data={results} formats={['csv','tsv','json','fasta']} />`：
  - CSV/TSV 用 `Blob` + `URL.createObjectURL` 触发下载。
  - 序列结果加 FASTA 导出。
  - 表格结果加"复制为 Markdown 表格"。

### 3.4 示例数据（onboarding 体验大幅提升）
- 每个工具放一个 "Try example" 按钮：粘贴一段典型输入（≤ 1 KB）。降低首次使用门槛 70%。
- i18n 化：示例本身可保持英文 DNA 序列（生信通用）。

### 3.5 计算反馈
- `tm-calculator`、`primer-dimer-detector` 等没有 loading 状态，按下按钮像没反应。
- 引入统一 `<RunButton state="idle|computing|success|error">`，带进度条；Worker 化后能显示真实百分比。
- 错误用 toast（`sonner` 已在 deps）替代静默 `return`。

### 3.6 收藏夹与最近使用
- 33 个工具铺平在 sidebar，找一个工具要滚很久。
- 添加：
  - ⭐ 收藏（`localStorage`）。
  - 最近 5 个使用过的工具，置顶。
  - 命令面板（已经装了 `cmdk`） —— `Ctrl+K` 弹出全局搜索 + 快捷跳转：
    ```
    > tm           → Tm Calculator
    > prim dim     → Primer Dimer Detector
    > / sequence   → 跳转分类
    ```
- Sidebar 搜索目前**只匹配 `nameKey` 翻译后字符串**，描述、别名（如 NEB→restriction enzymes）都搜不到 → 加权多字段搜索（轻量 fuzzy，比如 minisearch 仅 6 KB）。

### 3.7 暗黑模式真正接入
- `components/theme-provider.tsx` **导出了** `ThemeProvider`，但 `components/providers.tsx` **从未引用**它，CSS 里也定义了 `.dark` 变量但没人加 class。
- 修复：
  ```tsx
  // providers.tsx
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <I18nProvider>{children}</I18nProvider>
  </ThemeProvider>
  ```
- Header 加 `<ThemeToggle />`（lucide 已有 Sun/Moon 图标）。

### 3.8 i18n 一致性 / 可访问性
- `app/layout.tsx` 写死 `<html lang="zh-CN">`，但用户切到 EN 后 lang 不更新 —— 屏幕阅读器仍当成中文读。
- `not-found.tsx` 文案纯中文硬编码。
- PageAgent 错误消息混杂中英（`错误: ${...}`）—— 切到 EN 后仍出中文。
- 修复：
  ```tsx
  // 在 I18nProvider 里 useEffect 同步：
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  ```
- 把 locale 状态首屏也通过 cookie 传给 server component，避免水合后再切语言造成的闪烁；或在 cookie 缺失时用 `Accept-Language` 协商。

### 3.9 移动端体验
- 当前 sidebar 在移动端用 fixed + overlay，逻辑工作；但展开时**没有锁定 body 滚动**——浏览器地址栏与底部双滚动条体验差。
- 触摸提示是一个"小竖条 pulse"，不直观；应换成抽屉手柄（grip handle）+ 边缘滑动手势（可用 `vaul`，已是 deps）。
- 缩小屏宽时分类按钮换行高度计算错位，需要 RWD 验证。

### 3.10 错误边界
- 整个 app 没有 ErrorBoundary。任何一个工具的渲染异常会让全屏白屏。
- Next 16 中加 `app/tools/[toolId]/error.tsx` 与 `app/error.tsx`：
  ```tsx
  'use client'
  export default function Error({ error, reset }) {
    return <div>... <button onClick={reset}>Retry</button></div>
  }
  ```

### 3.11 分类与卡片布局
- 当前侧栏完全扁平化（按钮列表），用户不知道分类边界（`getToolCategories()` 把分类信息传进了 sidebar，但 sidebar 没用 —— `allTools = categories.flatMap(...)` 把分类丢了）。
- 修复：sidebar 默认按分类折叠组（`@radix-ui/react-collapsible` 已装），搜索时再扁平化展开。

### 3.12 PageAgent 集成质量
- 当前实现"强行隐藏内置 panel"靠 `setTimeout` + DOM 查询 + `display: none` —— 脆弱。如果 page-agent 升级 / 类名变更立刻坏。
- 替代：fork 或建议 page-agent 提供 `headless: true` 选项；或者 condition 渲染（"显示原生 panel"开关）。
- 历史观察事件 `historychange` 里直接 `addMessage` 并用 `Date.now().toString()` 做 id —— 同毫秒多事件 id 撞车 → 用 `crypto.randomUUID()`。

---

## 4. 工具计算正确性 / 算法层面

> 抽样审查发现的"信任风险"，建议在 P1 阶段补单测后逐项核对。

| 工具 | 风险 | 建议 |
|---|---|---|
| `sequence-stats.findRepeats` | 子串重叠计数会重复计算（"AAAA" 中长度 3 重复扫到 2 次） | 改为不重叠出现次数 / 后缀数组 |
| `sequence-stats.calculateComplexity` | 仅基于单碱基熵，遇到 N 等模糊碱基算不进 | 显式声明算法（Shannon），或加 K‑mer 复杂度 |
| `tm-calculator.santa-lucia` | 实际是"salt-adjusted + 经验修正"伪 SantaLucia | 实现真正的近邻模型（已经有 dinucleotide ΔH/ΔS 表，在 `primer-dimer-detector`） |
| `tm-calculator` | 不区分单链 / 双链 / 探针；`saltConc` 单位混用（mM 还是 M？UI 没说） | 显式标注单位 + 提供 [Mg²⁺]、dNTP、引物浓度参数 |
| `primer-dimer-detector.findBestAlignment` | 仅穷举起点，不允许 gap | 文档化"只检测无空位互补"，或换 Smith‑Waterman |
| `restriction-enzymes-tool` | 朴素子串匹配，简并碱基（R/Y/N）处理需要核对 | 用 IUPAC 模式正则，或自动机 |
| `qpcr-data-analyzer` | ΔΔCt 公式假设效率 100% | 暴露效率参数 |
| `tmb-calculator` | 输入 VCF 解析未见严格校验 | 引入 `vcf-parser` 或基于 schema 的解析 |
| `gc-skew-analyzer` | 滑窗大小对结果敏感 | 默认值 + 解释文案 |
| `sequencing-depth-calculator` | 基于 Lander‑Waterman 假设 | 文档化前提（无重复、均匀） |

**结论**：建议把每个算法的"参考文献 + 假设条件 + 单元测试用例（含已知答案）"沉到 `lib/bio/<algo>/README.md` + `__tests__`。这是一个生信工具站的**信任基石**。

---

## 5. 可维护性

### 5.1 抽象出 `lib/bio/` 共享层
当前重复实现的工具函数（在多个 tools 文件里各写一遍）：

| 函数 | 出现位置（节选） |
|---|---|
| `reverseComplement` | `index-checker.tsx`, `primer-dimer-detector.tsx`, `sequence-translation-orf.tsx`, `restriction-enzymes-tool.tsx`, `sgrna-designer.tsx`... |
| `cleanSequence`（去非法字符 / 转大写） | 几乎所有序列工具 |
| `gcContent`、`atContent` | 重复 ≥ 5 次 |
| `parseFasta` / 多序列分割 | `sequence-stats`, `sequence-format-converter`, `protein-analysis-tool` 各写一份 |
| `hammingDistance` | `index-checker`, `primer-dimer` 类似逻辑 |
| `IUPAC 互补表` | 散落在 4+ 文件 |

**重构方案**：
```
lib/bio/
  ├── alphabet.ts        // IUPAC 表、互补
  ├── sequence.ts        // clean / reverseComplement / gcContent / parseFasta
  ├── tm.ts              // SantaLucia / Wallace 等
  ├── codons.ts          // 遗传密码表（多份）
  ├── alignment.ts       // SW / NW / k-mer
  ├── enzymes.ts         // REBASE 子集 + Aho-Corasick
  └── __tests__/         // vitest，每个函数 ≥ 5 个用例
```
+ 把这些纯函数搬进 Web Worker 时，只 `import { ... } from '@/lib/bio'` 就能复用。

### 5.2 测试基础设施缺失
- 一个测试都没有。生信算法靠 user 反馈 = 慢且痛。
- 引入 `vitest` + `@testing-library/react`：
  - 单测：`lib/bio/*` 用 NCBI / EBI 给定的标准例子核对（如 wallace Tm 验证）。
  - 组件测：每个工具的 happy path（粘贴示例 → 点 Run → 校验输出包含关键字段）。
  - E2E：`playwright`，跑 5 个核心路径 + 移动端视口截图。
- CI：GitHub Actions 三个 job —— `tsc`、`vitest`、`playwright`。**移除 `ignoreBuildErrors`** 后 tsc 是关键守门员。

### 5.3 工具元数据自动生成 sitemap
- `app/sitemap.ts` 中的 `toolIds` 是手维护，与 `lib/config/tools.ts` 已经有偏差风险（实际工具 33+ 而 sitemap 只列了 24）。
- 修复：`generateMetadata` / `sitemap` 都从 `TOOLS_META` 单一源派生：
  ```ts
  import { TOOLS_META } from '@/lib/config/tools.meta'
  export default function sitemap() {
    return [{...home}, ...TOOLS_META.map(t => ({ url: `${BASE}/tools/${t.id}`, ... }))]
  }
  ```
- 同时为每个工具自动生成 `robots`/`OpenGraph`/`twitter:card`，URL 直接分享到群/社区时有缩略图。

### 5.4 严格 lint + format
- 仓库有 `lint` 脚本但没 prettier 配置 / `eslint.config.mjs` —— 实际能跑出多少规则未知。
- 建议接 `@next/eslint-plugin-next`、`eslint-plugin-react-hooks/recommended`、`eslint-plugin-jsx-a11y`、`eslint-plugin-import`，并在 PR 上 gate。

### 5.5 控制台日志
- 14 处 `console.log/error/warn` 散在生产构建中。`next.config` 里加：
  ```js
  compiler: { removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false }
  ```

### 5.6 死代码与配置漂移
- `app/tools/[toolId]/tool-page-client.tsx` 完全未使用（见 2.6） — 删除。
- `theme-provider.tsx` 已写但未挂载（见 3.7）— 接上或删除。
- `manifest: "/site.webmanifest"` 引用文件不存在 — 添加或移除。
- `next.config.mjs` 与 `vercel.json` 双 header（见 1.3）— 单一来源。

---

## 6. 隐私 / "本地计算"叙事一致性

> 这是项目核心卖点，需要在产品层面做强。

1. **明确分类徽章**：sidebar 上为"完全本地"和"需要联网"工具加显式徽章（🔒 Local / 🌐 External）。当前 external-tools 分类下的 6 个工具默认会触发外部 API，但没有 UI 警告。
2. **External 工具的"先确认再调用"**：`mutalyzer`、`spliceai`、`transvar` 等首次调用前弹一次确认弹窗，明示"输入将发送至 mutalyzer.nl"。
3. **`@vercel/analytics`**：会记录页面访问与 Web Vitals。若希望维持"完全本地"叙事，可：
   - 在 README 明确披露使用 Vercel Analytics（不收集输入数据）；或
   - 替换为可自部署的 Plausible / Umami；或
   - 加"匿名遥测"开关。
4. **README 增加 Privacy 章节**：清晰列出哪些工具完全本地、哪些会出网、外部 API 的隐私政策链接。
5. **Open the proxy?**：把 `/api/agent` 删掉后（见 1.1），README 可以宣称"零服务端代码处理用户输入" —— 这是非常有力的宣传点。

---

## 7. 推荐落地路线图

> 按价值/成本排序的 6 个 milestone，每个 1‑2 周可完成。

### M1 — 安全闭环（P0，1 周）
- 删除/改造 `/api/agent`（前端直连 LLM，干掉 SSRF）
- 修复 CSP 双源 + 收紧 `script-src`
- 修复 header.tsx tabnabbing
- 升级 `@types/react` → `^19`，移除 `ignoreBuildErrors`
- 删除死代码（`tool-page-client.tsx`、过期 manifest 引用）

### M2 — 打包瘦身（P1，1 周）
- `tools.meta.ts` / `tools.loaders.ts` 拆分
- 每个工具 `next/dynamic`
- `[toolId]/page.tsx` 改 server component + `generateStaticParams` + per-tool `generateMetadata`
- locale 按需 import
- 从 deps 删 `react-day-picker`（验证后）

**Exit Criteria**：首屏 JS gzip < 200 KB；Lighthouse Mobile Performance > 90。

### M3 — Web Worker + 算法准确性（P1，2 周）
- 抽出 `lib/bio/`，集中 reverseComplement / parseFasta / Tm / alignment
- `vitest` 单测覆盖核心算法（NCBI 黄金例）
- 把 `findRepeats`、`alignSequences`、`gcSkew` 搬进 worker
- 重写 `findRepeats` 为 suffix array 实现，修正子串重叠计数 bug
- 修正 `tm-calculator` SantaLucia 实现

### M4 — PWA / 离线 / Offline 标识（P1，1 周）
- 接入 `@serwist/next`
- 创建 `site.webmanifest` + maskable 图标
- Header 加"离线就绪"指示灯
- Sidebar 工具分类加 🔒 Local / 🌐 External 徽章

### M5 — UX 大升级（P2，2 周）
- 输入持久化（sessionStorage）+ 分享链接（hash + LZ-string）
- 拖放上传 + 大文件流式读取
- 统一 `ResultActions`（CSV/TSV/JSON/FASTA/Markdown copy）
- 每个工具放置 "Try example" 按钮
- 命令面板（`Ctrl+K`）
- 收藏 + 最近使用
- ThemeProvider 接通 + 暗黑模式切换

### M6 — 治理（P3，长期）
- CI（tsc + vitest + playwright + lighthouse-ci）
- ErrorBoundary
- 自动 sitemap / OG image
- 文档化每个算法的假设与参考文献
- Issue/PR 模板 + CONTRIBUTING.md

---

## 8. 量化目标（DoD）

| 指标 | 现状（估算） | 目标 |
|---|---|---|
| 首屏 JS gzip | ~600 KB+ | **< 200 KB** |
| LCP（4G mobile） | ~3.5 s | **< 1.5 s** |
| TBT | ~600 ms | **< 200 ms** |
| Lighthouse Performance | ~65 | **> 90** |
| Lighthouse Accessibility | ~85 | **> 95** |
| Lighthouse Best Practices | ~85 | **100** |
| 安全 header（securityheaders.com） | ~B | **A** |
| 单测覆盖（lib/bio） | 0% | **> 80%** |
| 离线可用工具数 | 0 | **27 个本地工具** |
| Bundle 中独立 chunks | 1 个巨型 | **每工具 1 个 chunk** |

---

## 9. 不做什么（明确取舍）

为了保持"本地计算"和工具站的精简定位，**以下方向暂不引入**：

- ❌ 服务端运行用户算法（不做"上传 FASTA 后端跑 BLAST"）
- ❌ 用户账号 / 云存储 —— 会破坏隐私叙事，且无明显需求
- ❌ AI 直接重写用户序列（PageAgent 仅做 UI 助手，不在云端处理输入）
- ❌ 依赖重型 Python 后端（Biopython、samtools）—— 改用 WASM（如 `pyodide` 仅在用户主动选择"高级模式"时按需加载，仍是本地）
- ❌ 大型可视化（IGV-like genome browser）—— 留给专门的工具

---

## 10. 附录 A：关键文件改动清单

| 文件 | 动作 |
|---|---|
| `app/api/agent/route.ts` | **删除**或加 allowlist + 私网拦截 + 超时 + 速率限制 |
| `app/api/{mutalyzer,spliceai,transvar}/route.ts` | 加 timeout / rate limit / method guard |
| `next.config.mjs` | 移除 `ignoreBuildErrors`；统一 CSP；可选 `removeConsole` |
| `vercel.json` | 删除（与 next.config 重复） |
| `package.json` | `@types/react` → `^19`；评估删除 `react-day-picker` |
| `lib/config/tools.ts` | 拆分为 `tools.meta.ts` + `tools.loaders.ts`（dynamic） |
| `app/page.tsx` | 改 server component；首屏不携带工具组件 |
| `app/tools/[toolId]/page.tsx` | server component + `generateStaticParams` + metadata |
| `app/tools/[toolId]/tool-page-client.tsx` | **删除**（死代码） |
| `app/tools/[toolId]/not-found.tsx` | i18n 化 |
| `app/sitemap.ts` | 改为从 `TOOLS_META` 派生 |
| `components/providers.tsx` | 接 `ThemeProvider` |
| `components/header.tsx` | 修 `_blank` 缺失 rel；加 ThemeToggle |
| `components/page-agent-plugin.tsx` | 改为客户端直连 LLM；id 用 `crypto.randomUUID()` |
| `components/tool-sidebar.tsx` | 节流 scroll；分类折叠；fuzzy 搜索 |
| `lib/i18n/context.tsx` | 异步加载 locale；同步 `<html lang>` |
| `lib/bio/*` | **新建** —— 抽取所有共享算法 |
| `lib/workers/bio.worker.ts` | **新建** —— 重型计算 |
| `public/site.webmanifest` | **新建** |
| `public/sw.js` / serwist 配置 | **新建** |
| `__tests__/**`、`vitest.config.ts` | **新建** |
| `.github/workflows/ci.yml` | **新建** |

---

## 11. 附录 B：可立即合并的小修复（一两行级别）

```diff
// components/header.tsx
- onClick={() => window.open('https://github.com/pzweuj/biotools', '_blank')}
+ onClick={() => window.open('https://github.com/pzweuj/biotools', '_blank', 'noopener,noreferrer')}
```

```diff
// app/page.tsx
-  const toolCategories = getToolCategories()
+  const toolCategories = useMemo(() => getToolCategories(), [])
```

```diff
// next.config.mjs
- typescript: { ignoreBuildErrors: true },
+ // typescript errors should fail the build
```

```diff
// package.json
- "@types/react": "^18",
- "@types/react-dom": "^18",
+ "@types/react": "^19",
+ "@types/react-dom": "^19",
```

```diff
// components/page-agent-plugin.tsx
- id: Date.now().toString(),
+ id: crypto.randomUUID(),
```

---

**结语**：BioTools 现在是一个工具齐全、UI 风格清晰的好底子，但**性能（首屏全量打包）** 与**安全（开放代理）** 是两个会"突然爆炸"的隐患。建议先用 1‑2 周把 M1+M2 落地（投入产出比最高），再按节奏推进算法层与 PWA。所有优化都不需要把用户输入送上服务器 —— 反而能让"本地计算"这一卖点更纯粹、更可信。
