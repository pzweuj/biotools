"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n"

interface BaseStats {
  A: number
  T: number
  G: number
  C: number
  N: number
  other: number
}

interface SequenceResult {
  id: number
  name: string
  originalSequence: string
  cleanSequence: string
  length: number
  gcContent: number
  atContent: number
  baseStats: BaseStats
  basePercentages: BaseStats
  complexity: number
  repeats: RepeatInfo[]
  dinucleotideFreq: { [key: string]: number }
}

interface RepeatInfo {
  sequence: string
  count: number
  positions: number[]
  length: number
}

export function SequenceStats() {
  const { t } = useI18n()
  const [sequences, setSequences] = useState("")
  const [results, setResults] = useState<SequenceResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 计算序列复杂度 (Shannon entropy)
  const calculateComplexity = (sequence: string): number => {
    const bases = ['A', 'T', 'G', 'C']
    const length = sequence.length
    if (length === 0) return 0

    let entropy = 0
    bases.forEach(base => {
      const count = (sequence.match(new RegExp(base, 'g')) || []).length
      if (count > 0) {
        const probability = count / length
        entropy -= probability * Math.log2(probability)
      }
    })

    // 归一化到0-100范围
    return Math.round((entropy / 2) * 100)
  }

  // 检测重复序列
  const findRepeats = (sequence: string, minLength: number = 3, minCount: number = 2): RepeatInfo[] => {
    const repeats: { [key: string]: RepeatInfo } = {}
    const maxLength = Math.min(20, Math.floor(sequence.length / 2)) // 限制最大重复长度

    for (let len = minLength; len <= maxLength; len++) {
      for (let i = 0; i <= sequence.length - len; i++) {
        const subseq = sequence.substring(i, i + len)
        
        // 跳过全是相同碱基的序列
        if (new Set(subseq).size === 1) continue

        if (!repeats[subseq]) {
          repeats[subseq] = {
            sequence: subseq,
            count: 0,
            positions: [],
            length: len
          }
        }
        
        repeats[subseq].count++
        repeats[subseq].positions.push(i + 1) // 1-based position
      }
    }

    // 过滤并排序
    return Object.values(repeats)
      .filter(repeat => repeat.count >= minCount)
      .sort((a, b) => {
        // 按重要性排序：先按出现次数，再按长度
        if (b.count !== a.count) return b.count - a.count
        return b.length - a.length
      })
      .slice(0, 10) // 只保留前10个最重要的重复
  }

  // 计算二核苷酸频率
  const calculateDinucleotideFreq = (sequence: string): { [key: string]: number } => {
    const dinucleotides = ['AA', 'AT', 'AG', 'AC', 'TA', 'TT', 'TG', 'TC', 'GA', 'GT', 'GG', 'GC', 'CA', 'CT', 'CG', 'CC']
    const freq: { [key: string]: number } = {}
    
    dinucleotides.forEach(di => {
      freq[di] = 0
    })

    for (let i = 0; i < sequence.length - 1; i++) {
      const dinuc = sequence.substring(i, i + 2)
      if (freq.hasOwnProperty(dinuc)) {
        freq[dinuc]++
      }
    }

    return freq
  }

  const analyzeSequences = async () => {
    if (!sequences.trim()) return

    setIsAnalyzing(true)
    
    // 添加延迟以显示加载状态
    await new Promise(resolve => setTimeout(resolve, 100))

    const sequenceLines = sequences
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const newResults: SequenceResult[] = []

    sequenceLines.forEach((line, index) => {
      let name = `Sequence ${index + 1}`
      let sequence = line

      // 检查是否是FASTA格式
      if (line.startsWith('>')) {
        name = line.substring(1).trim() || name
        return // FASTA header行，跳过
      }

      // 如果前一行是FASTA header，使用它作为名称
      if (index > 0 && sequenceLines[index - 1].startsWith('>')) {
        name = sequenceLines[index - 1].substring(1).trim() || name
      }

      const cleanSeq = sequence.toUpperCase().replace(/[^ATCGN]/g, "")
      if (cleanSeq.length === 0) return

      const length = cleanSeq.length
      
      // 计算碱基统计
      const baseStats: BaseStats = {
        A: (cleanSeq.match(/A/g) || []).length,
        T: (cleanSeq.match(/T/g) || []).length,
        G: (cleanSeq.match(/G/g) || []).length,
        C: (cleanSeq.match(/C/g) || []).length,
        N: (cleanSeq.match(/N/g) || []).length,
        other: length - (cleanSeq.match(/[ATGCN]/g) || []).length
      }

      // 计算百分比
      const basePercentages: BaseStats = {
        A: Math.round((baseStats.A / length) * 100 * 10) / 10,
        T: Math.round((baseStats.T / length) * 100 * 10) / 10,
        G: Math.round((baseStats.G / length) * 100 * 10) / 10,
        C: Math.round((baseStats.C / length) * 100 * 10) / 10,
        N: Math.round((baseStats.N / length) * 100 * 10) / 10,
        other: Math.round((baseStats.other / length) * 100 * 10) / 10
      }

      const gcContent = Math.round(((baseStats.G + baseStats.C) / length) * 100 * 10) / 10
      const atContent = Math.round(((baseStats.A + baseStats.T) / length) * 100 * 10) / 10
      const complexity = calculateComplexity(cleanSeq)
      const repeats = findRepeats(cleanSeq)
      const dinucleotideFreq = calculateDinucleotideFreq(cleanSeq)

      newResults.push({
        id: index + 1,
        name,
        originalSequence: sequence,
        cleanSequence: cleanSeq,
        length,
        gcContent,
        atContent,
        baseStats,
        basePercentages,
        complexity,
        repeats,
        dinucleotideFreq
      })
    })

    setResults(newResults)
    setIsAnalyzing(false)
  }

  const clearResults = () => {
    setSequences("")
    setResults([])
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.sequence-stats.name")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.sequence-stats.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sequences" className="font-mono">
            {t("tools.sequence-stats.sequenceLabel")}
          </Label>
          <Textarea
            id="sequences"
            placeholder={t("tools.sequence-stats.sequencePlaceholder")}
            value={sequences}
            onChange={(e) => setSequences(e.target.value)}
            className="terminal-input min-h-[120px] font-mono"
            rows={6}
          />
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.sequence-stats.formatHint")}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={analyzeSequences} 
            className="flex-1 font-mono"
            disabled={isAnalyzing || !sequences.trim()}
          >
            {isAnalyzing ? t("common.loading") : t("tools.sequence-stats.analyze")}
          </Button>
          <Button 
            onClick={clearResults} 
            variant="outline" 
            className="font-mono"
            disabled={!sequences.trim() && results.length === 0}
          >
            {t("common.clear")}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-mono text-muted-foreground">
                {t("tools.sequence-stats.results")} ({results.length} {t("tools.sequence-stats.sequences")})
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="font-mono text-xs">
                  {t("tools.sequence-stats.overview")}
                </TabsTrigger>
                <TabsTrigger value="composition" className="font-mono text-xs">
                  {t("tools.sequence-stats.composition")}
                </TabsTrigger>
                <TabsTrigger value="repeats" className="font-mono text-xs">
                  {t("tools.sequence-stats.repeats")}
                </TabsTrigger>
                <TabsTrigger value="dinucleotide" className="font-mono text-xs">
                  {t("tools.sequence-stats.dinucleotide")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono font-bold">{t("tools.sequence-stats.sequenceName")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-20">{t("tools.sequence-stats.length")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-24">{t("tools.sequence-stats.gcContent")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-24">{t("tools.sequence-stats.atContent")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-24">{t("tools.sequence-stats.complexity")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono">
                            <div className="font-medium">{result.name}</div>
                            <div className="text-xs text-muted-foreground break-all">
                              {result.cleanSequence.length > 50 
                                ? `${result.cleanSequence.substring(0, 50)}...` 
                                : result.cleanSequence}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {result.length.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={`font-mono ${
                                result.gcContent >= 40 && result.gcContent <= 60 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                  : ""
                              }`}
                            >
                              {result.gcContent}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {result.atContent}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={`font-mono ${
                                result.complexity >= 70 
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
                                  : result.complexity >= 40
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {result.complexity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="composition" className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-mono">{result.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(['A', 'T', 'G', 'C'] as const).map((base) => (
                          <div key={base} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-lg">{base}</span>
                              <span className="font-mono text-sm">
                                {result.baseStats[base]} ({result.basePercentages[base]}%)
                              </span>
                            </div>
                            <Progress 
                              value={result.basePercentages[base]} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                      {(result.baseStats.N > 0 || result.baseStats.other > 0) && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground font-mono space-y-1">
                            {result.baseStats.N > 0 && (
                              <div>N: {result.baseStats.N} ({result.basePercentages.N}%)</div>
                            )}
                            {result.baseStats.other > 0 && (
                              <div>{t("tools.sequence-stats.other")}: {result.baseStats.other} ({result.basePercentages.other}%)</div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="repeats" className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-mono">{result.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {t("tools.sequence-stats.repeatsFound")}: {result.repeats.length}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {result.repeats.length > 0 ? (
                        <div className="space-y-2">
                          {result.repeats.map((repeat, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <div className="font-mono">
                                <span className="font-bold">{repeat.sequence}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({repeat.length}bp)
                                </span>
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary" className="font-mono">
                                  {repeat.count}x
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {t("tools.sequence-stats.positions")}: {repeat.positions.slice(0, 5).join(', ')}
                                  {repeat.positions.length > 5 && '...'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground font-mono text-sm py-4">
                          {t("tools.sequence-stats.noRepeats")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="dinucleotide" className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-mono">{result.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {t("tools.sequence-stats.dinucleotideFreq")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {Object.entries(result.dinucleotideFreq)
                          .sort(([,a], [,b]) => b - a)
                          .map(([dinuc, count]) => (
                          <div key={dinuc} className="flex justify-between items-center p-1 bg-muted/20 rounded font-mono">
                            <span className="font-bold">{dinuc}</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
