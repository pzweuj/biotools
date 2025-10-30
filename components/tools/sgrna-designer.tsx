"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "@/lib/i18n"
import { Scissors, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"

type PAMType = "NGG" | "NG" | "NRG" | "NNGRRT"

interface SgRNAResult {
  sequence: string
  position: number
  strand: "+" | "-"
  pam: string
  gcContent: number
  score: number
  issues: string[]
  rating: "excellent" | "good" | "moderate" | "poor"
}

export function SgRNADesigner() {
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [pamType, setPamType] = useState<PAMType>("NGG")
  const [results, setResults] = useState<SgRNAResult[]>([])

  // PAM序列正则表达式
  const getPAMRegex = (type: PAMType): RegExp => {
    switch (type) {
      case "NGG":
        return /[ATCG]GG/g
      case "NG":
        return /[ATCG]G/g
      case "NRG":
        return /[ATCG][AG]G/g
      case "NNGRRT":
        return /[ATCG]{2}G[AG][AG]T/g
      default:
        return /[ATCG]GG/g
    }
  }

  // 获取sgRNA长度
  const getSgRNALength = (type: PAMType): number => {
    return type === "NNGRRT" ? 24 : 20
  }

  // 计算GC含量
  const calculateGC = (seq: string): number => {
    const gc = (seq.match(/[GC]/g) || []).length
    return (gc / seq.length) * 100
  }

  // 计算反向互补
  const reverseComplement = (seq: string): string => {
    const complement: { [key: string]: string } = { A: "T", T: "A", G: "C", C: "G" }
    return seq
      .split("")
      .reverse()
      .map((base) => complement[base] || base)
      .join("")
  }

  // 检测poly-T序列（TTTT会导致转录终止）
  const hasPolyT = (seq: string): boolean => {
    return /TTTT/.test(seq)
  }

  // 检测二级结构风险（简化版：检测回文序列）
  const hasSecondaryStructure = (seq: string): boolean => {
    // 检测6bp以上的回文序列
    for (let i = 0; i < seq.length - 5; i++) {
      const segment = seq.substring(i, i + 6)
      const rc = reverseComplement(segment)
      if (seq.includes(rc) && seq.indexOf(rc) !== i) {
        return true
      }
    }
    return false
  }

  // 评分系统
  const scoreSgRNA = (seq: string, gcContent: number): { score: number; issues: string[]; rating: "excellent" | "good" | "moderate" | "poor" } => {
    let score = 100
    const issues: string[] = []

    // GC含量评分（最佳范围：40-60%）
    if (gcContent < 30 || gcContent > 70) {
      score -= 30
      issues.push(t("tools.sgrna-designer.issueGCExtreme", "GC content too extreme"))
    } else if (gcContent < 40 || gcContent > 60) {
      score -= 15
      issues.push(t("tools.sgrna-designer.issueGCSuboptimal", "GC content suboptimal"))
    }

    // Poly-T检测
    if (hasPolyT(seq)) {
      score -= 25
      issues.push(t("tools.sgrna-designer.issuePolyT", "Contains poly-T (TTTT) - transcription terminator"))
    }

    // 二级结构风险
    if (hasSecondaryStructure(seq)) {
      score -= 20
      issues.push(t("tools.sgrna-designer.issueSecondary", "Potential secondary structure"))
    }

    // 起始G（有利于U6启动子转录）
    if (seq[0] !== "G") {
      score -= 10
      issues.push(t("tools.sgrna-designer.issueNoG", "Does not start with G (U6 promoter preference)"))
    }

    // 评级
    let rating: "excellent" | "good" | "moderate" | "poor"
    if (score >= 80) rating = "excellent"
    else if (score >= 60) rating = "good"
    else if (score >= 40) rating = "moderate"
    else rating = "poor"

    return { score: Math.max(0, score), issues, rating }
  }

  // 查找sgRNA
  const findSgRNAs = () => {
    if (!input.trim()) return

    const sequence = input
      .split("\n")
      .filter((line) => !line.startsWith(">"))
      .join("")
      .replace(/[^ATCGatcg]/g, "")
      .toUpperCase()

    if (sequence.length < 23) {
      return
    }

    const pamRegex = getPAMRegex(pamType)
    const sgRNALength = getSgRNALength(pamType)
    const pamLength = pamType === "NNGRRT" ? 6 : pamType === "NG" ? 2 : 3
    const foundResults: SgRNAResult[] = []

    // 正向链查找
    let match
    pamRegex.lastIndex = 0
    while ((match = pamRegex.exec(sequence)) !== null) {
      const pamPosition = match.index
      const sgRNAStart = pamPosition - sgRNALength

      if (sgRNAStart >= 0) {
        const sgRNASeq = sequence.substring(sgRNAStart, pamPosition)
        const pam = match[0]
        const gcContent = calculateGC(sgRNASeq)
        const { score, issues, rating } = scoreSgRNA(sgRNASeq, gcContent)

        foundResults.push({
          sequence: sgRNASeq,
          position: sgRNAStart + 1,
          strand: "+",
          pam,
          gcContent,
          score,
          issues,
          rating,
        })
      }
    }

    // 反向链查找
    const rcSequence = reverseComplement(sequence)
    pamRegex.lastIndex = 0
    while ((match = pamRegex.exec(rcSequence)) !== null) {
      const pamPosition = match.index
      const sgRNAStart = pamPosition - sgRNALength

      if (sgRNAStart >= 0) {
        const sgRNASeq = rcSequence.substring(sgRNAStart, pamPosition)
        const pam = match[0]
        const gcContent = calculateGC(sgRNASeq)
        const { score, issues, rating } = scoreSgRNA(sgRNASeq, gcContent)

        // 转换回正向链坐标
        const originalPosition = sequence.length - pamPosition

        foundResults.push({
          sequence: sgRNASeq,
          position: originalPosition,
          strand: "-",
          pam,
          gcContent,
          score,
          issues,
          rating,
        })
      }
    }

    // 按评分排序
    foundResults.sort((a, b) => b.score - a.score)
    setResults(foundResults)
  }

  const clearAll = () => {
    setInput("")
    setResults([])
  }

  // 获取评级样式
  const getRatingStyle = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-500 text-white"
      case "good":
        return "bg-blue-500 text-white"
      case "moderate":
        return "bg-yellow-500 text-white"
      case "poor":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case "excellent":
        return <CheckCircle2 className="w-4 h-4" />
      case "good":
        return <CheckCircle2 className="w-4 h-4" />
      case "moderate":
        return <AlertTriangle className="w-4 h-4" />
      case "poor":
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.sgrna-designer.name", "sgRNA Designer")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.sgrna-designer.description", "Design and score CRISPR sgRNAs with PAM site detection")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 输入区域 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Label className="text-base font-semibold font-mono">
                {t("tools.sgrna-designer.inputSequence", "Target DNA Sequence")}
              </Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-mono whitespace-nowrap">{t("tools.sgrna-designer.pamType", "PAM Type")}:</Label>
                <Select value={pamType} onValueChange={(value) => setPamType(value as PAMType)}>
                  <SelectTrigger className="w-[180px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGG" className="font-mono">
                      NGG (SpCas9)
                    </SelectItem>
                    <SelectItem value="NG" className="font-mono">
                      NG (SpG/SpRY)
                    </SelectItem>
                    <SelectItem value="NRG" className="font-mono">
                      NRG (SaCas9)
                    </SelectItem>
                    <SelectItem value="NNGRRT" className="font-mono">
                      NNGRRT (SaCas9)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t(
                "tools.sgrna-designer.placeholder",
                "Enter target DNA sequence (FASTA format or plain text):\n>Target_Gene\nATGGCTAGCTAGCTAGC..."
              )}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="terminal-input min-h-[150px] font-mono"
              rows={8}
            />
            <div className="flex gap-2">
              <Button onClick={findSgRNAs} className="flex-1 font-mono" disabled={!input.trim()}>
                <Scissors className="w-4 h-4 mr-2" />
                {t("tools.sgrna-designer.findSgRNAs", "Find sgRNAs")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="font-mono">
                {t("common.clear", "Clear")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 结果显示 */}
        {results.length > 0 && (
          <Card className="border-2 border-primary/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono">
                {t("tools.sgrna-designer.foundResults", "Found")} {results.length} sgRNAs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono font-bold w-16">
                        {t("tools.sgrna-designer.position", "Pos")}
                      </TableHead>
                      <TableHead className="font-mono font-bold w-12">
                        {t("tools.sgrna-designer.strand", "Strand")}
                      </TableHead>
                      <TableHead className="font-mono font-bold">
                        {t("tools.sgrna-designer.sequence", "sgRNA Sequence")}
                      </TableHead>
                      <TableHead className="font-mono font-bold w-16">PAM</TableHead>
                      <TableHead className="font-mono font-bold w-16 text-center">GC%</TableHead>
                      <TableHead className="font-mono font-bold w-24 text-center">
                        {t("tools.sgrna-designer.score", "Score")}
                      </TableHead>
                      <TableHead className="font-mono font-bold w-24">
                        {t("tools.sgrna-designer.rating", "Rating")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs">{result.position}</TableCell>
                        <TableCell className="font-mono text-center">
                          <Badge variant="outline" className="font-mono">
                            {result.strand}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs break-all">{result.sequence}</TableCell>
                        <TableCell className="font-mono text-xs">
                          <Badge variant="secondary">{result.pam}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-center">{result.gcContent.toFixed(0)}%</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Progress value={result.score} className="w-16 h-2" />
                            <span className="text-xs font-mono font-bold">{result.score}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRatingStyle(result.rating)} font-mono flex items-center gap-1`}>
                            {getRatingIcon(result.rating)}
                            {t(`tools.sgrna-designer.${result.rating}`, result.rating)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 详细问题列表 */}
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-semibold font-mono">
                  {t("tools.sgrna-designer.detectedIssues", "Detected Issues")}:
                </Label>
                {results
                  .filter((r) => r.issues.length > 0)
                  .slice(0, 5)
                  .map((result, index) => (
                    <Alert key={index} variant="default" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="font-mono text-xs">
                        <span className="font-semibold">Pos {result.position}:</span> {result.issues.join(", ")}
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.length === 0 && input.trim() && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="font-mono text-sm">
              {t("tools.sgrna-designer.noResults", "No sgRNAs found. Try a different sequence or PAM type.")}
            </AlertDescription>
          </Alert>
        )}

        {/* 提示信息 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t(
              "tools.sgrna-designer.tip",
              "Scoring considers GC content (40-60% optimal), poly-T sequences, secondary structure, and 5' G preference. Higher scores indicate better sgRNAs."
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
