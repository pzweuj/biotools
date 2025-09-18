"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function BaseComplement() {
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [preserveDelimiters, setPreserveDelimiters] = useState(true)
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

  // 检测分隔符的函数
  const detectDelimiters = (text: string) => {
    const delimiters = ['\t', '\n', '\r\n', ',', ';', ' ']
    return delimiters.filter(delimiter => text.includes(delimiter))
  }

  // 处理带分隔符的序列
  const processSequenceWithDelimiters = (sequence: string, operation: (seq: string) => string) => {
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
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">{t("tools.base-complement.name")}</CardTitle>
        <CardDescription className="font-mono">{t("tools.base-complement.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 输入框 */}
        <div className="space-y-2">
          <Label htmlFor="sequence-input" className="font-mono">
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
          <Button onClick={handleComplement} variant="outline" className="font-mono">
            {t("tools.base-complement.complement")}
          </Button>
          <Button onClick={handleReverse} variant="outline" className="font-mono">
            {t("tools.base-complement.reverse")}
          </Button>
          <Button onClick={handleReverseComplement} variant="outline" className="font-mono">
            {t("tools.base-complement.reverseComplement")}
          </Button>
          <Button onClick={clearAll} variant="outline" className="font-mono">
            {t("common.clear")}
          </Button>
        </div>

        {/* 输出框 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sequence-output" className="font-mono">
              {t("tools.base-complement.outputLabel")}
            </Label>
            {output && (
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="font-mono h-8 px-2"
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
      </CardContent>
    </Card>
  )
}
