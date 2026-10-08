"use client"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent, ToolSection } from "@/components/tool-page"

import { Fragment, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Check, Download } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { copyText, downloadBlob } from "@/lib/bio"
import { useToolStorage } from "@/hooks/use-tool-storage"
import { TryExample } from "@/components/try-example"

type PairingRow = {
  code: string
  complement: string
  meaningKey: string
  complementMeaningKey: string
  noteKey?: string
}

const PAIRING_GROUPS: { titleKey: string; rows: PairingRow[] }[] = [
  {
    titleKey: "tools.base-complement.pairingGroupStandard",
    rows: [
      { code: "A", complement: "T", meaningKey: "tools.base-complement.pairingAdenine", complementMeaningKey: "tools.base-complement.pairingThymine" },
      { code: "T", complement: "A", meaningKey: "tools.base-complement.pairingThymine", complementMeaningKey: "tools.base-complement.pairingAdenine" },
      { code: "G", complement: "C", meaningKey: "tools.base-complement.pairingGuanine", complementMeaningKey: "tools.base-complement.pairingCytosine" },
      { code: "C", complement: "G", meaningKey: "tools.base-complement.pairingCytosine", complementMeaningKey: "tools.base-complement.pairingGuanine" },
    ],
  },
  {
    titleKey: "tools.base-complement.pairingGroupAmbiguous",
    rows: [
      { code: "R", complement: "Y", meaningKey: "tools.base-complement.pairingPurine", complementMeaningKey: "tools.base-complement.pairingPyrimidine" },
      { code: "Y", complement: "R", meaningKey: "tools.base-complement.pairingPyrimidine", complementMeaningKey: "tools.base-complement.pairingPurine" },
      { code: "S", complement: "S", meaningKey: "tools.base-complement.pairingStrong", complementMeaningKey: "tools.base-complement.pairingStrong", noteKey: "tools.base-complement.pairingSelfComplementary" },
      { code: "W", complement: "W", meaningKey: "tools.base-complement.pairingWeak", complementMeaningKey: "tools.base-complement.pairingWeak", noteKey: "tools.base-complement.pairingSelfComplementary" },
      { code: "K", complement: "M", meaningKey: "tools.base-complement.pairingKeto", complementMeaningKey: "tools.base-complement.pairingAmino" },
      { code: "M", complement: "K", meaningKey: "tools.base-complement.pairingAmino", complementMeaningKey: "tools.base-complement.pairingKeto" },
      { code: "B", complement: "V", meaningKey: "tools.base-complement.pairingNotA", complementMeaningKey: "tools.base-complement.pairingNotT" },
      { code: "V", complement: "B", meaningKey: "tools.base-complement.pairingNotT", complementMeaningKey: "tools.base-complement.pairingNotA" },
      { code: "D", complement: "H", meaningKey: "tools.base-complement.pairingNotC", complementMeaningKey: "tools.base-complement.pairingNotG" },
      { code: "H", complement: "D", meaningKey: "tools.base-complement.pairingNotG", complementMeaningKey: "tools.base-complement.pairingNotC" },
      { code: "N", complement: "N", meaningKey: "tools.base-complement.pairingAny", complementMeaningKey: "tools.base-complement.pairingAny", noteKey: "tools.base-complement.pairingSelfComplementary" },
    ],
  },
  {
    titleKey: "tools.base-complement.pairingGroupGap",
    rows: [
      { code: "-", complement: "-", meaningKey: "tools.base-complement.pairingGap", complementMeaningKey: "tools.base-complement.pairingGap", noteKey: "tools.base-complement.pairingUnchanged" },
      { code: ".", complement: ".", meaningKey: "tools.base-complement.pairingGap", complementMeaningKey: "tools.base-complement.pairingGap", noteKey: "tools.base-complement.pairingUnchanged" },
    ],
  },
]

