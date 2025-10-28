"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useI18n } from "@/lib/i18n"
import { Copy, ArrowLeftRight } from "lucide-react"

// 氨基酸映射表
const aminoAcidMap: { [key: string]: { three: string; one: string } } = {
  "Ala": { three: "Ala", one: "A" },
  "Arg": { three: "Arg", one: "R" },
  "Asn": { three: "Asn", one: "N" },
  "Asp": { three: "Asp", one: "D" },
  "Cys": { three: "Cys", one: "C" },
  "Gln": { three: "Gln", one: "Q" },
  "Glu": { three: "Glu", one: "E" },
  "Gly": { three: "Gly", one: "G" },
  "His": { three: "His", one: "H" },
  "Ile": { three: "Ile", one: "I" },
  "Leu": { three: "Leu", one: "L" },
  "Lys": { three: "Lys", one: "K" },
  "Met": { three: "Met", one: "M" },
  "Phe": { three: "Phe", one: "F" },
  "Pro": { three: "Pro", one: "P" },
  "Ser": { three: "Ser", one: "S" },
  "Thr": { three: "Thr", one: "T" },
  "Trp": { three: "Trp", one: "W" },
  "Tyr": { three: "Tyr", one: "Y" },
  "Val": { three: "Val", one: "V" },
}

// 终止密码子映射
const stopCodonMap: { [key: string]: string[] } = {
  "Ter": ["Ter", "*", "X"],
  "*": ["Ter", "*", "X"],
  "X": ["Ter", "*", "X"],
}

// 创建反向映射（单字母到三字母）
const oneToThreeMap: { [key: string]: string } = {}
Object.entries(aminoAcidMap).forEach(([three, { one }]) => {
  oneToThreeMap[one] = three
})

const MAX_LINES = 1000 // 最大行数限制

