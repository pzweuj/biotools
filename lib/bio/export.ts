// 通用导出工具：CSV / TSV / JSON / FASTA / Markdown 表格
// 全部纯函数；不触发网络；不依赖 React

export type ExportFormat = "csv" | "tsv" | "json" | "fasta" | "markdown"

export interface FastaLike {
  id: string
  description?: string
  sequence: string
}

/** 把对象数组转为 CSV / TSV 文本 */
export function toDelimited<T extends Record<string, unknown>>(
  rows: T[],
  delimiter: "," | "\t" = ",",
  options?: { headers?: string[] },
): string {
  if (rows.length === 0) return ""
  const headers = options?.headers ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
  const escape = (cell: unknown): string => {
    const s = cell == null ? "" : String(cell)
    // CSV 转义：含分隔符 / 引号 / 换行时用引号包，并把内部引号双写
    if (delimiter === "," && /[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    if (delimiter === "\t" && /[\t\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const head = headers.join(delimiter)
  const body = rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(delimiter)).join("\n")
  return `${head}\n${body}`
}

/** Markdown 表格 */
export function toMarkdownTable<T extends Record<string, unknown>>(
  rows: T[],
  headers?: string[],
): string {
  if (rows.length === 0) return ""
  const cols = headers ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
  const escape = (s: unknown): string => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ")
  const lines = [
    `| ${cols.map(escape).join(" | ")} |`,
    `| ${cols.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${cols.map((c) => escape((r as Record<string, unknown>)[c])).join(" | ")} |`),
  ]
  return lines.join("\n")
}

/** FASTA 文本 */
export function toFastaText(records: FastaLike[], wrap = 80): string {
  const out: string[] = []
  for (const r of records) {
    const head = r.description ? `>${r.id} ${r.description}` : `>${r.id || ""}`
    out.push(head)
    if (wrap > 0 && r.sequence.length > 0) {
      for (let i = 0; i < r.sequence.length; i += wrap) {
        out.push(r.sequence.slice(i, i + wrap))
      }
    } else {
      out.push(r.sequence)
    }
  }
  return out.join("\n")
}

/** 触发浏览器下载 */
export function downloadBlob(text: string, filename: string, mime = "text/plain;charset=utf-8") {
  if (typeof window === "undefined") return
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

/** 复制到剪贴板，失败时抛错供 caller 显示 toast */
export async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Fallback：旧浏览器
  const ta = document.createElement("textarea")
  ta.value = text
  ta.style.position = "fixed"
  ta.style.left = "-9999px"
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand("copy")
  } finally {
    document.body.removeChild(ta)
  }
}

/** MIME 推断 */
export function mimeFor(format: ExportFormat): string {
  switch (format) {
    case "csv": return "text/csv;charset=utf-8"
    case "tsv": return "text/tab-separated-values;charset=utf-8"
    case "json": return "application/json;charset=utf-8"
    case "fasta": return "text/plain;charset=utf-8"
    case "markdown": return "text/markdown;charset=utf-8"
  }
}

export function extFor(format: ExportFormat): string {
  switch (format) {
    case "csv": return "csv"
    case "tsv": return "tsv"
    case "json": return "json"
    case "fasta": return "fasta"
    case "markdown": return "md"
  }
}
