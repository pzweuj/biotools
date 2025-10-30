"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "@/lib/i18n"
import { Dna, AlertTriangle, TrendingUp, Info } from "lucide-react"

// 大肠杆菌密码子使用频率表（每千个密码子）
const E_COLI_CODON_USAGE: { [key: string]: number } = {
  TTT: 22.0, TTC: 16.5, TTA: 13.4, TTG: 13.2, CTT: 11.0, CTC: 10.5, CTA: 4.0, CTG: 52.4,
  ATT: 30.1, ATC: 25.6, ATA: 4.6, ATG: 27.3, GTT: 18.6, GTC: 15.3, GTA: 11.5, GTG: 26.1,
  TCT: 8.6, TCC: 8.8, TCA: 7.2, TCG: 8.6, CCT: 7.0, CCC: 5.5, CCA: 8.5, CCG: 23.8,
  ACT: 9.0, ACC: 23.2, ACA: 7.4, ACG: 14.2, GCT: 15.5, GCC: 25.9, GCA: 20.8, GCG: 33.2,
  TAT: 16.3, TAC: 12.2, TAA: 1.9, TAG: 0.2, CAT: 13.2, CAC: 9.9, CAA: 15.3, CAG: 29.3,
  AAT: 18.5, AAC: 22.4, AAA: 33.8, AAG: 10.3, GAT: 32.8, GAC: 19.2, GAA: 39.6, GAG: 18.0,
  TGT: 5.2, TGC: 6.3, TGA: 1.0, TGG: 15.3, CGT: 21.2, CGC: 21.6, CGA: 3.6, CGG: 5.5,
  AGT: 8.9, AGC: 16.1, AGA: 2.1, AGG: 1.2, GGT: 24.8, GGC: 28.8, GGA: 8.6, GGG: 10.9,
}

// 人类密码子使用频率表
const HUMAN_CODON_USAGE: { [key: string]: number } = {
  TTT: 17.6, TTC: 20.3, TTA: 7.7, TTG: 12.9, CTT: 13.2, CTC: 19.6, CTA: 7.2, CTG: 39.6,
  ATT: 16.0, ATC: 20.8, ATA: 7.5, ATG: 22.0, GTT: 11.0, GTC: 14.5, GTA: 7.1, GTG: 28.1,
  TCT: 15.2, TCC: 17.7, TCA: 12.2, TCG: 4.4, CCT: 17.5, CCC: 19.8, CCA: 16.9, CCG: 6.9,
  ACT: 13.1, ACC: 18.9, ACA: 15.1, ACG: 6.1, GCT: 18.4, GCC: 27.7, GCA: 15.8, GCG: 7.4,
  TAT: 12.2, TAC: 15.3, TAA: 1.0, TAG: 0.8, CAT: 10.9, CAC: 15.1, CAA: 12.3, CAG: 34.2,
  AAT: 17.0, AAC: 19.1, AAA: 24.4, AAG: 31.9, GAT: 21.8, GAC: 25.1, GAA: 29.0, GAG: 39.6,
  TGT: 10.6, TGC: 12.6, TGA: 1.6, TGG: 13.2, CGT: 4.5, CGC: 10.4, CGA: 6.2, CGG: 11.4,
  AGT: 12.1, AGC: 19.5, AGA: 12.2, AGG: 12.0, GGT: 10.8, GGC: 22.2, GGA: 16.5, GGG: 16.5,
}

// 酵母密码子使用频率表
const YEAST_CODON_USAGE: { [key: string]: number } = {
  TTT: 26.1, TTC: 18.4, TTA: 26.2, TTG: 27.2, CTT: 12.3, CTC: 5.4, CTA: 13.4, CTG: 10.5,
  ATT: 30.1, ATC: 17.2, ATA: 17.8, ATG: 20.9, GTT: 22.1, GTC: 11.8, GTA: 12.1, GTG: 10.8,
  TCT: 23.4, TCC: 14.2, TCA: 18.7, TCG: 8.6, CCT: 13.5, CCC: 6.8, CCA: 18.3, CCG: 5.3,
  ACT: 20.3, ACC: 12.7, ACA: 18.0, ACG: 8.0, GCT: 21.2, GCC: 12.6, GCA: 16.2, GCG: 6.2,
  TAT: 18.8, TAC: 14.8, TAA: 1.1, TAG: 0.5, CAT: 13.6, CAC: 7.8, CAA: 27.3, CAG: 12.1,
  AAT: 35.7, AAC: 24.8, AAA: 42.0, AAG: 30.8, GAT: 37.6, GAC: 20.2, GAA: 45.6, GAG: 19.2,
  TGT: 8.1, TGC: 4.8, TGA: 0.7, TGG: 10.4, CGT: 6.4, CGC: 2.6, CGA: 3.0, CGG: 1.7,
  AGT: 14.2, AGC: 9.8, AGA: 21.3, AGG: 9.2, GGT: 23.9, GGC: 9.8, GGA: 10.9, GGG: 6.0,
}

