"use client"

import { useMemo, useState } from "react"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"
import { useToolStorage } from "@/hooks/use-tool-storage"
import { TryExample } from "@/components/try-example"
import { ResultActions } from "@/components/result-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import {
  SEQUENCE_FINDER_MIN_QUERY_LENGTH,
  SEQUENCE_MATCH_TYPES,
  findSequenceMatches,
  normalizeSequence,
  normalizeSequenceFinderQuery,
  parseFasta,
  type SequenceMatch,
  type SequenceMatchType,
} from "@/lib/bio"

const LINE_WIDTH = 60

const MATCH_COLORS: Record<SequenceMatchType, string> = {
  forward: "#22c55e",
  reverse: "#3b82f6",
  complement: "#f59e0b",
  "reverse-complement": "#a855f7",
}

const MATCH_BADGE_CLASSES: Record<SequenceMatchType, string> = {
  forward: "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300",
  reverse: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  complement: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  "reverse-complement": "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
}

const MATCH_LABEL_KEYS: Record<SequenceMatchType, string> = {
  forward: "forward",
  reverse: "reverse",
  complement: "complement",
  "reverse-complement": "reverseComplement",
}

const EXPORT_HEADERS = ["record", "type", "start", "end", "length", "matchedSequence"]

interface AnalyzedRecord {
  id: string
  description: string
  sequence: string
  matches: SequenceMatch[]
}

interface SearchOutcome {
  records: AnalyzedRecord[]
  counts: Record<SequenceMatchType, number>
  total: number
}

interface FinderError {
  key: string
  detail?: string
}

interface LineHighlight {
  from: number
  width: number
  type: SequenceMatchType
}

type Translate = (key: string, fallback?: string) => string

function recordLabel(record: { id: string; description: string }, index: number, t: Translate): string {
  return record.id || record.description || t("tools.sequence-finder.unnamedRecord") + " " + (index + 1)
}

function buildLines(sequence: string): { start: number; text: string }[] {
  const lines: { start: number; text: string }[] = []
  for (let start = 0; start < sequence.length; start += LINE_WIDTH) {
    lines.push({ start, text: sequence.slice(start, start + LINE_WIDTH) })
  }
  return lines
}

function buildLineHighlights(matches: SequenceMatch[]): LineHighlight[][] {
  const byLine: LineHighlight[][] = []
  for (const match of matches) {
    const firstLine = Math.floor(match.index / LINE_WIDTH)
    const lastLine = Math.floor((match.index + match.length - 1) / LINE_WIDTH)
    for (let line = firstLine; line <= lastLine; line++) {
      const lineStart = line * LINE_WIDTH
      const from = Math.max(match.index, lineStart) - lineStart
      const to = Math.min(match.index + match.length, lineStart + LINE_WIDTH) - lineStart
      if (to <= from) continue
      byLine[line] = byLine[line] ?? []
      byLine[line].push({ from, width: to - from, type: match.type })
    }
  }
  return byLine
}

