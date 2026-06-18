"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Copy, Check, ChevronDown, FileSpreadsheet, FileJson, FileText, Table } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { ExportFormat, FastaLike } from "@/lib/bio/export"
import { copyText, downloadBlob, extFor, mimeFor, toDelimited, toFastaText, toMarkdownTable } from "@/lib/bio/export"

export interface ResultActionsProps<T = Record<string, unknown>> {
  rows: T[]
  headers?: string[]
  fasta?: FastaLike[]
  filename?: string
  hide?: ExportFormat[]
}

export function ResultActions<T>({
  rows,
  headers,
  fasta,
  filename = "biotools-export",
  hide = [],
}: ResultActionsProps<T>) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const hasRows = rows.length > 0
  const hasFasta = fasta && fasta.length > 0

  if (!hasRows && !hasFasta) return null

  const exportCsv = () => {
    const text = toDelimited(rows as Record<string, unknown>[], ",", { headers })
    downloadBlob(text, `${filename}.csv`, mimeFor("csv"))
  }
  const exportTsv = () => {
    const text = toDelimited(rows as Record<string, unknown>[], "\t", { headers })
    downloadBlob(text, `${filename}.tsv`, mimeFor("tsv"))
  }
  const exportJson = () => {
    const text = JSON.stringify(rows, null, 2)
    downloadBlob(text, `${filename}.json`, mimeFor("json"))
  }
  const exportFasta = () => {
    if (!hasFasta) return
    const text = toFastaText(fasta)
    downloadBlob(text, `${filename}.fasta`, mimeFor("fasta"))
  }
  const exportMarkdown = () => {
    const text = toMarkdownTable(rows as Record<string, unknown>[], headers)
    downloadBlob(text, `${filename}.md`, mimeFor("markdown"))
  }
  const copyTable = async () => {
    const text = toDelimited(rows as Record<string, unknown>[], "\t", { headers })
    try {
      await copyText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard failed — ignore
    }
  }

  const hidden = new Set(hide)

  return (
    <div className="flex items-center gap-2 pt-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="font-mono gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="font-mono text-xs">
          <DropdownMenuLabel>Export / 导出</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {hasRows && !hidden.has("csv") && (
            <DropdownMenuItem onClick={exportCsv}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
              CSV (.csv)
            </DropdownMenuItem>
          )}
          {hasRows && !hidden.has("tsv") && (
            <DropdownMenuItem onClick={exportTsv}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
              TSV (.tsv)
            </DropdownMenuItem>
          )}
          {hasRows && !hidden.has("json") && (
            <DropdownMenuItem onClick={exportJson}>
              <FileJson className="w-3.5 h-3.5 mr-2" />
              JSON (.json)
            </DropdownMenuItem>
          )}
          {hasRows && !hidden.has("markdown") && (
            <DropdownMenuItem onClick={exportMarkdown}>
              <Table className="w-3.5 h-3.5 mr-2" />
              Markdown (.md)
            </DropdownMenuItem>
          )}
          {hasFasta && !hidden.has("fasta") && (
            <DropdownMenuItem onClick={exportFasta}>
              <FileText className="w-3.5 h-3.5 mr-2" />
              FASTA (.fasta)
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {hasRows && (
            <DropdownMenuItem onClick={copyTable}>
              {copied ? (
                <Check className="w-3.5 h-3.5 mr-2 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-2" />
              )}
              {copied ? "Copied / 已复制" : "Copy TSV / 复制制表符"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
