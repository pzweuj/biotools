"use client"

import { useState } from "react"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"
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
import { Copy, Check, AlertTriangle } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { findBestPrimerDimerAlignment, parseFasta, copyText } from "@/lib/bio"
import type { PrimerDimerAlignment } from "@/lib/bio"

interface DimerResult {
  id: string
  primer1: string
  primer2: string
  primer1Name: string
  primer2Name: string
  pairCount: number
  complementarity: number
  longestRun: number
  primer1ThreePrimeRun: number
  primer2ThreePrimeRun: number
  structure: string
  alignment: PrimerDimerAlignment
}

function formatAlignment(alignment: PrimerDimerAlignment): string {
  const pad = " ".repeat(Math.max(alignment.primer1Aligned.length, alignment.primer2Aligned.length) - alignment.primer1Aligned.length)
  return `5′ ${alignment.primer1Aligned}${pad} 3′\n   ${alignment.matchString}\n3′ ${alignment.primer2Aligned} 5′`
}

export function PrimerDimerDetector() {
  const { t } = useI18n()
  const [primers, setPrimers] = useToolStorage("primer-dimer-detector:input", "")
  const [results, setResults] = useState<DimerResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzePrimers = async () => {
    if (!primers.trim()) return
    setIsAnalyzing(true)
    setError(null)
    await new Promise((resolve) => setTimeout(resolve, 20))
    const primerList: { name: string; sequence: string }[] = []
    if (primers.includes(">")) {
      for (const record of parseFasta(primers)) {
        const sequence = record.sequence.toUpperCase().replace(/\s+/g, "")
        if (!sequence) continue
        if (!/^[ACGT]+$/.test(sequence)) {
          const invalid = [...sequence].findIndex((character) => !/[ACGT]/.test(character))
          setError(`Primer ${record.id || primerList.length + 1}: invalid character "${sequence[invalid]}" at sequence position ${invalid + 1}`)
          setResults([])
          setIsAnalyzing(false)
          return
        }
        primerList.push({ name: record.id || record.description || `Primer ${primerList.length + 1}`, sequence })
      }
    } else {
      for (const [index, line] of primers.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).entries()) {
        const sequence = line.toUpperCase().replace(/\s+/g, "")
        if (!/^[ACGT]+$/.test(sequence)) {
          const invalid = [...sequence].findIndex((character) => !/[ACGT]/.test(character))
          setError(`Primer ${index + 1}: invalid character "${sequence[invalid]}" at sequence position ${invalid + 1}`)
          setResults([])
          setIsAnalyzing(false)
          return
        }
        primerList.push({ name: `Primer ${index + 1}`, sequence })
      }
    }
    if (primerList.length === 0) {
      setError("No primer sequence was found")
      setResults([])
      setIsAnalyzing(false)
      return
    }
    const next: DimerResult[] = []
    for (let i = 0; i < primerList.length; i++) {
      for (let j = i; j < primerList.length; j++) {
        const first = primerList[i]
        const second = primerList[j]
        const alignment = findBestPrimerDimerAlignment(first.sequence, second.sequence)
        next.push({
          id: `${i}-${j}`,
          primer1: first.sequence,
          primer2: second.sequence,
          primer1Name: first.name,
          primer2Name: second.name,
          pairCount: alignment.pairCount,
          complementarity: alignment.complementarity,
          longestRun: alignment.longestRun,
          primer1ThreePrimeRun: alignment.primer1ThreePrimeRun,
          primer2ThreePrimeRun: alignment.primer2ThreePrimeRun,
          structure: formatAlignment(alignment),
          alignment,
        })
      }
    }
    next.sort((a, b) => b.primer1ThreePrimeRun + b.primer2ThreePrimeRun - a.primer1ThreePrimeRun - a.primer2ThreePrimeRun || b.longestRun - a.longestRun || b.pairCount - a.pairCount)
    setResults(next)
    setIsAnalyzing(false)
  }

  const clearResults = () => {
    setPrimers("")
    setResults([])
    setError(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await copyText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The result remains visible when clipboard access is unavailable.
    }
  }

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>{t("tools.primer-dimer-detector.name", "Primer Dimer Detector")}</ToolPageTitle>
        <ToolPageDescription>{t("tools.primer-dimer-detector.description", "Screen primer pairs for Watson–Crick complementarity and 3′-end pairing")}</ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        <div className="space-y-2">
          <Label htmlFor="primers">{t("tools.primer-dimer-detector.primerLabel", "Input Primers")}</Label>
          <Textarea id="primers" placeholder={t("tools.primer-dimer-detector.primerPlaceholder", "Enter primer sequences, one per line or FASTA format")} value={primers} onChange={(event) => { setPrimers(event.target.value); setResults([]); setError(null) }} className="terminal-input min-h-[120px] font-mono" rows={6} />
          <div className="text-xs text-muted-foreground font-mono">{t("tools.primer-dimer-detector.formatHint", "The screen reports pair count, longest run, overall complementarity, and 3′-end pairing. It is not a thermodynamic ΔG prediction.")}</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={analyzePrimers} className="flex-1" disabled={isAnalyzing || !primers.trim()}>{isAnalyzing ? t("common.loading") : t("tools.primer-dimer-detector.analyze", "Analyze Primers")}</Button>
          <Button onClick={clearResults} variant="outline" disabled={!primers.trim() && results.length === 0}>{t("common.clear")}</Button>
          <TryExample example={{ primers: ">Forward_Primer\nATCGTACGTTAGCATCG\n>Reverse_Primer\nCGATGCTAACGTACGAT" }} onApply={(example) => { if (typeof example.primers === "string") setPrimers(example.primers) }} />
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-mono text-muted-foreground">{t("tools.primer-dimer-detector.results", "Analysis Results")} ({results.length} {t("tools.primer-dimer-detector.pairs", "pairs")})</div>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="overview">{t("tools.primer-dimer-detector.overview", "Overview")}</TabsTrigger><TabsTrigger value="structures">{t("tools.primer-dimer-detector.structures", "Alignments")}</TabsTrigger></TabsList>
              <TabsContent value="overview" className="space-y-3">
                <div className="border rounded-lg overflow-hidden">
                  <Table><TableHeader><TableRow>
                    <TableHead>{t("tools.primer-dimer-detector.primerPair", "Primer Pair")}</TableHead>
                    <TableHead className="text-center">{t("tools.primer-dimer-detector.pairCount", "Pairs")}</TableHead>
                    <TableHead className="text-center">{t("tools.primer-dimer-detector.complementarity", "Complement %")}</TableHead>
                    <TableHead className="text-center">{t("tools.primer-dimer-detector.longestRun", "Longest run")}</TableHead>
                    <TableHead className="text-center">{t("tools.primer-dimer-detector.threePrimeRun", "3′ runs")}</TableHead>
                  </TableRow></TableHeader><TableBody>
                    {results.map((result) => <TableRow key={result.id}>
                      <TableCell className="font-mono">{result.primer1Name} × {result.primer2Name}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{result.pairCount}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{result.complementarity.toFixed(1)}%</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{result.longestRun} bp</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{result.primer1ThreePrimeRun} / {result.primer2ThreePrimeRun} bp</Badge></TableCell>
                    </TableRow>)}
                  </TableBody></Table>
                </div>
              </TabsContent>
              <TabsContent value="structures" className="space-y-4">
                {results.map((result) => <Card key={result.id} className="border"><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm">{result.primer1Name} × {result.primer2Name}</CardTitle><Button onClick={() => copyToClipboard(result.structure)} variant="ghost" size="sm">{copied ? <><Check className="w-3 h-3 mr-1" />{t("common.copied")}</> : <><Copy className="w-3 h-3 mr-1" />{t("common.copy")}</>}</Button></div><CardDescription>{result.pairCount} paired bases · {result.longestRun} bp longest run · 3′ runs {result.primer1ThreePrimeRun}/{result.primer2ThreePrimeRun} bp</CardDescription></CardHeader><CardContent><pre className="bg-muted/30 rounded p-3 font-mono text-sm overflow-x-auto whitespace-pre-wrap">{result.structure}</pre></CardContent></Card>)}
              </TabsContent>
            </Tabs>
            <ResultActions rows={results} filename="primer-dimer-results" />
            <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>{t("tools.primer-dimer-detector.warning", "Complementarity is a screening signal. Confirm primer performance with an appropriate thermodynamic tool and experiment.")}</AlertDescription></Alert>
          </div>
        )}
      </ToolPageContent>
    </ToolPage>
  )
}
