"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/lib/i18n"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

// 最大输入限制，避免计算卡死
const MAX_INDICES = 200

interface IndexEntry {
  row: number
  name: string
  index1: string
  index2?: string
}

interface ValidationIssue {
  type: "duplicate" | "reverse-complement" | "reverse" | "similar"
  severity: "error" | "warning"
  indices: number[]
  description: string
  sequences: string[]
}

interface ValidationResult {
  entries: IndexEntry[]
  issues: ValidationIssue[]
  isValid: boolean
  totalChecked: number
}

export function IndexChecker() {
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // 计算反向互补序列
  const reverseComplement = (seq: string): string => {
    const complement: { [key: string]: string } = {
      A: "T",
      T: "A",
      G: "C",
      C: "G",
      N: "N",
    }
    return seq
      .toUpperCase()
      .split("")
      .reverse()
      .map((base) => complement[base] || base)
      .join("")
  }

  // 计算两个序列之间的汉明距离
  const hammingDistance = (seq1: string, seq2: string): number => {
    if (seq1.length !== seq2.length) return Infinity
    let distance = 0
    for (let i = 0; i < seq1.length; i++) {
      if (seq1[i] !== seq2[i]) distance++
    }
    return distance
  }

  // 解析输入数据
  const parseInput = (text: string): IndexEntry[] => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const entries: IndexEntry[] = []

    lines.forEach((line, index) => {
      // 支持多种分隔符：Tab, 逗号, 空格
      const parts = line.split(/[\t,\s]+/).filter((p) => p.length > 0)

      if (parts.length >= 2) {
        const name = parts[0]
        const index1 = parts[1].toUpperCase().replace(/[^ATCGN]/g, "")
        const index2 = parts.length >= 3 ? parts[2].toUpperCase().replace(/[^ATCGN]/g, "") : undefined

        if (index1.length > 0) {
          entries.push({
            row: index + 1,
            name,
            index1,
            index2: index2 && index2.length > 0 ? index2 : undefined,
          })
        }
      }
    })

    return entries
  }

  // 验证索引
  const validateIndices = (entries: IndexEntry[]): ValidationResult => {
    const issues: ValidationIssue[] = []

    // 检查重复的index
    const checkDuplicates = (indices: string[], indexType: "index1" | "index2") => {
      const seen = new Map<string, number[]>()

      entries.forEach((entry, idx) => {
        const seq = indexType === "index1" ? entry.index1 : entry.index2
        if (!seq) return

        if (seen.has(seq)) {
          seen.get(seq)!.push(idx)
        } else {
          seen.set(seq, [idx])
        }
      })

      seen.forEach((positions, seq) => {
        if (positions.length > 1) {
          issues.push({
            type: "duplicate",
            severity: "error",
            indices: positions,
            description: `${indexType === "index1" ? t("tools.index-checker.index1") : t("tools.index-checker.index2")}: ${seq}`,
            sequences: [seq],
          })
        }
      })
    }

    // 检查反向互补和反向匹配
    const checkReverseComplement = (indexType: "index1" | "index2") => {
      for (let i = 0; i < entries.length; i++) {
        const seq1 = indexType === "index1" ? entries[i].index1 : entries[i].index2
        if (!seq1) continue

        const rc1 = reverseComplement(seq1)
        const reverse1 = seq1.split("").reverse().join("")

        for (let j = i + 1; j < entries.length; j++) {
          const seq2 = indexType === "index1" ? entries[j].index1 : entries[j].index2
          if (!seq2) continue

          // 检查反向互补（错误）
          if (seq1 === reverseComplement(seq2) || rc1 === seq2) {
            issues.push({
              type: "reverse-complement",
              severity: "error",
              indices: [i, j],
              description: `${indexType === "index1" ? t("tools.index-checker.index1") : t("tools.index-checker.index2")}`,
              sequences: [seq1, seq2],
            })
          }
          // 检查反向匹配（警告）
          else if (seq1 === seq2.split("").reverse().join("") || reverse1 === seq2) {
            issues.push({
              type: "reverse",
              severity: "warning",
              indices: [i, j],
              description: `${indexType === "index1" ? t("tools.index-checker.index1") : t("tools.index-checker.index2")}`,
              sequences: [seq1, seq2],
            })
          }
        }
      }
    }

    // 检查相似序列（汉明距离≤2）
    const checkSimilar = (indexType: "index1" | "index2") => {
      for (let i = 0; i < entries.length; i++) {
        const seq1 = indexType === "index1" ? entries[i].index1 : entries[i].index2
        if (!seq1) continue

        for (let j = i + 1; j < entries.length; j++) {
          const seq2 = indexType === "index1" ? entries[j].index1 : entries[j].index2
          if (!seq2) continue

          const distance = hammingDistance(seq1, seq2)
          if (distance > 0 && distance <= 2) {
            const indexLabel = indexType === "index1" ? t("tools.index-checker.index1") : t("tools.index-checker.index2")
            const diffText = t("tools.index-checker.bpDifference").replace("{n}", distance.toString())
            issues.push({
              type: "similar",
              severity: "warning",
              indices: [i, j],
              description: `${indexLabel} (${diffText})`,
              sequences: [seq1, seq2],
            })
          }
        }
      }
    }

    // 执行所有检查
    const index1List = entries.map((e) => e.index1)
    const index2List = entries.map((e) => e.index2).filter((i): i is string => i !== undefined)

    checkDuplicates(index1List, "index1")
    checkReverseComplement("index1")
    checkSimilar("index1")

    if (index2List.length > 0) {
      checkDuplicates(index2List, "index2")
      checkReverseComplement("index2")
      checkSimilar("index2")
    }

    // 按严重程度排序
    issues.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === "error" ? -1 : 1
      }
      return a.indices[0] - b.indices[0]
    })

    return {
      entries,
      issues,
      isValid: issues.filter((i) => i.severity === "error").length === 0,
      totalChecked: entries.length,
    }
  }

  const handleCheck = async () => {
    if (!input.trim()) return

    setIsChecking(true)

    // 添加延迟以显示加载状态
    await new Promise((resolve) => setTimeout(resolve, 100))

    const entries = parseInput(input)

    if (entries.length === 0) {
      setResult({
        entries: [],
        issues: [],
        isValid: false,
        totalChecked: 0,
      })
      setIsChecking(false)
      return
    }

    if (entries.length > MAX_INDICES) {
      setResult({
        entries: entries.slice(0, MAX_INDICES),
        issues: [
          {
            type: "duplicate",
            severity: "error",
            indices: [],
            description: t("tools.index-checker.tooManyIndices").replace("{max}", MAX_INDICES.toString()),
            sequences: [],
          },
        ],
        isValid: false,
        totalChecked: entries.length,
      })
      setIsChecking(false)
      return
    }

    const validationResult = validateIndices(entries)
    setResult(validationResult)
    setIsChecking(false)
  }

  const getSeverityIcon = (severity: "error" | "warning") => {
    if (severity === "error") {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const getSeverityBadge = (severity: "error" | "warning") => {
    if (severity === "error") {
      return (
        <Badge variant="destructive" className="ml-2">
          {t("tools.index-checker.error")}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-600">
        {t("tools.index-checker.warning")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.index-checker.name")}</CardTitle>
          <CardDescription>{t("tools.index-checker.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="index-input">{t("tools.index-checker.inputLabel")}</Label>
            <Textarea
              id="index-input"
              placeholder={t("tools.index-checker.inputPlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-mono text-sm min-h-[200px]"
            />
            <p className="text-sm text-muted-foreground">{t("tools.index-checker.formatHint")}</p>
          </div>

          <Button onClick={handleCheck} disabled={isChecking || !input.trim()} className="w-full">
            {isChecking ? t("common.loading") : t("tools.index-checker.checkIndices")}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("tools.index-checker.results")}</CardTitle>
              <div className="flex items-center gap-2">
                {result.isValid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      {t("tools.index-checker.allValid")}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      {t("tools.index-checker.issuesFound")}
                    </span>
                  </>
                )}
              </div>
            </div>
            <CardDescription>
              {t("tools.index-checker.totalChecked")}: {result.totalChecked} |{" "}
              {t("tools.index-checker.errors")}: {result.issues.filter((i) => i.severity === "error").length} |{" "}
              {t("tools.index-checker.warnings")}: {result.issues.filter((i) => i.severity === "warning").length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="issues" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="issues">{t("tools.index-checker.issuesTab")}</TabsTrigger>
                <TabsTrigger value="data">{t("tools.index-checker.dataTab")}</TabsTrigger>
              </TabsList>

              <TabsContent value="issues" className="space-y-4">
                {result.issues.length === 0 ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>{t("tools.index-checker.noIssues")}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {result.issues.map((issue, idx) => (
                      <Alert key={idx} variant={issue.severity === "error" ? "destructive" : "default"}>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-3 shrink-0">
                            {getSeverityIcon(issue.severity)}
                            <span className="font-medium whitespace-nowrap">
                              {issue.type === "duplicate" && t("tools.index-checker.duplicateIndex")}
                              {issue.type === "reverse-complement" &&
                                t("tools.index-checker.reverseComplementMatch")}
                              {issue.type === "reverse" && t("tools.index-checker.reverseMatch")}
                              {issue.type === "similar" && t("tools.index-checker.similarIndex")}
                            </span>
                            {getSeverityBadge(issue.severity)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                            <span className="text-border">|</span>
                            <span>{issue.description}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm shrink-0">
                            <span className="text-border">|</span>
                            <span className="font-medium">{t("tools.index-checker.affectedRows")}:</span>
                            <span>{issue.indices.map((i) => result.entries[i].name).join(", ")}</span>
                          </div>
                          
                          {issue.sequences.length > 0 && (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-border text-sm">|</span>
                              {issue.sequences.map((seq, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-muted rounded border font-mono text-sm">{seq}</span>
                                  {i < issue.sequences.length - 1 && (
                                    <span className="text-muted-foreground">↔</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="data">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">{t("tools.index-checker.row")}</TableHead>
                        <TableHead>{t("tools.index-checker.sampleName")}</TableHead>
                        <TableHead>{t("tools.index-checker.index1")}</TableHead>
                        <TableHead>{t("tools.index-checker.index2")}</TableHead>
                        <TableHead className="w-[100px]">{t("tools.index-checker.length")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.entries.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{entry.row}</TableCell>
                          <TableCell>{entry.name}</TableCell>
                          <TableCell className="font-mono text-sm">{entry.index1}</TableCell>
                          <TableCell className="font-mono text-sm">{entry.index2 || "-"}</TableCell>
                          <TableCell>
                            {entry.index1.length}
                            {entry.index2 && ` + ${entry.index2.length}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