export function AaConverter() {
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [conversionMode, setConversionMode] = useState<"toOne" | "toThree">("toOne") // 转换方向
  const [stopCodonFormat, setStopCodonFormat] = useState<"Ter" | "*" | "X">("Ter") // 终止密码子格式
  const [copied, setCopied] = useState(false)

  // 计算当前行数
  const lineCount = input.trim() ? input.split("\n").length : 0
  const isOverLimit = lineCount > MAX_LINES

  // 转换单个变异
  const convertVariant = (variant: string): string => {
    variant = variant.trim()
    if (!variant) return ""

    // 保留 p. 前缀
    const hasPrefix = /^p\./i.test(variant)
    const prefix = hasPrefix ? "p." : ""
    const cleanVariant = variant.replace(/^p\./i, "")

    if (conversionMode === "toOne") {
      // 三字母转单字母
      let result = cleanVariant
      
      // 处理终止密码子 - 需要转义特殊字符
      Object.keys(stopCodonMap).forEach(stop => {
        // 转义正则表达式特殊字符
        const escapedStop = stop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escapedStop, "g")
        result = result.replace(regex, stopCodonFormat)
      })
      
      // 转换氨基酸
      Object.entries(aminoAcidMap).forEach(([three, { one }]) => {
        const regex = new RegExp(three, "g")
        result = result.replace(regex, one)
      })
      
      return prefix + result
    } else {
      // 单字母转三字母 (toThree)
      let result = cleanVariant
      
      // 转换氨基酸（需要保留数字和其他文本如del、ins、dup、delins等）
      // 匹配模式：单字母+数字+可选的(单字母或特殊变异类型)
      // 例如：V559C, V560del, L858_E861delinsD
      result = result.replace(/([A-Z])(\d+)(?:_([A-Z])(\d+))?(del|ins|dup|delins|fs|ext)?([A-Z*X])?/g, 
        (match, aa1, pos1, aa2, pos2, varType, aa3) => {
          const three1 = oneToThreeMap[aa1] || aa1
          
          // 处理范围变异（如 L858_E861delinsD）
          if (aa2 && pos2) {
            const three2 = oneToThreeMap[aa2] || aa2
            let result = `${three1}${pos1}_${three2}${pos2}`
            
            // 添加变异类型
            if (varType) {
              result += varType
            }
            
            // 添加目标氨基酸（如果有）
            if (aa3) {
              let three3 = oneToThreeMap[aa3] || aa3
              if (aa3 === "*" || aa3 === "X") {
                three3 = stopCodonFormat
              }
              result += three3
            }
            
            return result
          }
          
          // 处理单个位置的变异
          let result = `${three1}${pos1}`
          
          // 添加变异类型（del, ins, dup等）
          if (varType) {
            result += varType
          }
          
          // 添加目标氨基酸（如果有）
          if (aa3) {
            let three3 = oneToThreeMap[aa3] || aa3
            if (aa3 === "*" || aa3 === "X") {
              three3 = stopCodonFormat
            }
            result += three3
          }
          
          return result
        })
      
      return prefix + result
    }
  }

  // 批量转换
  const handleConvert = () => {
    if (isOverLimit) return // 超过限制时不执行转换
    
    const lines = input.split("\n")
    const converted = lines.map(line => convertVariant(line)).join("\n")
    setOutput(converted)
  }

  // 复制结果
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // 清空
  const handleClear = () => {
    setInput("")
    setOutput("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.aa-converter.name")}</CardTitle>
          <CardDescription>{t("tools.aa-converter.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 转换方向选择 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t("tools.aa-converter.conversionMode")}</Label>
            <RadioGroup
              value={conversionMode}
              onValueChange={(value) => setConversionMode(value as "toOne" | "toThree")}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="toOne"
                className={`flex items-center justify-center space-x-2 border-2 rounded-md p-3 cursor-pointer transition-all ${
                  conversionMode === "toOne"
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="toOne" id="toOne" />
                <span>{t("tools.aa-converter.threeToOne")}</span>
              </Label>
              <Label
                htmlFor="toThree"
                className={`flex items-center justify-center space-x-2 border-2 rounded-md p-3 cursor-pointer transition-all ${
                  conversionMode === "toThree"
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="toThree" id="toThree" />
                <span>{t("tools.aa-converter.oneToThree")}</span>
              </Label>
            </RadioGroup>
          </div>

          {/* 输入区域 */}
          <div className="space-y-2">
            <Label htmlFor="input" className="text-base font-semibold">{t("tools.aa-converter.inputLabel")}</Label>
            <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
              <Textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("tools.aa-converter.inputPlaceholder")}
                className="font-mono min-h-[200px] border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                {t("tools.aa-converter.formatHint")}
              </p>
              <p className={`font-mono ${
                isOverLimit 
                  ? "text-red-500 font-semibold" 
                  : lineCount > MAX_LINES * 0.8 
                    ? "text-yellow-600 font-semibold" 
                    : "text-muted-foreground"
              }`}>
                {lineCount} / {MAX_LINES} {t("tools.aa-converter.lines")}
              </p>
            </div>
            {isOverLimit && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                  ⚠️ {t("tools.aa-converter.lineLimitWarning").replace("{max}", MAX_LINES.toString())}
                </p>
              </div>
            )}
          </div>

          {/* 终止密码子选项 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t("tools.aa-converter.stopCodonFormat")}</Label>
            <RadioGroup
              value={stopCodonFormat}
              onValueChange={(value) => setStopCodonFormat(value as "Ter" | "*" | "X")}
              className="grid grid-cols-3 gap-3"
            >
              <Label
                htmlFor="ter"
                className={`flex items-center justify-center space-x-2 border-2 rounded-md p-3 cursor-pointer transition-all ${
                  stopCodonFormat === "Ter"
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="Ter" id="ter" />
                <span>Ter</span>
              </Label>
              <Label
                htmlFor="asterisk"
                className={`flex items-center justify-center space-x-2 border-2 rounded-md p-3 cursor-pointer transition-all ${
                  stopCodonFormat === "*"
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="*" id="asterisk" />
                <span>*</span>
              </Label>
              <Label
                htmlFor="x"
                className={`flex items-center justify-center space-x-2 border-2 rounded-md p-3 cursor-pointer transition-all ${
                  stopCodonFormat === "X"
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="X" id="x" />
                <span>X</span>
              </Label>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              {t("tools.aa-converter.stopCodonHint")}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button 
              onClick={handleConvert} 
              className="flex-1"
              disabled={isOverLimit || !input.trim()}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              {t("tools.aa-converter.convert")}
            </Button>
            <Button onClick={handleClear} variant="outline">
              {t("common.clear")}
            </Button>
          </div>

          {/* 输出区域 */}
          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="output" className="text-base font-semibold">{t("tools.aa-converter.outputLabel")}</Label>
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  size="sm"
                  className="h-8"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? t("common.copied") : t("common.copy")}
                </Button>
              </div>
              <div className="border-2 border-primary/40 rounded-md p-1 bg-primary/5">
                <Textarea
                  id="output"
                  value={output}
                  readOnly
                  className="font-mono min-h-[200px] border-0 bg-muted/50"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用示例 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.aa-converter.examplesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("tools.aa-converter.example1Title")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.aa-converter.input")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">p.Leu858Arg</code>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.aa-converter.output")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">p.L858R</code>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("tools.aa-converter.example2Title")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.aa-converter.input")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">p.L858R</code>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.aa-converter.output")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">p.Leu858Arg</code>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("tools.aa-converter.example3Title")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.aa-converter.input")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">p.Gln61Ter</code>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.aa-converter.output")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">p.Q61* (or p.Q61X)</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