// 遗传密码表
const GENETIC_CODE: { [key: string]: string } = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L", CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M", GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S", CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T", GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*", CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K", GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W", CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R", GGT: "G", GGC: "G", GGA: "G", GGG: "G",
}

type Organism = "ecoli" | "human" | "yeast"

interface CodonAnalysis {
  sequence: string
  name: string
  length: number
  gcContent: number
  cai: number
  codonUsage: { [key: string]: number }
  rareCodeons: Array<{ position: number; codon: string; aa: string; frequency: number }>
  aaComposition: { [key: string]: number }
}

export function CodonOptimizer() {
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [organism, setOrganism] = useState<Organism>("ecoli")
  const [result, setResult] = useState<CodonAnalysis | null>(null)

  // 获取密码子使用表
  const getCodonUsage = (org: Organism) => {
    switch (org) {
      case "ecoli":
        return E_COLI_CODON_USAGE
      case "human":
        return HUMAN_CODON_USAGE
      case "yeast":
        return YEAST_CODON_USAGE
      default:
        return E_COLI_CODON_USAGE
    }
  }

  // 解析序列
  const parseSequence = (text: string): { name: string; sequence: string } => {
    const lines = text.split("\n").map((line) => line.trim())
    let name = "Sequence"
    let sequence = ""

    for (const line of lines) {
      if (line.startsWith(">")) {
        name = line.substring(1).trim() || "Sequence"
      } else {
        sequence += line.replace(/[^ATCGatcg]/g, "").toUpperCase()
      }
    }

    return { name, sequence }
  }

  // 计算GC含量
  const calculateGC = (seq: string): number => {
    const gc = (seq.match(/[GC]/g) || []).length
    return (gc / seq.length) * 100
  }

  // 计算CAI (Codon Adaptation Index)
  const calculateCAI = (codons: string[], codonUsage: { [key: string]: number }): number => {
    if (codons.length === 0) return 0

    // 计算每个氨基酸的最大频率
    const maxFrequency: { [key: string]: number } = {}
    for (const codon in codonUsage) {
      const aa = GENETIC_CODE[codon]
      if (aa && aa !== "*") {
        if (!maxFrequency[aa] || codonUsage[codon] > maxFrequency[aa]) {
          maxFrequency[aa] = codonUsage[codon]
        }
      }
    }

    // 计算相对适应性
    let sumLog = 0
    let count = 0
    for (const codon of codons) {
      const aa = GENETIC_CODE[codon]
      if (aa && aa !== "*" && maxFrequency[aa]) {
        const relativeAdaptiveness = codonUsage[codon] / maxFrequency[aa]
        if (relativeAdaptiveness > 0) {
          sumLog += Math.log(relativeAdaptiveness)
          count++
        }
      }
    }

    return count > 0 ? Math.exp(sumLog / count) : 0
  }

  // 分析序列
  const analyzeSequence = () => {
    if (!input.trim()) return

    const { name, sequence } = parseSequence(input)
    if (sequence.length < 3) return

    const codonUsage = getCodonUsage(organism)
    const codons: string[] = []
    const codonCount: { [key: string]: number } = {}
    const aaComposition: { [key: string]: number } = {}
    const rareCodeons: Array<{ position: number; codon: string; aa: string; frequency: number }> = []

    // 提取密码子
    for (let i = 0; i < sequence.length - 2; i += 3) {
      const codon = sequence.substring(i, i + 3)
      if (codon.length === 3 && GENETIC_CODE[codon]) {
        codons.push(codon)
        codonCount[codon] = (codonCount[codon] || 0) + 1

        const aa = GENETIC_CODE[codon]
        if (aa !== "*") {
          aaComposition[aa] = (aaComposition[aa] || 0) + 1
        }

        // 检测稀有密码子（频率 < 10）
        if (codonUsage[codon] < 10) {
          rareCodeons.push({
            position: Math.floor(i / 3) + 1,
            codon,
            aa: GENETIC_CODE[codon],
            frequency: codonUsage[codon],
          })
        }
      }
    }

    const gcContent = calculateGC(sequence)
    const cai = calculateCAI(codons, codonUsage)

    setResult({
      sequence,
      name,
      length: sequence.length,
      gcContent,
      cai,
      codonUsage: codonCount,
      rareCodeons,
      aaComposition,
    })
  }

  const clearAll = () => {
    setInput("")
    setResult(null)
  }

  // 获取CAI评级
  const getCAIRating = (cai: number) => {
    if (cai >= 0.8) return { label: t("tools.codon-optimizer.excellent", "Excellent"), color: "bg-green-500" }
    if (cai >= 0.6) return { label: t("tools.codon-optimizer.good", "Good"), color: "bg-blue-500" }
    if (cai >= 0.4) return { label: t("tools.codon-optimizer.moderate", "Moderate"), color: "bg-yellow-500" }
    return { label: t("tools.codon-optimizer.poor", "Poor"), color: "bg-red-500" }
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.codon-optimizer.name", "Codon Usage Analyzer")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.codon-optimizer.description", "Analyze codon usage bias and calculate CAI for different organisms")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 输入区域 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold font-mono">
                {t("tools.codon-optimizer.inputSequence", "Input DNA Sequence")}
              </Label>
              <Select value={organism} onValueChange={(value) => setOrganism(value as Organism)}>
                <SelectTrigger className="w-40 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecoli" className="font-mono">
                    E. coli
                  </SelectItem>
                  <SelectItem value="human" className="font-mono">
                    {t("tools.codon-optimizer.human", "Human")}
                  </SelectItem>
                  <SelectItem value="yeast" className="font-mono">
                    {t("tools.codon-optimizer.yeast", "Yeast")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t(
                "tools.codon-optimizer.placeholder",
                "Enter DNA sequence (FASTA format or plain text):\n>Gene1\nATGGCTAGCTAGCTAGC..."
              )}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="terminal-input min-h-[150px] font-mono"
              rows={8}
            />
            <div className="flex gap-2">
              <Button onClick={analyzeSequence} className="flex-1 font-mono" disabled={!input.trim()}>
                <Dna className="w-4 h-4 mr-2" />
                {t("tools.codon-optimizer.analyze", "Analyze")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="font-mono">
                {t("common.clear", "Clear")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 结果显示 */}
        {result && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="font-mono">
                {t("tools.codon-optimizer.overview", "Overview")}
              </TabsTrigger>
              <TabsTrigger value="rare-codons" className="font-mono">
                {t("tools.codon-optimizer.rareCodeons", "Rare Codons")}
              </TabsTrigger>
              <TabsTrigger value="composition" className="font-mono">
                {t("tools.codon-optimizer.composition", "Composition")}
              </TabsTrigger>
            </TabsList>

            {/* 概览 */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono">{result.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-mono">
                        {t("tools.codon-optimizer.sequenceLength", "Sequence Length")}
                      </div>
                      <div className="text-lg font-bold font-mono">{result.length} bp</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-mono">
                        {t("tools.codon-optimizer.gcContent", "GC Content")}
                      </div>
                      <div className="text-lg font-bold font-mono">{result.gcContent.toFixed(2)}%</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-semibold">
                        {t("tools.codon-optimizer.cai", "Codon Adaptation Index (CAI)")}
                      </span>
                      <Badge className={`${getCAIRating(result.cai).color} text-white font-mono`}>
                        {getCAIRating(result.cai).label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={result.cai * 100} className="flex-1" />
                      <span className="text-lg font-bold font-mono min-w-[60px] text-right">
                        {result.cai.toFixed(3)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {t("tools.codon-optimizer.caiDesc", "CAI ranges from 0 to 1. Higher values indicate better codon optimization.")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-mono">
                      {t("tools.codon-optimizer.rareCodonCount", "Rare Codons")}: {result.rareCodeons.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 稀有密码子 */}
            <TabsContent value="rare-codons" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {t("tools.codon-optimizer.rareCodensTitle", "Rare Codons (Frequency < 10/1000)")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.rareCodeons.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-mono font-bold">
                              {t("tools.codon-optimizer.position", "Position")}
                            </TableHead>
                            <TableHead className="font-mono font-bold">
                              {t("tools.codon-optimizer.codon", "Codon")}
                            </TableHead>
                            <TableHead className="font-mono font-bold">
                              {t("tools.codon-optimizer.aminoAcid", "AA")}
                            </TableHead>
                            <TableHead className="font-mono font-bold">
                              {t("tools.codon-optimizer.frequency", "Frequency")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.rareCodeons.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{item.position}</TableCell>
                              <TableCell className="font-mono">
                                <Badge variant="outline">{item.codon}</Badge>
                              </TableCell>
                              <TableCell className="font-mono">{item.aa}</TableCell>
                              <TableCell className="font-mono">
                                <Badge variant="destructive">{item.frequency.toFixed(1)}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="font-mono text-sm">
                        {t("tools.codon-optimizer.noRareCodens", "No rare codons detected. Sequence is well optimized!")}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 氨基酸组成 */}
            <TabsContent value="composition" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono">
                    {t("tools.codon-optimizer.aaComposition", "Amino Acid Composition")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(result.aaComposition)
                      .sort((a, b) => b[1] - a[1])
                      .map(([aa, count]) => (
                        <div key={aa} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-mono font-semibold">{aa}</span>
                          <Badge variant="outline" className="font-mono">
                            {count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* 提示信息 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t(
              "tools.codon-optimizer.tip",
              "CAI measures how well a gene's codon usage matches the host organism. Rare codons may slow translation or reduce expression."
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
