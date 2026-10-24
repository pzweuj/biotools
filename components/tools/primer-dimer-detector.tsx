"use client"

import { useEffect, useState } from "react"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"
import { useToolStorage } from "@/hooks/use-tool-storage"
import { TryExample } from "@/components/try-example"
import { ResultActions } from "@/components/result-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, AlertTriangle } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  analyzePrimerDimerPair,
  formatPrimerDimerAlignment,
  parseFasta,
  copyText,
  splitPrimerLine,
  PRIMER_DIMER_SCREEN,
} from "@/lib/bio"
import type { PrimerDimerAlignment } from "@/lib/bio"

const EXAMPLE = {
  primers: ">Forward\nATCGATCGATCGATCGGGGG\n>Reverse\nCCCCATGCTAGCTAGCTAGC",
}

const EXPORT_HEADERS = [
  "primer1Name",
  "primer2Name",
  "primer1",
  "primer2",
  "type",
  "pairCount",
  "overlapIdentity",
  "longestRun",
  "primer1ThreePrimeRun",
  "primer2ThreePrimeRun",
  "primer1ThreePrimeGc",
  "primer2ThreePrimeGc",
  "duplexStructure",
  "threePrimeStructure",
]

const NOTABLE_BADGE = "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"

interface DimerResult {
  id: string
  primer1: string
  primer2: string
  primer1Name: string
  primer2Name: string
  selfDimer: boolean
  duplex: PrimerDimerAlignment
  threePrime: PrimerDimerAlignment | null
  duplexStructure: string
  threePrimeStructure: string
}

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

function endRuns(result: DimerResult) {
  return {
    first: result.threePrime?.primer1ThreePrimeRun ?? 0,
    second: result.threePrime?.primer2ThreePrimeRun ?? 0,
    firstGc: result.threePrime?.primer1ThreePrimeGc ?? 0,
    secondGc: result.threePrime?.primer2ThreePrimeGc ?? 0,
  }
}

function endSum(result: DimerResult): number {
  const runs = endRuns(result)
  return runs.first + runs.second
}

function isNotable(result: DimerResult): boolean {
  const runs = endRuns(result)
  return Math.max(runs.first, runs.second) >= PRIMER_DIMER_SCREEN.threePrimeRun
    || result.duplex.longestRun >= PRIMER_DIMER_SCREEN.longestRun
}

