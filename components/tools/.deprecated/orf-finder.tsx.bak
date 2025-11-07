"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n"

// 标准遗传密码表
const GENETIC_CODE: { [key: string]: string } = {
  'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
  'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
  'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
  'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
  'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
  'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
  'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
  'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
  'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
  'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
  'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
  'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
  'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
  'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
  'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
  'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
}

// 氨基酸分子量表 (Da)
const AMINO_ACID_WEIGHTS: { [key: string]: number } = {
  'A': 89.09, 'R': 174.20, 'N': 132.12, 'D': 133.10, 'C': 121.15,
  'E': 147.13, 'Q': 146.15, 'G': 75.07, 'H': 155.16, 'I': 131.17,
  'L': 131.17, 'K': 146.19, 'M': 149.21, 'F': 165.19, 'P': 115.13,
  'S': 105.09, 'T': 119.12, 'W': 204.23, 'Y': 181.19, 'V': 117.15
}

interface ORF {
  frame: number
  start: number
  end: number
  length: number
  dnaSequence: string
  proteinSequence: string
  startCodon: string
  stopCodon: string
  molecularWeight: number
  strand: '+' | '-'
}

interface SequenceResult {
  name: string
  sequence: string
  orfs: ORF[]
  totalOrfs: number
}

export function OrfFinder() {
  const { t } = useI18n()
  const [sequences, setSequences] = useState("")
  const [minLength, setMinLength] = useState("30")
  const [startCodons, setStartCodons] = useState("ATG")
  const [results, setResults] = useState<SequenceResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 获取反向互补序列
  const getReverseComplement = (sequence: string): string => {
    const complement: { [key: string]: string } = {
      'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
      'a': 't', 't': 'a', 'g': 'c', 'c': 'g'
    }
    return sequence
      .split('')
      .reverse()
      .map(base => complement[base] || base)
      .join('')
  }

  // 翻译DNA序列为蛋白质
  const translateDNA = (dnaSeq: string): string => {
    let protein = ''
    for (let i = 0; i < dnaSeq.length - 2; i += 3) {
      const codon = dnaSeq.substring(i, i + 3).toUpperCase()
      if (codon.length === 3) {
        protein += GENETIC_CODE[codon] || 'X'
      }
    }
    return protein
  }

  // 计算蛋白质分子量
  const calculateMolecularWeight = (proteinSeq: string): number => {
    let weight = 18.015 // 水分子重量 (H2O)
    for (const aa of proteinSeq) {
      if (aa !== '*') {
        weight += AMINO_ACID_WEIGHTS[aa] || 0
      }
    }
    return Math.round(weight * 100) / 100
  }

  // 在单个阅读框中查找ORF
  const findOrfsInFrame = (
    sequence: string, 
    frame: number, 
    strand: '+' | '-', 
    minLen: number,
    startCodonList: string[]
  ): ORF[] => {
    const orfs: ORF[] = []
    const frameSeq = sequence.substring(frame)
    const protein = translateDNA(frameSeq)
    
    let currentStart = -1
    let startCodon = ''
    
    for (let i = 0; i < protein.length; i++) {
      const codonPos = i * 3 + frame
      const codon = frameSeq.substring(i * 3, i * 3 + 3).toUpperCase()
      
      // 检查起始密码子
      if (currentStart === -1 && startCodonList.includes(codon)) {
        currentStart = i
        startCodon = codon
      }
      
      // 检查终止密码子
      if (currentStart !== -1 && protein[i] === '*') {
        const orfLength = (i - currentStart + 1) * 3
        
        if (orfLength >= minLen) {
          const startPos = currentStart * 3 + frame + 1 // 1-based position
          const endPos = i * 3 + frame + 3 // 1-based position
          const dnaSeq = frameSeq.substring(currentStart * 3, i * 3 + 3)
          const protSeq = protein.substring(currentStart, i + 1)
          
          orfs.push({
            frame: strand === '+' ? frame + 1 : -(frame + 1),
            start: startPos,
            end: endPos,
            length: orfLength,
            dnaSequence: dnaSeq,
            proteinSequence: protSeq,
            startCodon,
            stopCodon: codon,
            molecularWeight: calculateMolecularWeight(protSeq.slice(0, -1)), // 排除终止密码子
            strand
          })
        }
        
        currentStart = -1
        startCodon = ''
      }
    }
    
    return orfs
  }

  // 查找所有6个阅读框的ORF
  const findAllOrfs = (sequence: string, minLen: number, startCodonList: string[]): ORF[] => {
    const allOrfs: ORF[] = []
    const cleanSeq = sequence.toUpperCase().replace(/[^ATCG]/g, '')
    const reverseComp = getReverseComplement(cleanSeq)
    
    // 正向3个阅读框
    for (let frame = 0; frame < 3; frame++) {
      const orfs = findOrfsInFrame(cleanSeq, frame, '+', minLen, startCodonList)
      allOrfs.push(...orfs)
    }
    
    // 反向3个阅读框
    for (let frame = 0; frame < 3; frame++) {
      const orfs = findOrfsInFrame(reverseComp, frame, '-', minLen, startCodonList)
      // 调整反向链的位置
      orfs.forEach(orf => {
        const originalStart = orf.start
        const originalEnd = orf.end
        orf.start = cleanSeq.length - originalEnd + 1
        orf.end = cleanSeq.length - originalStart + 1
      })
      allOrfs.push(...orfs)
    }
    
    // 按长度排序
    return allOrfs.sort((a, b) => b.length - a.length)
  }

  const analyzeSequences = async () => {
    if (!sequences.trim()) return

    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    const minLen = parseInt(minLength) || 30
    const startCodonList = startCodons.split(',').map(s => s.trim().toUpperCase())
    
    const sequenceLines = sequences
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const newResults: SequenceResult[] = []
    let currentName = ''
    let currentSequence = ''

    const processSequence = (name: string, seq: string) => {
      if (seq.length === 0) return
      
      const orfs = findAllOrfs(seq, minLen, startCodonList)
      newResults.push({
        name: name || `Sequence ${newResults.length + 1}`,
        sequence: seq,
        orfs,
        totalOrfs: orfs.length
      })
    }

    for (let i = 0; i < sequenceLines.length; i++) {
      const line = sequenceLines[i]
      
      if (line.startsWith('>')) {
        // 处理前一个序列
        if (currentSequence) {
          processSequence(currentName, currentSequence)
        }
        // 开始新序列
        currentName = line.substring(1).trim()
        currentSequence = ''
      } else {
        currentSequence += line.replace(/[^ATCGatcg]/g, '')
      }
    }
    
    // 处理最后一个序列
    if (currentSequence) {
      processSequence(currentName, currentSequence)
    }
    
    // 如果没有FASTA格式，处理为单个序列
    if (newResults.length === 0 && sequences.trim()) {
      const cleanSeq = sequences.replace(/[^ATCGatcg]/g, '')
      if (cleanSeq) {
        processSequence('Input Sequence', cleanSeq)
      }
    }

    setResults(newResults)
    setIsAnalyzing(false)
  }

  const clearResults = () => {
    setSequences("")
    setResults([])
  }

  const getFrameColor = (frame: number): string => {
    const absFrame = Math.abs(frame)
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    ]
    return colors[(absFrame - 1) % 3]
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.orf-finder.name")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.orf-finder.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sequences" className="font-mono">
            {t("tools.orf-finder.sequenceLabel")}
          </Label>
          <Textarea
            id="sequences"
            placeholder={t("tools.orf-finder.sequencePlaceholder")}
            value={sequences}
            onChange={(e) => setSequences(e.target.value)}
            className="terminal-input min-h-[120px] font-mono"
            rows={6}
          />
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.orf-finder.formatHint")}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-length" className="font-mono">
              {t("tools.orf-finder.minLength")}
            </Label>
            <Input
              id="min-length"
              type="number"
              value={minLength}
              onChange={(e) => setMinLength(e.target.value)}
              placeholder="30"
              className="terminal-input"
              min="3"
              step="3"
            />
            <div className="text-xs text-muted-foreground font-mono">
              {t("tools.orf-finder.minLengthHint")}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-codons" className="font-mono">
              {t("tools.orf-finder.startCodons")}
            </Label>
            <Input
              id="start-codons"
              value={startCodons}
              onChange={(e) => setStartCodons(e.target.value)}
              placeholder="ATG,GTG,TTG"
              className="terminal-input"
            />
            <div className="text-xs text-muted-foreground font-mono">
              {t("tools.orf-finder.startCodonsHint")}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground font-mono p-3 bg-muted/30 rounded">
          💡 {t("tools.orf-finder.geneticCodeInfo")}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={analyzeSequences} 
            className="flex-1 font-mono"
            disabled={isAnalyzing || !sequences.trim()}
          >
            {isAnalyzing ? t("common.loading") : t("tools.orf-finder.findOrfs")}
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
                {t("tools.orf-finder.results")} ({results.reduce((sum, r) => sum + r.totalOrfs, 0)} {t("tools.orf-finder.orfsFound")})
              </div>
            </div>

            <Tabs defaultValue="table" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table" className="font-mono text-xs">
                  {t("tools.orf-finder.tableView")}
                </TabsTrigger>
                <TabsTrigger value="details" className="font-mono text-xs">
                  {t("tools.orf-finder.detailView")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="space-y-3">
                {results.map((result, seqIndex) => (
                  <Card key={seqIndex} className="border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-mono">{result.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {t("tools.orf-finder.sequenceLength")}: {result.sequence.length} bp | 
                        {t("tools.orf-finder.orfsFound")}: {result.totalOrfs}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {result.orfs.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-mono font-bold text-center w-16">
                                  {t("tools.orf-finder.frame")}
                                </TableHead>
                                <TableHead className="font-mono font-bold text-center w-20">
                                  {t("tools.orf-finder.strand")}
                                </TableHead>
                                <TableHead className="font-mono font-bold text-center w-24">
                                  {t("tools.orf-finder.start")}
                                </TableHead>
                                <TableHead className="font-mono font-bold text-center w-24">
                                  {t("tools.orf-finder.end")}
                                </TableHead>
                                <TableHead className="font-mono font-bold text-center w-20">
                                  {t("tools.orf-finder.length")}
                                </TableHead>
                                <TableHead className="font-mono font-bold text-center w-24">
                                  {t("tools.orf-finder.startCodon")}
                                </TableHead>
                                <TableHead className="font-mono font-bold text-center w-24">
                                  {t("tools.orf-finder.stopCodon")}
                                </TableHead>
                                <TableHead className="font-mono font-bold text-center w-28">
                                  {t("tools.orf-finder.molecularWeight")}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.orfs.map((orf, orfIndex) => (
                                <TableRow key={orfIndex} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className={`font-mono ${getFrameColor(orf.frame)}`}>
                                      {orf.frame > 0 ? `+${orf.frame}` : orf.frame}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="font-mono">
                                      {orf.strand}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-sm">
                                    {orf.start}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-sm">
                                    {orf.end}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="secondary" className="font-mono">
                                      {orf.length} bp
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center font-mono font-bold text-green-600">
                                    {orf.startCodon}
                                  </TableCell>
                                  <TableCell className="text-center font-mono font-bold text-red-600">
                                    {orf.stopCodon}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-sm">
                                    {orf.molecularWeight.toLocaleString()} Da
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground font-mono text-sm py-4">
                          {t("tools.orf-finder.noOrfsFound")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {results.map((result, seqIndex) => (
                  <div key={seqIndex} className="space-y-3">
                    <h3 className="font-mono font-bold text-lg">{result.name}</h3>
                    {result.orfs.map((orf, orfIndex) => (
                      <Card key={orfIndex} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-mono">
                              ORF #{orfIndex + 1} - {t("tools.orf-finder.frame")} {orf.frame > 0 ? `+${orf.frame}` : orf.frame}
                            </CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline" className={getFrameColor(orf.frame)}>
                                {orf.strand}{Math.abs(orf.frame)}
                              </Badge>
                              <Badge variant="secondary">
                                {orf.length} bp
                              </Badge>
                            </div>
                          </div>
                          <CardDescription className="text-xs font-mono">
                            {t("tools.orf-finder.position")}: {orf.start}-{orf.end} | 
                            {t("tools.orf-finder.molecularWeight")}: {orf.molecularWeight.toLocaleString()} Da
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="font-mono text-xs font-bold">
                              {t("tools.orf-finder.dnaSequence")}:
                            </Label>
                            <div className="mt-1 p-2 bg-muted/30 rounded font-mono text-xs break-all">
                              <span className="text-green-600 font-bold">{orf.startCodon}</span>
                              {orf.dnaSequence.substring(3, orf.dnaSequence.length - 3)}
                              <span className="text-red-600 font-bold">{orf.stopCodon}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="font-mono text-xs font-bold">
                              {t("tools.orf-finder.proteinSequence")}:
                            </Label>
                            <div className="mt-1 p-2 bg-muted/30 rounded font-mono text-xs break-all">
                              <span className="text-green-600 font-bold">M</span>
                              {orf.proteinSequence.substring(1, orf.proteinSequence.length - 1)}
                              <span className="text-red-600 font-bold">*</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