function SequenceViewer({ sequence, matches }: { sequence: string; matches: SequenceMatch[] }) {
  const { t } = useI18n()
  const lines = useMemo(() => buildLines(sequence), [sequence])
  const highlights = useMemo(() => buildLineHighlights(matches), [matches])

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="min-w-max p-3 font-mono text-xs leading-6">
        {lines.map((line, lineIndex) => (
          <div key={line.start} className="flex">
            <span className="w-20 shrink-0 select-none pr-3 text-right text-muted-foreground">
              {line.start + 1}
            </span>
            <div className="relative whitespace-pre">
              {(highlights[lineIndex] ?? []).map((highlight, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0"
                  style={{
                    left: highlight.from + "ch",
                    width: highlight.width + "ch",
                    backgroundColor: MATCH_COLORS[highlight.type],
                    opacity: 0.35,
                  }}
                />
              ))}
              <span className="relative z-10">{line.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SequenceFinder() {
  const { t } = useI18n()
  const [fasta, setFasta] = useToolStorage("sequence-finder:fasta", "")
  const [query, setQuery] = useToolStorage("sequence-finder:query", "")
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null)
  const [error, setError] = useState<FinderError | null>(null)

  const clearResults = () => {
    setOutcome(null)
    setError(null)
  }

  const runSearch = () => {
    setOutcome(null)
    setError(null)

    const rawQuery = query.replace(/\s+/g, "").toUpperCase()
    if (!rawQuery) {
      setError({ key: "emptyQuery" })
      return
    }
    if (!/^[ACGT]+$/.test(rawQuery)) {
      setError({ key: "invalidQuery" })
      return
    }
    if (rawQuery.length < SEQUENCE_FINDER_MIN_QUERY_LENGTH) {
      setError({ key: "queryTooShort" })
      return
    }

    const records = parseFasta(fasta)
    if (records.length === 0) {
      setError({ key: "emptyFasta" })
      return
    }

    try {
      const normalizedQuery = normalizeSequenceFinderQuery(rawQuery)
      const analyzed: AnalyzedRecord[] = []
      const counts: Record<SequenceMatchType, number> = {
        forward: 0,
        reverse: 0,
        complement: 0,
        "reverse-complement": 0,
      }
      let total = 0

      for (const [index, record] of records.entries()) {
        const label = recordLabel(record, index, t)
        const normalized = normalizeSequence(record.sequence, "iupac-dna")
        if (normalized.issues.length > 0) {
          const issue = normalized.issues[0]
          setError({
            key: "invalidTemplateCharacter",
            detail: label + " @ " + issue.position + ': "' + issue.character + '"',
          })
          return
        }
        if (normalized.sequence.length === 0) {
          setError({ key: "emptyRecord", detail: label })
          return
        }

        const result = findSequenceMatches(normalized.sequence, normalizedQuery)
        for (const type of SEQUENCE_MATCH_TYPES) {
          counts[type] += result.counts[type]
        }
        total += result.matches.length
        analyzed.push({
          id: record.id,
          description: record.description,
          sequence: normalized.sequence,
          matches: result.matches,
        })
      }

      setOutcome({ records: analyzed, counts, total })
    } catch {
      setError({ key: "invalidTemplate" })
    }
  }

  const clearAll = () => {
    setFasta("")
    setQuery("")
    clearResults()
  }

  const tableRows = useMemo(() => {
    if (!outcome) return []
    return outcome.records.flatMap((record, recordIndex) =>
      record.matches.map((match) => ({
        record: recordLabel(record, recordIndex, t),
        type: t("tools.sequence-finder." + MATCH_LABEL_KEYS[match.type]),
        start: match.start,
        end: match.end,
        length: match.length,
        matchedSequence: match.matchedSequence,
      })),
    )
  }, [outcome, t])

  const tableRowTypes = useMemo(
    () =>
      outcome
        ? outcome.records.flatMap((record) => record.matches.map((match) => match.type))
        : [],
    [outcome],
  )

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>{t("tools.sequence-finder.name")}</ToolPageTitle>
        <ToolPageDescription>{t("tools.sequence-finder.description")}</ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        <div className="space-y-2">
          <Label htmlFor="sequence-finder-fasta">{t("tools.sequence-finder.fastaLabel")}</Label>
          <Textarea
            id="sequence-finder-fasta"
            placeholder={t("tools.sequence-finder.fastaPlaceholder")}
            value={fasta}
            onChange={(event) => {
              setFasta(event.target.value)
              clearResults()
            }}
            className="terminal-input min-h-[180px] font-mono"
            rows={8}
          />
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.sequence-finder.fastaHint")}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sequence-finder-query">{t("tools.sequence-finder.queryLabel")}</Label>
          <Input
            id="sequence-finder-query"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value.toUpperCase())
              clearResults()
            }}
            placeholder={t("tools.sequence-finder.queryPlaceholder")}
            className="terminal-input font-mono"
          />
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.sequence-finder.queryHint")}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={runSearch} className="flex-1" disabled={!fasta.trim() || !query.trim()}>
            {t("tools.sequence-finder.search")}
          </Button>
          <Button onClick={clearAll} variant="outline">
            {t("common.clear")}
          </Button>
        </div>

        <TryExample
          example={{
            fasta: ">finder-demo\nTTTTAGCTTGACAAAACAGTTCGACCCCTCGAACTGGGGGGTCAAGCTTTTTAGCTTGACGGGGCCCCAA",
            query: "AGCTTGAC",
          }}
          onApply={(example) => {
            setFasta(example.fasta as string)
            setQuery(example.query as string)
            clearResults()
          }}
        />

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t("tools.sequence-finder." + error.key)}
              {error.detail ? " — " + error.detail : ""}
            </AlertDescription>
          </Alert>
        )}

        {outcome && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-mono text-muted-foreground">
                <span>{t("tools.sequence-finder.results")}</span>
                <span className="text-border">|</span>
                <span>{outcome.records.length} {t("tools.sequence-finder.records")}</span>
                <span className="text-border">|</span>
                <span>{outcome.total} {t("tools.sequence-finder.matches")}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {SEQUENCE_MATCH_TYPES.map((type) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-mono"
                  >
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: MATCH_COLORS[type] }}
                    />
                    <span>{t("tools.sequence-finder." + MATCH_LABEL_KEYS[type])}</span>
                    <span className="font-semibold tabular-nums">{outcome.counts[type]}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                {t("tools.sequence-finder.overlapHint")}
              </div>
            </div>

            {outcome.total === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="font-medium">{t("tools.sequence-finder.noMatches")}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("tools.sequence-finder.noMatchesHint")}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {outcome.records.map((record, recordIndex) => {
                const label = recordLabel(record, recordIndex, t)
                return (
                  <div key={recordIndex} className="space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="break-all font-mono text-sm font-semibold">{">"}{label}</span>
                      {record.id && record.description && (
                        <span className="break-all text-xs text-muted-foreground">
                          {record.description}
                        </span>
                      )}
                      <Badge variant="outline" className="font-mono text-xs">
                        {record.sequence.length} bp
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {record.matches.length} {t("tools.sequence-finder.matches")}
                      </Badge>
                    </div>

                    {record.matches.length > 0 ? (
                      <SequenceViewer sequence={record.sequence} matches={record.matches} />
                    ) : (
                      <div className="rounded-md border border-dashed px-3 py-2 font-mono text-xs text-muted-foreground">
                        {t("tools.sequence-finder.noMatchesInRecord")}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {outcome.total > 0 && (
              <div className="space-y-3">
                <div className="font-mono text-sm font-medium">
                  {t("tools.sequence-finder.matchTable")}
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 font-mono font-bold">#</TableHead>
                        <TableHead className="font-mono font-bold">
                          {t("tools.sequence-finder.record")}
                        </TableHead>
                        <TableHead className="font-mono font-bold">
                          {t("tools.sequence-finder.type")}
                        </TableHead>
                        <TableHead className="text-right font-mono font-bold">
                          {t("tools.sequence-finder.start")}
                        </TableHead>
                        <TableHead className="text-right font-mono font-bold">
                          {t("tools.sequence-finder.end")}
                        </TableHead>
                        <TableHead className="text-center font-mono font-bold">
                          {t("tools.sequence-finder.length")}
                        </TableHead>
                        <TableHead className="font-mono font-bold">
                          {t("tools.sequence-finder.matchedSequence")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableRows.map((row, index) => (
                        <TableRow key={index} className="transition-colors hover:bg-muted/50">
                          <TableCell className="text-center font-mono text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="break-all font-mono text-xs">{row.record}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={"font-mono text-xs " + MATCH_BADGE_CLASSES[tableRowTypes[index]]}
                            >
                              {row.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">{row.start}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{row.end}</TableCell>
                          <TableCell className="text-center font-mono">{row.length}</TableCell>
                          <TableCell className="break-all font-mono text-xs">
                            {row.matchedSequence}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ResultActions
                  rows={tableRows}
                  headers={EXPORT_HEADERS}
                  filename="sequence-finder-results"
                />
              </div>
            )}
          </div>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {t("tools.sequence-finder.coordinateConvention")}
          </AlertDescription>
        </Alert>
      </ToolPageContent>
    </ToolPage>
  )
}