export function PrimerDimerDetector() {
  const { t } = useI18n()
  const [primers, setPrimers] = useToolStorage("primer-dimer-detector:input", "")
  const [results, setResults] = useState<DimerResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [onlyNotable, setOnlyNotable] = useState(true)
  const [tab, setTab] = useState("overview")
  const [pendingScroll, setPendingScroll] = useState<string | null>(null)

  const thresholds = { end: PRIMER_DIMER_SCREEN.threePrimeRun, run: PRIMER_DIMER_SCREEN.longestRun }
  const visible = onlyNotable ? results.filter(isNotable) : results
  const endHits = results.filter((result) => Math.max(endRuns(result).first, endRuns(result).second) >= PRIMER_DIMER_SCREEN.threePrimeRun).length
  const runHits = results.filter((result) => result.duplex.longestRun >= PRIMER_DIMER_SCREEN.longestRun).length

  useEffect(() => {
    if (tab !== "structures" || !pendingScroll) return
    const frame = requestAnimationFrame(() => {
      document.getElementById(pendingScroll)?.scrollIntoView({ behavior: "smooth", block: "start" })
      setPendingScroll(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [tab, pendingScroll])

  const text = (key: string, fallback: string, values?: Record<string, string | number>) => {
    const template = t(`tools.primer-dimer-detector.${key}`, fallback)
    return values ? fill(template, values) : template
  }

  const defaultName = (index: number) => text("defaultName", "Primer {index}", { index })

  const invalidSequence = (name: string, sequence: string): string | null => {
    const invalid = [...sequence].findIndex((character) => !/[ACGT]/.test(character))
    if (invalid < 0) return null
    return text("invalidCharacter", "Primer {name}: invalid character \"{character}\" at position {position}. Only A, C, G and T are allowed.", {
      name,
      position: invalid + 1,
      character: sequence[invalid] ?? "",
    })
  }

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
        const name = record.id || record.description || defaultName(primerList.length + 1)
        const invalid = invalidSequence(name, sequence)
        if (invalid) {
          setError(invalid)
          setResults([])
          setIsAnalyzing(false)
          return
        }
        primerList.push({ name, sequence })
      }
    } else {
      for (const line of primers.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)) {
        const split = splitPrimerLine(line)
        const name = split.name ?? defaultName(primerList.length + 1)
        const invalid = invalidSequence(name, split.sequence)
        if (invalid) {
          setError(invalid)
          setResults([])
          setIsAnalyzing(false)
          return
        }
        if (!split.sequence) continue
        primerList.push({ name, sequence: split.sequence })
      }
    }
    if (primerList.length === 0) {
      setError(text("noSequence", "No primer sequence was found"))
      setResults([])
      setIsAnalyzing(false)
      return
    }
    const next: DimerResult[] = []
    for (let i = 0; i < primerList.length; i++) {
      for (let j = i; j < primerList.length; j++) {
        const first = primerList[i]
        const second = primerList[j]
        const report = analyzePrimerDimerPair(first.sequence, second.sequence)
        const sameAlignment = report.threePrime?.offset === report.duplex.offset
        next.push({
          id: `${i}-${j}`,
          primer1: first.sequence,
          primer2: second.sequence,
          primer1Name: first.name,
          primer2Name: second.name,
          selfDimer: i === j,
          duplex: report.duplex,
          threePrime: report.threePrime,
          duplexStructure: report.duplex.pairCount === 0 ? "" : formatPrimerDimerAlignment(report.duplex),
          threePrimeStructure: report.threePrime && !sameAlignment ? formatPrimerDimerAlignment(report.threePrime) : "",
        })
      }
    }
    next.sort((a, b) => endSum(b) - endSum(a) || b.duplex.longestRun - a.duplex.longestRun || b.duplex.pairCount - a.duplex.pairCount)
    setResults(next)
    setTab("overview")
    setIsAnalyzing(false)
  }

  const clearResults = () => {
    setPrimers("")
    setResults([])
    setError(null)
  }

  const copyAlignment = async (id: string, value: string) => {
    try {
      await copyText(value)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 2000)
    } catch {
      // The alignment remains visible when clipboard access is unavailable.
    }
  }

  const openStructure = (id: string) => {
    setTab("structures")
    setPendingScroll(`dimer-${id}`)
  }

  const exportRows = results.map((result) => {
    const runs = endRuns(result)
    return {
      primer1Name: result.primer1Name,
      primer2Name: result.primer2Name,
      primer1: result.primer1,
      primer2: result.primer2,
      type: result.selfDimer ? text("self", "Self-dimer") : text("hetero", "Hetero-dimer"),
      pairCount: result.duplex.pairCount,
      overlapIdentity: result.duplex.overlapIdentity.toFixed(1),
      longestRun: result.duplex.longestRun,
      primer1ThreePrimeRun: runs.first,
      primer2ThreePrimeRun: runs.second,
      primer1ThreePrimeGc: runs.firstGc,
      primer2ThreePrimeGc: runs.secondGc,
      duplexStructure: result.duplexStructure,
      threePrimeStructure: result.threePrimeStructure,
    }
  })

  const runLabel = (run: number, gc: number) => run === 0 ? "0 bp" : `${run} bp · ${gc} GC`

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>{text("name", "Primer Dimer Detector")}</ToolPageTitle>
        <ToolPageDescription>{text("description", "Exhaustive Watson–Crick screen with separate 3′-end and duplex alignments")}</ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        <div className="space-y-2">
          <Label htmlFor="primers">{text("primerLabel", "Input Primers")}</Label>
          <Textarea
            id="primers"
            placeholder={text("primerPlaceholder", "One primer per line, Name SEQUENCE, or FASTA")}
            value={primers}
            onChange={(event) => { setPrimers(event.target.value); setResults([]); setError(null) }}
            className="terminal-input min-h-[120px] font-mono"
            rows={6}
          />
          <div className="text-xs text-muted-foreground leading-relaxed">{text("formatHint", "Each pair reports a 3′ alignment and a duplex alignment.", thresholds)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={analyzePrimers} className="flex-1" disabled={isAnalyzing || !primers.trim()}>{isAnalyzing ? t("common.loading") : text("analyze", "Analyze Dimers")}</Button>
          <Button onClick={clearResults} variant="outline" disabled={!primers.trim() && results.length === 0}>{t("common.clear")}</Button>
          <TryExample example={EXAMPLE} onApply={(example) => {
            if (typeof example.primers === "string") {
              setPrimers(example.primers)
              setResults([])
              setError(null)
            }
          }} />
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {text("summary", "{total} pairs, {shown} shown.", { total: results.length, shown: visible.length, endHits, runHits, ...thresholds })}
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="primer-dimer-only-notable"
                checked={onlyNotable}
                onCheckedChange={(checked) => setOnlyNotable(checked === true)}
              />
              <Label htmlFor="primer-dimer-only-notable" className="text-sm cursor-pointer">{text("onlyNotable", "Show only pairs that reach a threshold")}</Label>
            </div>
            {visible.length === 0 ? (
              <Alert>
                <AlertDescription className="flex flex-col gap-3">
                  <span>{text("noneNotable", "No pair reaches a screening threshold.", thresholds)}</span>
                  <Button variant="outline" size="sm" className="w-fit" onClick={() => setOnlyNotable(false)}>{text("showAll", "Show all")}</Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">{text("overview", "Overview")}</TabsTrigger>
                  <TabsTrigger value="structures">{text("structures", "Structures")}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-3">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{text("primerPair", "Primer Pair")}</TableHead>
                          <TableHead className="text-center">{text("pairCount", "Paired bases")}</TableHead>
                          <TableHead className="text-center">{text("overlapIdentity", "Overlap identity")}</TableHead>
                          <TableHead className="text-center">{text("longestRun", "Longest run")}</TableHead>
                          <TableHead className="text-center">{text("threePrimeFirst", "First 3′")}</TableHead>
                          <TableHead className="text-center">{text("threePrimeSecond", "Second 3′")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.map((result) => {
                          const runs = endRuns(result)
                          return (
                            <TableRow
                              key={result.id}
                              className="cursor-pointer"
                              tabIndex={0}
                              title={text("showStructure", "Show alignment")}
                              onClick={() => openStructure(result.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault()
                                  openStructure(result.id)
                                }
                              }}
                            >
                              <TableCell className="font-mono">
                                <div>{result.primer1Name} × {result.primer2Name}</div>
                                {result.selfDimer && <Badge variant="secondary" className="mt-1">{text("self", "Self-dimer")}</Badge>}
                              </TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{result.duplex.pairCount}</Badge></TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{result.duplex.overlapIdentity.toFixed(1)}%</Badge></TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn(result.duplex.longestRun >= PRIMER_DIMER_SCREEN.longestRun && NOTABLE_BADGE)}>
                                  {result.duplex.longestRun} bp
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">{result.primer1Name}</div>
                                <Badge variant="outline" className={cn(runs.first >= PRIMER_DIMER_SCREEN.threePrimeRun && NOTABLE_BADGE)}>
                                  {runLabel(runs.first, runs.firstGc)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">{result.primer2Name}</div>
                                <Badge variant="outline" className={cn(runs.second >= PRIMER_DIMER_SCREEN.threePrimeRun && NOTABLE_BADGE)}>
                                  {runLabel(runs.second, runs.secondGc)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">{text("metricsNote", "3′ numbers come from the strongest 3′ alignment.")}</p>
                </TabsContent>
                <TabsContent value="structures" className="space-y-6">
                  {visible.map((result) => {
                    const sameAlignment = result.threePrime !== null && result.threePrime.offset === result.duplex.offset
                    const alignmentNote = (alignment: PrimerDimerAlignment) => text("cardSummary", "{pairs} paired bases", {
                      pairs: alignment.pairCount,
                      identity: alignment.overlapIdentity.toFixed(1),
                      run: alignment.longestRun,
                      name1: result.primer1Name,
                      name2: result.primer2Name,
                      run1: alignment.primer1ThreePrimeRun,
                      run2: alignment.primer2ThreePrimeRun,
                      gc1: alignment.primer1ThreePrimeGc,
                      gc2: alignment.primer2ThreePrimeGc,
                    })
                    const duplexNote = alignmentNote(result.duplex)
                    return (
                      <div key={result.id} id={`dimer-${result.id}`} className="space-y-3 scroll-mt-24">
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <span>{result.primer1Name} × {result.primer2Name}</span>
                          {result.selfDimer && <Badge variant="secondary">{text("self", "Self-dimer")}</Badge>}
                        </div>
                        {result.duplex.pairCount === 0 ? (
                          <Card className="border"><CardContent className="pt-6 text-sm text-muted-foreground">{text("noWatsonCrick", "No Watson–Crick pairs")}</CardContent></Card>
                        ) : (
                          <>
                            <AlignmentCard
                              cardId={`${result.id}-duplex`}
                              title={sameAlignment ? `${text("duplexAlignment", "Strongest duplex")} · ${text("threePrimeAlignment", "Strongest 3′ pairing")}` : text("duplexAlignment", "Strongest duplex")}
                              note={sameAlignment ? `${duplexNote} ${text("sameAlignment", "This alignment is both the strongest duplex and the strongest 3′ pairing.")}` : duplexNote}
                              structure={result.duplexStructure}
                              copied={copiedId === `${result.id}-duplex`}
                              copyLabel={t("common.copy")}
                              copiedLabel={t("common.copied")}
                              onCopy={() => copyAlignment(`${result.id}-duplex`, result.duplexStructure)}
                            />
                            {result.threePrime && result.threePrimeStructure && (
                              <AlignmentCard
                                cardId={`${result.id}-end`}
                                title={text("threePrimeAlignment", "Strongest 3′ pairing")}
                                note={alignmentNote(result.threePrime)}
                                structure={result.threePrimeStructure}
                                copied={copiedId === `${result.id}-end`}
                                copyLabel={t("common.copy")}
                                copiedLabel={t("common.copied")}
                                onCopy={() => copyAlignment(`${result.id}-end`, result.threePrimeStructure)}
                              />
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </TabsContent>
              </Tabs>
            )}
            <ResultActions rows={exportRows} headers={EXPORT_HEADERS} filename="primer-dimer-results" />
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{text("warning", "Highlighting is a screening threshold, not a thermodynamic ΔG.", thresholds)}</AlertDescription>
            </Alert>
          </div>
        )}
      </ToolPageContent>
    </ToolPage>
  )
}

function AlignmentCard({
  cardId,
  title,
  note,
  structure,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: {
  cardId: string
  title: string
  note: string
  structure: string
  copied: boolean
  copyLabel: string
  copiedLabel: string
  onCopy: () => void
}) {
  return (
    <Card id={cardId} className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Button onClick={onCopy} variant="ghost" size="sm">
            {copied ? <><Check className="w-3 h-3 mr-1" />{copiedLabel}</> : <><Copy className="w-3 h-3 mr-1" />{copyLabel}</>}
          </Button>
        </div>
        <CardDescription>{note}</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted/30 rounded p-3 font-mono text-sm overflow-x-auto whitespace-pre">{structure}</pre>
      </CardContent>
    </Card>
  )
}
