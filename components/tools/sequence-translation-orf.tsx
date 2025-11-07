"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Dna } from "lucide-react"
import { useI18n } from "@/lib/i18n"

// 遗传密码表
const GENETIC_CODES: Record<string, { name: string; table: Record<string, string> }> = {
  standard: {
    name: "Standard",
    table: {
      UUU: "F", UUC: "F", UUA: "L", UUG: "L",
      CUU: "L", CUC: "L", CUA: "L", CUG: "L",
      AUU: "I", AUC: "I", AUA: "I", AUG: "M",
      GUU: "V", GUC: "V", GUA: "V", GUG: "V",
      UCU: "S", UCC: "S", UCA: "S", UCG: "S",
      CCU: "P", CCC: "P", CCA: "P", CCG: "P",
      ACU: "T", ACC: "T", ACA: "T", ACG: "T",
      GCU: "A", GCC: "A", GCA: "A", GCG: "A",
      UAU: "Y", UAC: "Y", UAA: "*", UAG: "*",
      CAU: "H", CAC: "H", CAA: "Q", CAG: "Q",
      AAU: "N", AAC: "N", AAA: "K", AAG: "K",
      GAU: "D", GAC: "D", GAA: "E", GAG: "E",
      UGU: "C", UGC: "C", UGA: "*", UGG: "W",
      CGU: "R", CGC: "R", CGA: "R", CGG: "R",
      AGU: "S", AGC: "S", AGA: "R", AGG: "R",
      GGU: "G", GGC: "G", GGA: "G", GGG: "G",
    },
  },
  vertebrate_mito: {
    name: "Vertebrate Mitochondrial",
    table: {
      UUU: "F", UUC: "F", UUA: "L", UUG: "L",
      CUU: "L", CUC: "L", CUA: "L", CUG: "L",
      AUU: "I", AUC: "I", AUA: "M", AUG: "M",
      GUU: "V", GUC: "V", GUA: "V", GUG: "V",
      UCU: "S", UCC: "S", UCA: "S", UCG: "S",
      CCU: "P", CCC: "P", CCA: "P", CCG: "P",
      ACU: "T", ACC: "T", ACA: "T", ACG: "T",
      GCU: "A", GCC: "A", GCA: "A", GCG: "A",
      UAU: "Y", UAC: "Y", UAA: "*", UAG: "*",
      CAU: "H", CAC: "H", CAA: "Q", CAG: "Q",
      AAU: "N", AAC: "N", AAA: "K", AAG: "K",
      GAU: "D", GAC: "D", GAA: "E", GAG: "E",
      UGU: "C", UGC: "C", UGA: "W", UGG: "W",
      CGU: "R", CGC: "R", CGA: "R", CGG: "R",
      AGU: "S", AGC: "S", AGA: "*", AGG: "*",
      GGU: "G", GGC: "G", GGA: "G", GGG: "G",
    },
  },
}

// DNA互补配对
const DNA_COMPLEMENT: Record<string, string> = {
  A: "T", T: "A", G: "C", C: "G",
  a: "t", t: "a", g: "c", c: "g",
  N: "N", n: "n",
}

