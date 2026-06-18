"use client"

import { useState } from "react"
import { useToolStorage } from "@/hooks/use-tool-storage"
import { TryExample } from "@/components/try-example"
import { ResultActions } from "@/components/result-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Copy, Check, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"

// 热力学参数 (简化版，基于最近邻模型)
const THERMODYNAMIC_PARAMS = {
  // 相邻碱基对的焓变 (kcal/mol)
  enthalpy: {
    'AA': -7.9, 'AT': -7.2, 'AC': -8.4, 'AG': -7.8,
    'TA': -7.2, 'TT': -7.9, 'TC': -8.2, 'TG': -8.5,
    'CA': -8.5, 'CT': -7.8, 'CC': -8.0, 'CG': -10.6,
    'GA': -8.2, 'GT': -8.4, 'GC': -9.8, 'GG': -8.0,
  },
  // 相邻碱基对的熵变 (cal/mol·K)
  entropy: {
    'AA': -22.2, 'AT': -20.4, 'AC': -22.4, 'AG': -21.0,
    'TA': -21.3, 'TT': -22.2, 'TC': -22.2, 'TG': -22.7,
    'CA': -22.7, 'CT': -21.0, 'CC': -19.9, 'CG': -27.2,
    'GA': -22.2, 'GT': -22.4, 'GC': -24.4, 'GG': -19.9,
  },
  // 末端惩罚
  terminal: { enthalpy: 0.1, entropy: -2.8 },
  // 对称性惩罚
  symmetry: { enthalpy: 0, entropy: -1.4 }
}

interface DimerResult {
  id: string
  primer1: string
  primer2: string
  primer1Name: string
  primer2Name: string
  complementarity: number
  maxComplementLength: number
  freeEnergy: number
  structure: string
  alignment: {
    primer1Aligned: string
    matchString: string
    primer2Aligned: string
    startPos1: number
    startPos2: number
  }
  risk: 'low' | 'medium' | 'high'
}