function PairingCode({ value, emphasized = false }: { value: string; emphasized?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 font-mono text-sm font-medium ${
        emphasized
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-border bg-muted/50 text-foreground"
      }`}
    >
      {value}
    </span>
  )
}

export function BaseComplement() {
  const { t } = useI18n()
  const [input, setInput] = useToolStorage("base-complement:input", "")
  const [output, setOutput] = useState("")
  const [preserveDelimiters, setPreserveDelimiters] = useToolStorage("base-complement:preserveDelimiters", true)
  const [copied, setCopied] = useState(false)

  // 完整的IUPAC碱基互补映射表
  const getComplementMap = () => {
    return {
      // 标准碱基
      'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
      'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
      
      // 双碱基代码
      'R': 'Y', 'Y': 'R', // R=A/G, Y=C/T
      'S': 'S', 'W': 'W', // S=G/C, W=A/T (自互补)
      'K': 'M', 'M': 'K', // K=G/T, M=A/C
      'r': 'y', 'y': 'r',
      's': 's', 'w': 'w',
      'k': 'm', 'm': 'k',
      
      // 三碱基代码
      'B': 'V', 'V': 'B', // B=C/G/T, V=A/C/G
      'D': 'H', 'H': 'D', // D=A/G/T, H=A/C/T
      'b': 'v', 'v': 'b',
      'd': 'h', 'h': 'd',
      
      // 任意碱基和间隙
      'N': 'N', 'n': 'n', // 任意碱基
      '-': '-', '.': '.', // 间隙
      ' ': ' ', '\t': '\t', '\n': '\n', '\r': '\r' // 空白字符
    }
  }

  // 检测是否为FASTA格式
  const isFastaFormat = (text: string) => {
    const lines = text.split(/\r?\n/)
    return lines.some(line => line.trim().startsWith('>'))
  }

  // 处理FASTA格式的序列
  const processFastaSequence = (text: string, operation: (seq: string) => string) => {
    const lines = text.split(/\r?\n/)
    const result: string[] = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 如果是序列名称行（以>开头），保持原样
      if (trimmedLine.startsWith('>')) {
        result.push(line)
      }
      // 如果是空行，保持原样
      else if (trimmedLine === '') {
        result.push(line)
      }
      // 如果是序列行，进行操作
      else if (trimmedLine) {
        result.push(operation(trimmedLine))
      }
      // 其他情况保持原样
      else {
        result.push(line)
      }
    }
    
    return result.join('\n')
  }

  // 检测分隔符的函数
  const detectDelimiters = (text: string) => {
    const delimiters = ['\t', '\n', '\r\n', ',', ';', ' ']
    return delimiters.filter(delimiter => text.includes(delimiter))
  }

  // 处理带分隔符的序列
  const processSequenceWithDelimiters = (sequence: string, operation: (seq: string) => string) => {
    // 首先检查是否为FASTA格式
    if (isFastaFormat(sequence)) {
      return processFastaSequence(sequence, operation)
    }

    if (!preserveDelimiters) {
      return operation(sequence)
    }

    const detectedDelimiters = detectDelimiters(sequence)
    if (detectedDelimiters.length === 0) {
      return operation(sequence)
    }

    // 使用正则表达式分割，保留分隔符
    const parts = sequence.split(/(\t|\n|\r\n|,|;| +)/)
    
    return parts.map(part => {
      // 如果是分隔符，保持原样
      if (/^(\t|\n|\r\n|,|;| +)$/.test(part)) {
        return part
      }
      // 如果是序列，进行操作
      if (part.trim()) {
        return operation(part)
      }
      return part
    }).join('')
  }

  const getComplement = (sequence: string) => {
    const complementMap = getComplementMap()
    return sequence
      .split("")
      .map((base) => complementMap[base as keyof typeof complementMap] || base)
      .join("")
  }

  const getReverse = (sequence: string) => {
    return sequence.split("").reverse().join("")
  }

  const getReverseComplement = (sequence: string) => {
    return getComplement(sequence).split("").reverse().join("")
  }

  const handleComplement = () => {
    setOutput(processSequenceWithDelimiters(input, getComplement))
  }

  const handleReverse = () => {
    setOutput(processSequenceWithDelimiters(input, getReverse))
  }

  const handleReverseComplement = () => {
    setOutput(processSequenceWithDelimiters(input, getReverseComplement))
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setCopied(false)
  }

  const copyToClipboard = async () => {
    if (!output) return

    try {
      await copyText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadOutput = () => {
    if (!output) return
    downloadBlob(output, "base-complement-output.txt")
  }

  const handleTryExample = (example: Record<string, unknown>) => {
    if (typeof example.input === "string") setInput(example.input)
    if (typeof example.preserveDelimiters === "boolean") setPreserveDelimiters(example.preserveDelimiters)
  }

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>{t("tools.base-complement.name")}</ToolPageTitle>
        <ToolPageDescription>{t("tools.base-complement.description")}</ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        {/* 输入框 */}
        <div className="space-y-2">
          <Label htmlFor="sequence-input" className="">
            {t("tools.base-complement.inputLabel")}
          </Label>
          <Textarea
            id="sequence-input"
            placeholder={t("tools.base-complement.inputPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="terminal-input min-h-[120px] font-mono"
            rows={5}
          />
        </div>

        {/* 分隔符处理选项 */}
        <div className="flex items-center space-x-3 p-3 rounded-md border border-border bg-card/50">
          <Checkbox
            id="preserve-delimiters"
            checked={preserveDelimiters}
            onCheckedChange={(checked) => setPreserveDelimiters(checked as boolean)}
            className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label 
            htmlFor="preserve-delimiters" 
            className={`font-mono text-sm cursor-pointer transition-colors ${
              preserveDelimiters ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {t("tools.base-complement.preserveDelimiters")}
          </Label>
          <div className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
            preserveDelimiters 
              ? 'bg-primary/10 text-primary border border-primary/20' 
              : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {preserveDelimiters ? t("common.enabled", "已启用") : t("common.disabled", "已禁用")}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleComplement} variant="outline" className="">
            {t("tools.base-complement.complement")}
          </Button>
          <Button onClick={handleReverse} variant="outline" className="">
            {t("tools.base-complement.reverse")}
          </Button>
          <Button onClick={handleReverseComplement} variant="outline" className="">
            {t("tools.base-complement.reverseComplement")}
          </Button>
          <Button onClick={clearAll} variant="outline" className="">
            {t("common.clear")}
          </Button>
          <TryExample
            example={{ input: "ATCGTACGTTAGCATCGATCG\nTAGCTAGCTAGCTAGCTGCTA", preserveDelimiters: true }}
            onApply={handleTryExample}
          />
        </div>

        {/* 输出框 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sequence-output" className="">
              {t("tools.base-complement.outputLabel")}
            </Label>
            {output && (
              <div className="flex items-center gap-1">
                <Button
                  onClick={copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  disabled={!output}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      {t("common.copy")}
                    </>
                  )}
                </Button>
                <Button
                  onClick={downloadOutput}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  disabled={!output}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {t("common.download", "Download")}
                </Button>
              </div>
            )}
          </div>
          <Textarea
            id="sequence-output"
            value={output}
            readOnly
            className="terminal-output min-h-[120px] font-mono bg-muted/50"
            rows={5}
            placeholder={t("tools.base-complement.outputPlaceholder")}
          />
        </div>

        {/* 序列信息 */}
        {input && (
          <div className="text-sm text-muted-foreground font-mono space-y-1">
            <div>{t("tools.base-complement.inputLength")}: {input.length}</div>
            {output && <div>{t("tools.base-complement.outputLength")}: {output.length}</div>}
          </div>
        )}

        <ToolSection
          title={t("tools.base-complement.pairingTableTitle")}
          description={t("tools.base-complement.pairingTableDescription")}
        >
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-card/50 hover:bg-card/50">
                  <TableHead className="w-20 font-mono text-xs">{t("tools.base-complement.pairingCode")}</TableHead>
                  <TableHead className="font-mono text-xs">{t("tools.base-complement.pairingMeaning")}</TableHead>
                  <TableHead className="w-20 font-mono text-xs">{t("tools.base-complement.pairingComplement")}</TableHead>
                  <TableHead className="font-mono text-xs">{t("tools.base-complement.pairingComplementMeaning")}</TableHead>
                  <TableHead className="w-28 font-mono text-xs">{t("tools.base-complement.pairingNote")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PAIRING_GROUPS.map((group) => (
                  <Fragment key={group.titleKey}>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={5} className="py-2 font-mono text-xs text-muted-foreground">
                        {t(group.titleKey)}
                      </TableCell>
                    </TableRow>
                    {group.rows.map((row) => (
                      <TableRow key={`${group.titleKey}-${row.code}`}>
                        <TableCell>
                          <PairingCode value={row.code} />
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {t(row.meaningKey)}
                        </TableCell>
                        <TableCell>
                          <PairingCode value={row.complement} emphasized />
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {t(row.complementMeaningKey)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {row.noteKey ? t(row.noteKey) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {t("tools.base-complement.pairingTableFootnote")}
          </p>
        </ToolSection>
      </ToolPageContent>
    </ToolPage>
  )
}