// 氨基酸分子量表 (Da)
const AMINO_ACID_WEIGHTS: { [key: string]: number } = {
  A: 89.09, R: 174.20, N: 132.12, D: 133.10, C: 121.15,
  E: 147.13, Q: 146.15, G: 75.07, H: 155.16, I: 131.17,
  L: 131.17, K: 146.19, M: 149.21, F: 165.19, P: 115.13,
  S: 105.09, T: 119.12, W: 204.23, Y: 181.19, V: 117.15
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

function reverseString(s: string) {
  return s.split("").reverse().join("")
}

function reverseComplement(seq: string) {
  return reverseString(seq.split("").map((b) => DNA_COMPLEMENT[b] ?? b).join(""))
}

function transcribeDNAtoRNA(seq: string) {
  return seq.replace(/T/g, "U").replace(/t/g, "u")
}

function cleanRNA(seq: string) {
  return seq.toUpperCase().replace(/[^ACGU]/g, "")
}

function translateRNA(rna: string, codeKey: string, frame: number, stopMode: "asterisk" | "stop" | "truncate") {
  const table = GENETIC_CODES[codeKey]?.table || GENETIC_CODES.standard.table
  const cleaned = cleanRNA(rna)
  const start = frame - 1
  let protein: string[] = []
  for (let i = start; i + 3 <= cleaned.length; i += 3) {
    const codon = cleaned.slice(i, i + 3) as keyof typeof table
    const aa = table[codon] ?? "X"
    if (aa === "*") {
      if (stopMode === "truncate") break
      protein.push(stopMode === "stop" ? "Stop" : "*")
    } else {
      protein.push(aa)
    }
  }
  return protein.join("")
}

function calculateMolecularWeight(proteinSeq: string): number {
  let weight = 18.015
  for (const aa of proteinSeq) {
    if (aa !== '*' && aa !== 'X') {
      weight += AMINO_ACID_WEIGHTS[aa] || 0
    }
  }
  return Math.round(weight * 100) / 100
}

export function SequenceTranslationOrf() {
  const { t } = useI18n()
  
  // 工具模式：simple（简单翻译）或 orf（ORF查找）
  const [mode, setMode] = useState<"simple" | "orf" | "six-frame">("simple")
  
  // 简单翻译模式
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)
  const [inputType, setInputType] = useState<"DNA" | "RNA">("DNA")
  const [geneticCode, setGeneticCode] = useState<string>("standard")
  const [frame, setFrame] = useState<1 | 2 | 3>(1)
  const [stopMode, setStopMode] = useState<"asterisk" | "stop" | "truncate">("asterisk")
  
  // ORF查找模式
  const [orfSequence, setOrfSequence] = useState("")
  const [minLength, setMinLength] = useState("30")
  const [startCodons, setStartCodons] = useState("ATG")
  const [orfResults, setOrfResults] = useState<{ name: string; sequence: string; orfs: ORF[] }[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // 六框翻译模式
  const [sixFrameInput, setSixFrameInput] = useState("")
  const [sixFrameResults, setSixFrameResults] = useState<{ frame: string; sequence: string }[]>([])

  const codeOptions = useMemo(() => Object.entries(GENETIC_CODES).map(([key, v]) => ({ key, name: v.name })), [])

  // 简单翻译功能
  const handleTranscribe = () => {
    const cleaned = input.replace(/[^ATUGCNatugcn]/g, "")
    setOutput(transcribeDNAtoRNA(cleaned))
  }

  const handleTranslate = () => {
    const rna = inputType === "DNA" ? transcribeDNAtoRNA(input) : input
    setOutput(translateRNA(rna, geneticCode, frame, stopMode))
  }

  const handleReverseComplement = () => {
    setOutput(reverseComplement(input))
  }

  // 六框翻译
  const handleSixFrameTranslation = () => {
    const cleanSeq = sixFrameInput.toUpperCase().replace(/[^ATCG]/g, "")
    if (!cleanSeq) return

    const reverseComp = reverseComplement(cleanSeq)
    const results: { frame: string; sequence: string }[] = []

    // 正向三框
    for (let i = 0; i < 3; i++) {
      const rna = transcribeDNAtoRNA(cleanSeq)
      const protein = translateRNA(rna, geneticCode, i + 1, stopMode)
      results.push({ frame: `+${i + 1}`, sequence: protein })
    }

    // 反向三框
    for (let i = 0; i < 3; i++) {
      const rna = transcribeDNAtoRNA(reverseComp)
      const protein = translateRNA(rna, geneticCode, i + 1, stopMode)
      results.push({ frame: `-${i + 1}`, sequence: protein })
    }

    setSixFrameResults(results)
  }

  // ORF查找功能
  const translateDNA = (dnaSeq: string, codeKey: string): string => {
    const rna = transcribeDNAtoRNA(dnaSeq)
    return translateRNA(rna, codeKey, 1, "asterisk")
  }

  const findOrfsInFrame = (
    sequence: string,
    frame: number,
    strand: '+' | '-',
    minLen: number,
    startCodonList: string[],
    codeKey: string
  ): ORF[] => {
    const orfs: ORF[] = []
    const frameSeq = sequence.substring(frame)
    const protein = translateDNA(frameSeq, codeKey)
    
    let currentStart = -1
    let startCodon = ''
    
    for (let i = 0; i < protein.length; i++) {
      const codon = frameSeq.substring(i * 3, i * 3 + 3).toUpperCase()
      
      if (currentStart === -1 && startCodonList.includes(codon)) {
        currentStart = i
        startCodon = codon
      }
      
      if (currentStart !== -1 && protein[i] === '*') {
        const orfLength = (i - currentStart + 1) * 3
        
        if (orfLength >= minLen) {
          const startPos = currentStart * 3 + frame + 1
          const endPos = i * 3 + frame + 3
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
            molecularWeight: calculateMolecularWeight(protSeq.slice(0, -1)),
            strand
          })
        }
        
        currentStart = -1
        startCodon = ''
      }
    }
    
    return orfs
  }

  const analyzeORFs = async () => {
    if (!orfSequence.trim()) return

    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    const minLen = parseInt(minLength) || 30
    const startCodonList = startCodons.split(',').map(s => s.trim().toUpperCase())
    
    const cleanSeq = orfSequence.toUpperCase().replace(/[^ATCG]/g, "")
    const reverseComp = reverseComplement(cleanSeq)
    const allOrfs: ORF[] = []

    // 正向三框
    for (let frame = 0; frame < 3; frame++) {
      const orfs = findOrfsInFrame(cleanSeq, frame, '+', minLen, startCodonList, geneticCode)
      allOrfs.push(...orfs)
    }

    // 反向三框
    for (let frame = 0; frame < 3; frame++) {
      const orfs = findOrfsInFrame(reverseComp, frame, '-', minLen, startCodonList, geneticCode)
      orfs.forEach(orf => {
        const originalStart = orf.start
        const originalEnd = orf.end
        orf.start = cleanSeq.length - originalEnd + 1
        orf.end = cleanSeq.length - originalStart + 1
      })
      allOrfs.push(...orfs)
    }

    const sortedOrfs = allOrfs.sort((a, b) => b.length - a.length)
    setOrfResults([{ name: t("tools.orf-finder.inputSequence", "Input Sequence"), sequence: cleanSeq, orfs: sortedOrfs }])
    setIsAnalyzing(false)
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setOrfSequence("")
    setOrfResults([])
    setSixFrameInput("")
    setSixFrameResults([])
    setCopied(false)
  }

  const copyToClipboard = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // noop
    }
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
        <CardTitle className="text-balance font-mono text-card-foreground flex items-center gap-2">
          <Dna className="w-5 h-5" />
          {t("tools.sequence-translation.name", "Sequence Translation & ORF Finder")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.sequence-translation.description", "DNA/RNA translation, six-frame translation, and ORF detection in one tool")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 模式选择 */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="simple" className="font-mono text-xs">
              {t("tools.sequence-translation-orf.simpleMode", "Simple Translation")}
            </TabsTrigger>
            <TabsTrigger value="six-frame" className="font-mono text-xs">
              {t("tools.sequence-translation-orf.sixFrame", "Six-Frame Translation")}
            </TabsTrigger>
            <TabsTrigger value="orf" className="font-mono text-xs">
              {t("tools.sequence-translation-orf.orfMode", "ORF Finder")}
            </TabsTrigger>
          </TabsList>

          {/* 简单翻译模式 */}
          <TabsContent value="simple" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-translation.inputType", "Input Type")}</Label>
                <Select value={inputType} onValueChange={(v) => setInputType(v as any)}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNA" className="font-mono">DNA</SelectItem>
                    <SelectItem value="RNA" className="font-mono">RNA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-translation.geneticCode", "Genetic Code")}</Label>
                <Select value={geneticCode} onValueChange={setGeneticCode}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {codeOptions.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key} className="font-mono">{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-translation.frame", "Reading Frame")}</Label>
                <Select value={String(frame)} onValueChange={(v) => setFrame(Number(v) as 1 | 2 | 3)}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" className="font-mono">1</SelectItem>
                    <SelectItem value="2" className="font-mono">2</SelectItem>
                    <SelectItem value="3" className="font-mono">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-translation.stopMode", "Stop Codon")}</Label>
                <Select value={stopMode} onValueChange={(v) => setStopMode(v as any)}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asterisk" className="font-mono">*</SelectItem>
                    <SelectItem value="stop" className="font-mono">Stop</SelectItem>
                    <SelectItem value="truncate" className="font-mono">Truncate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sequence-input" className="font-mono">
                {t("tools.sequence-translation.inputLabel", "Input Sequence")}
              </Label>
              <Textarea
                id="sequence-input"
                placeholder={t("tools.sequence-translation.inputPlaceholder", "Paste DNA or RNA sequence")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="terminal-input min-h-[120px] font-mono"
                rows={5}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleTranscribe} variant="outline" className="font-mono" disabled={inputType !== "DNA"}>
                {t("tools.sequence-translation.transcribe", "DNA → RNA")}
              </Button>
              <Button onClick={handleTranslate} variant="outline" className="font-mono">
                {t("tools.sequence-translation.translate", "Translate to Protein")}
              </Button>
              <Button onClick={handleReverseComplement} variant="outline" className="font-mono">
                {t("tools.sequence-translation.reverseComplement", "Reverse Complement")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="font-mono">
                {t("common.clear")}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sequence-output" className="font-mono">
                  {t("tools.sequence-translation.outputLabel", "Output")}
                </Label>
                {output && (
                  <Button onClick={copyToClipboard} variant="ghost" size="sm" className="font-mono h-8 px-2">
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
                placeholder={t("tools.sequence-translation.outputPlaceholder", "Result will appear here")}
              />
            </div>
          </TabsContent>

          {/* 六框翻译模式 */}
          <TabsContent value="six-frame" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="font-mono">{t("tools.sequence-translation.geneticCode", "Genetic Code")}</Label>
              <Select value={geneticCode} onValueChange={setGeneticCode}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {codeOptions.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key} className="font-mono">{opt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="six-frame-input" className="font-mono">
                {t("tools.sequence-translation-orf.inputLabel", "Input DNA Sequence")}
              </Label>
              <Textarea
                id="six-frame-input"
                placeholder={t("tools.sequence-translation-orf.sixFramePlaceholder", "Enter DNA sequence for six-frame translation")}
                value={sixFrameInput}
                onChange={(e) => setSixFrameInput(e.target.value)}
                className="terminal-input min-h-[120px] font-mono"
                rows={5}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSixFrameTranslation} className="font-mono flex-1">
                {t("tools.sequence-translation-orf.translateSixFrames", "Translate (6 Frames)")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="font-mono">
                {t("common.clear")}
              </Button>
            </div>

            {sixFrameResults.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono font-bold w-24">{t("tools.orf-finder.frame", "Frame")}</TableHead>
                      <TableHead className="font-mono font-bold">{t("tools.orf-finder.proteinSequence", "Protein Sequence")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sixFrameResults.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant="outline" className={`font-mono ${getFrameColor(parseInt(result.frame))}`}>
                            {result.frame}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs break-all">
                          {result.sequence}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ORF查找模式 */}
          <TabsContent value="orf" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="orf-sequence" className="font-mono">
                {t("tools.orf-finder.sequenceLabel", "DNA Sequence")}
              </Label>
              <Textarea
                id="orf-sequence"
                placeholder={t("tools.orf-finder.sequencePlaceholder", "Enter DNA sequence")}
                value={orfSequence}
                onChange={(e) => setOrfSequence(e.target.value)}
                className="terminal-input min-h-[120px] font-mono"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-length" className="font-mono">
                  {t("tools.orf-finder.minLength", "Min Length (bp)")}
                </Label>
                <Input
                  id="min-length"
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                  className="terminal-input"
                  min="3"
                  step="3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-codons" className="font-mono">
                  {t("tools.orf-finder.startCodons", "Start Codons")}
                </Label>
                <Input
                  id="start-codons"
                  value={startCodons}
                  onChange={(e) => setStartCodons(e.target.value)}
                  className="terminal-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-translation.geneticCode", "Genetic Code")}</Label>
                <Select value={geneticCode} onValueChange={setGeneticCode}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {codeOptions.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key} className="font-mono">{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={analyzeORFs} className="flex-1 font-mono" disabled={isAnalyzing}>
                {isAnalyzing ? t("common.loading") : t("tools.orf-finder.findOrfs", "Find ORFs")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="font-mono">
                {t("common.clear")}
              </Button>
            </div>

            {orfResults.length > 0 && orfResults[0].orfs.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-mono text-muted-foreground">
                  {t("tools.orf-finder.results", "Results")}: {orfResults[0].orfs.length} {t("tools.orf-finder.orfsFound", "ORFs found")}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono font-bold text-center">{t("tools.orf-finder.frame", "Frame")}</TableHead>
                        <TableHead className="font-mono font-bold text-center">{t("tools.orf-finder.strand", "Strand")}</TableHead>
                        <TableHead className="font-mono font-bold text-center">{t("tools.orf-finder.start", "Start")}</TableHead>
                        <TableHead className="font-mono font-bold text-center">{t("tools.orf-finder.end", "End")}</TableHead>
                        <TableHead className="font-mono font-bold text-center">{t("tools.orf-finder.length", "Length")}</TableHead>
                        <TableHead className="font-mono font-bold text-center">{t("tools.orf-finder.molecularWeight", "MW (Da)")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orfResults[0].orfs.slice(0, 20).map((orf, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`font-mono ${getFrameColor(orf.frame)}`}>
                              {orf.frame > 0 ? `+${orf.frame}` : orf.frame}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{orf.strand}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">{orf.start}</TableCell>
                          <TableCell className="text-center font-mono text-sm">{orf.end}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="font-mono">{orf.length} bp</Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {orf.molecularWeight.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