export function PrimerDimerDetector() {
  const { t } = useI18n()
  const [primers, setPrimers] = useToolStorage("primer-dimer-detector:input", "")
  const [results, setResults] = useState<DimerResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copied, setCopied] = useState(false)

  // 获取互补碱基
  const getComplement = (base: string): string => {
    const complements: { [key: string]: string } = {
      'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
      'a': 't', 't': 'a', 'g': 'c', 'c': 'g'
    }
    return complements[base] || base
  }

  // 反向互补
  const reverseComplement = (seq: string): string => {
    return seq.split('').reverse().map(getComplement).join('')
  }

  // 计算两个序列的最佳对齐
  const findBestAlignment = (seq1: string, seq2: string) => {
    let bestScore = 0
    let bestAlignment = {
      primer1Aligned: '',
      matchString: '',
      primer2Aligned: '',
      startPos1: 0,
      startPos2: 0,
      score: 0,
      length: 0
    }

    // 尝试所有可能的对齐位置
    for (let i = 0; i < seq1.length; i++) {
      for (let j = 0; j < seq2.length; j++) {
        const alignment = alignSequences(seq1, seq2, i, j)
        if (alignment.score > bestScore) {
          bestScore = alignment.score
          bestAlignment = alignment
        }
      }
    }

    return bestAlignment
  }

  // 对齐两个序列
  const alignSequences = (seq1: string, seq2: string, start1: number, start2: number) => {
    const maxLen = Math.min(seq1.length - start1, seq2.length - start2)
    let score = 0
    let matches = 0
    let primer1Aligned = ''
    let primer2Aligned = ''
    let matchString = ''

    for (let i = 0; i < maxLen; i++) {
      const base1 = seq1[start1 + i]
      const base2 = seq2[start2 + i]
      const isMatch = base1.toUpperCase() === getComplement(base2.toUpperCase())
      
      primer1Aligned += base1
      primer2Aligned += base2
      matchString += isMatch ? '|' : ' '
      
      if (isMatch) {
        matches++
        score += isMatch ? 2 : 0
      }
    }

    return {
      primer1Aligned,
      matchString,
      primer2Aligned,
      startPos1: start1,
      startPos2: start2,
      score,
      length: maxLen
    }
  }

  // 计算自由能 (简化计算)
  const calculateFreeEnergy = (alignment: any): number => {
    if (alignment.length < 3) return 0

    let deltaH = 0
    let deltaS = 0
    let consecutiveMatches = 0

    // 计算连续匹配的热力学参数
    for (let i = 0; i < alignment.length - 1; i++) {
      if (alignment.matchString[i] === '|' && alignment.matchString[i + 1] === '|') {
        const dinuc1 = alignment.primer1Aligned.substring(i, i + 2).toUpperCase()
        const dinuc2 = reverseComplement(alignment.primer2Aligned.substring(i, i + 2)).toUpperCase()
        
        if (THERMODYNAMIC_PARAMS.enthalpy[dinuc1 as keyof typeof THERMODYNAMIC_PARAMS.enthalpy]) {
          deltaH += THERMODYNAMIC_PARAMS.enthalpy[dinuc1 as keyof typeof THERMODYNAMIC_PARAMS.enthalpy]
          deltaS += THERMODYNAMIC_PARAMS.entropy[dinuc1 as keyof typeof THERMODYNAMIC_PARAMS.entropy]
        }
        consecutiveMatches++
      }
    }

    // 添加末端和对称性修正
    deltaH += THERMODYNAMIC_PARAMS.terminal.enthalpy
    deltaS += THERMODYNAMIC_PARAMS.terminal.entropy

    // 计算自由能 ΔG = ΔH - T*ΔS (T = 298K)
    const temperature = 298 // K
    const deltaG = deltaH - (temperature * deltaS / 1000)

    return Math.round(deltaG * 100) / 100
  }

  // 评估二聚体风险
  const assessRisk = (complementarity: number, freeEnergy: number, maxLength: number): 'low' | 'medium' | 'high' => {
    if (freeEnergy < -8 || (complementarity > 70 && maxLength >= 6)) {
      return 'high'
    } else if (freeEnergy < -5 || (complementarity > 50 && maxLength >= 4)) {
      return 'medium'
    }
    return 'low'
  }

  // 分析引物二聚体
  const analyzePrimers = async () => {
    if (!primers.trim()) return

    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    const primerLines = primers
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const primerList: { name: string; sequence: string }[] = []

    // 解析引物（支持FASTA格式或纯序列）
    primerLines.forEach((line, index) => {
      if (line.startsWith('>')) {
        const name = line.substring(1).trim() || `Primer ${index + 1}`
        return
      }

      const prevLine = index > 0 ? primerLines[index - 1] : ''
      const name = prevLine.startsWith('>') 
        ? prevLine.substring(1).trim() || `Primer ${index + 1}`
        : `Primer ${primerList.length + 1}`

      const cleanSeq = line.toUpperCase().replace(/[^ATGC]/g, '')
      if (cleanSeq.length > 0) {
        primerList.push({ name, sequence: cleanSeq })
      }
    })

    const newResults: DimerResult[] = []

    // 分析所有引物对
    for (let i = 0; i < primerList.length; i++) {
      for (let j = i; j < primerList.length; j++) {
        const primer1 = primerList[i]
        const primer2 = primerList[j]

        // 自身二聚体检测
        if (i === j) {
          const selfAlignment = findBestAlignment(primer1.sequence, reverseComplement(primer1.sequence))
          if (selfAlignment.score > 0) {
            const complementarity = Math.round((selfAlignment.score / (primer1.sequence.length * 2)) * 100)
            const freeEnergy = calculateFreeEnergy(selfAlignment)
            const risk = assessRisk(complementarity, freeEnergy, selfAlignment.length)

            newResults.push({
              id: `${i}-${j}-self`,
              primer1: primer1.sequence,
              primer2: reverseComplement(primer1.sequence),
              primer1Name: primer1.name,
              primer2Name: `${primer1.name} (RC)`,
              complementarity,
              maxComplementLength: selfAlignment.length,
              freeEnergy,
              structure: `${selfAlignment.primer1Aligned}\n${selfAlignment.matchString}\n${selfAlignment.primer2Aligned}`,
              alignment: selfAlignment,
              risk
            })
          }
        } else {
          // 异源二聚体检测
          const alignment1 = findBestAlignment(primer1.sequence, reverseComplement(primer2.sequence))
          const alignment2 = findBestAlignment(reverseComplement(primer1.sequence), primer2.sequence)
          
          const bestAlignment = alignment1.score > alignment2.score ? alignment1 : alignment2
          
          if (bestAlignment.score > 0) {
            const complementarity = Math.round((bestAlignment.score / Math.max(primer1.sequence.length, primer2.sequence.length)) * 100)
            const freeEnergy = calculateFreeEnergy(bestAlignment)
            const risk = assessRisk(complementarity, freeEnergy, bestAlignment.length)

            newResults.push({
              id: `${i}-${j}-hetero`,
              primer1: primer1.sequence,
              primer2: primer2.sequence,
              primer1Name: primer1.name,
              primer2Name: primer2.name,
              complementarity,
              maxComplementLength: bestAlignment.length,
              freeEnergy,
              structure: `${bestAlignment.primer1Aligned}\n${bestAlignment.matchString}\n${bestAlignment.primer2Aligned}`,
              alignment: bestAlignment,
              risk
            })
          }
        }
      }
    }

    // 按风险和自由能排序
    newResults.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 }
      if (riskOrder[a.risk] !== riskOrder[b.risk]) {
        return riskOrder[b.risk] - riskOrder[a.risk]
      }
      return a.freeEnergy - b.freeEnergy
    })

    setResults(newResults)
    setIsAnalyzing(false)
  }

  const clearResults = () => {
    setPrimers("")
    setResults([])
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <XCircle className="w-4 h-4 text-red-500" />
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return null
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return ''
    }
  }

  const handleTryExample = (example: Record<string, unknown>) => {
    if (typeof example.primers === "string") setPrimers(example.primers)
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.primer-dimer-detector.name", "Primer Dimer Detector")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.primer-dimer-detector.description", "Detect primer complementarity, calculate dimer formation free energy, visualize structures, batch analysis")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="primers" className="font-mono">
            {t("tools.primer-dimer-detector.primerLabel", "Input Primers")}
          </Label>
          <Textarea
            id="primers"
            placeholder={t("tools.primer-dimer-detector.primerPlaceholder", "Enter primer sequences, one per line or FASTA format\nExample:\n>Forward Primer\nATCGATCGATCG\n>Reverse Primer\nGCTAGCTAGCTA")}
            value={primers}
            onChange={(e) => setPrimers(e.target.value)}
            className="terminal-input min-h-[120px] font-mono"
            rows={6}
          />
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.primer-dimer-detector.formatHint", "💡 Supports FASTA format and plain sequences. Self-dimers and hetero-dimers will be analyzed.")}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={analyzePrimers} 
            className="flex-1 font-mono"
            disabled={isAnalyzing || !primers.trim()}
          >
            {isAnalyzing ? t("common.loading") : t("tools.primer-dimer-detector.analyze", "Analyze Dimers")}
          </Button>
          <Button
            onClick={clearResults}
            variant="outline"
            className="font-mono"
            disabled={!primers.trim() && results.length === 0}
          >
            {t("common.clear")}
          </Button>
          <TryExample
            example={{ primers: ">Forward_Primer\nATCGTACGTTAGCATCG\n>Reverse_Primer\nCGATGCTAACGTACGAT\n>Probe\nTAGCTAGCTAGCTAGCT" }}
            onApply={handleTryExample}
          />
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-mono text-muted-foreground">
                {t("tools.primer-dimer-detector.results", "Analysis Results")} ({results.length} {t("tools.primer-dimer-detector.dimers", "dimers detected")})
              </div>
              <div className="flex gap-2 text-xs font-mono">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>{t("tools.primer-dimer-detector.lowRisk", "Low Risk")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  <span>{t("tools.primer-dimer-detector.mediumRisk", "Medium Risk")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span>{t("tools.primer-dimer-detector.highRisk", "High Risk")}</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="font-mono text-xs">
                  {t("tools.primer-dimer-detector.overview", "Overview")}
                </TabsTrigger>
                <TabsTrigger value="structures" className="font-mono text-xs">
                  {t("tools.primer-dimer-detector.structures", "Structures")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono font-bold w-16">{t("tools.primer-dimer-detector.risk", "Risk")}</TableHead>
                        <TableHead className="font-mono font-bold">{t("tools.primer-dimer-detector.primerPair", "Primer Pair")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-24">{t("tools.primer-dimer-detector.complementarity", "Complement %")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-24">{t("tools.primer-dimer-detector.freeEnergy", "ΔG (kcal/mol)")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-20">{t("tools.primer-dimer-detector.length", "Length")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getRiskIcon(result.risk)}
                              <Badge variant="outline" className={`font-mono text-xs ${getRiskColor(result.risk)}`}>
                                {t(`tools.primer-dimer-detector.${result.risk}Risk`, result.risk)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            <div className="space-y-1">
                              <div className="font-medium">{result.primer1Name} × {result.primer2Name}</div>
                              <div className="text-xs text-muted-foreground">
                                {result.primer1} × {result.primer2.substring(0, 20)}{result.primer2.length > 20 ? '...' : ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {result.complementarity}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={`font-mono ${
                                result.freeEnergy < -8 
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                                  : result.freeEnergy < -5
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : ""
                              }`}
                            >
                              {result.freeEnergy}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {result.maxComplementLength}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="structures" className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono flex items-center gap-2">
                          {getRiskIcon(result.risk)}
                          {result.primer1Name} × {result.primer2Name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`font-mono text-xs ${getRiskColor(result.risk)}`}>
                            {t(`tools.primer-dimer-detector.${result.risk}Risk`, result.risk)}
                          </Badge>
                          <Button
                            onClick={() => copyToClipboard(result.structure)}
                            variant="ghost"
                            size="sm"
                            className="font-mono h-6 px-2"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                {t("common.copied")}
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" />
                                {t("common.copy")}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-xs font-mono">
                        {t("tools.primer-dimer-detector.complementarity")}: {result.complementarity}% | 
                        ΔG: {result.freeEnergy} kcal/mol | 
                        {t("tools.primer-dimer-detector.length")}: {result.maxComplementLength}bp
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/30 rounded p-3 font-mono text-sm overflow-x-auto">
                        <pre className="whitespace-pre-wrap">
                          {result.structure}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            <ResultActions
              rows={results}
              filename="primer-dimer-results"
            />
          </div>
        )}

        {results.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-mono text-sm">
              {t("tools.primer-dimer-detector.warning", "High-risk dimers (ΔG < -8 kcal/mol) may interfere with PCR efficiency. Consider redesigning primers or adjusting reaction conditions.")}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
