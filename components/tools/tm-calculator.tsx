"use client"

import { useEffect, useState } from "react"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"
import { useToolStorage } from "@/hooks/use-tool-storage"
import { TryExample } from "@/components/try-example"
import { ResultActions } from "@/components/result-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import {
  DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS,
  tmBasicGc,
  tmNearestNeighbor,
  tmSaltAdjusted,
  tmWallace,
} from "@/lib/bio"

type TmMethod = "nearest-neighbor" | "wallace" | "basic-gc" | "salt-adjusted"

interface PrimerResult {
  sequence: string
  cleanSequence: string
  tm: number
  length: number
  gcContent: number
}

interface InvalidLine {
  line: number
  sequence: string
  reason: string
}

interface TmParameters {
  oligoConcentrationNM: number
  monovalentMM: number
  magnesiumMM: number
  dntpMM: number
}

const METHOD_LABEL_KEYS: Record<TmMethod, string> = {
  "nearest-neighbor": "nearestNeighbor",
  wallace: "wallace",
  "basic-gc": "basicGc",
  "salt-adjusted": "saltAdjusted",
}

const METHOD_DESCRIPTION_KEYS: Record<TmMethod, string> = {
  "nearest-neighbor": "nearestNeighborDescription",
  wallace: "wallaceDescription",
  "basic-gc": "basicGcDescription",
  "salt-adjusted": "saltAdjustedDescription",
}

const EXPORT_HEADERS = [
  "sequence",
  "cleanSequence",
  "length",
  "gcContent",
  "tm",
  "method",
  "oligoConcentration",
  "monovalent",
  "magnesium",
  "dntp",
]

function normalizeMethod(value: string): TmMethod {
  if (value === "wallace" || value === "basic-gc" || value === "salt-adjusted") return value
  // The old SantaLucia and nearest-neighbor entries both now point to the
  // single real nearest-neighbor implementation.
  return "nearest-neighbor"
}

function parseFiniteNumber(raw: string, name: string, minimum: number, strictMinimum = false): number {
  if (!raw.trim()) throw new RangeError(`${name} is required`)
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`)
  if (strictMinimum ? value <= minimum : value < minimum) {
    throw new RangeError(`${name} is out of range`)
  }
  return value
}

export function TmCalculator() {
  const { t } = useI18n()
  const [sequences, setSequences] = useToolStorage("tm-calculator:sequences", "")
  const [saltConc, setSaltConc] = useToolStorage("tm-calculator:saltConc", String(DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.monovalentMM))
  const [storedMethod, setStoredMethod] = useToolStorage("tm-calculator:method", "nearest-neighbor")
  const [oligoConcentrationNM, setOligoConcentrationNM] = useToolStorage(
    "tm-calculator:oligoConcentrationNM",
    String(DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.oligoConcentrationNM),
  )
  const [magnesiumMM, setMagnesiumMM] = useToolStorage(
    "tm-calculator:magnesiumMM",
    String(DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.magnesiumMM),
  )
  const [dntpMM, setDntpMM] = useToolStorage(
    "tm-calculator:dntpMM",
    String(DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.dntpMM),
  )
  const [results, setResults] = useState<PrimerResult[]>([])
  const [invalidLines, setInvalidLines] = useState<InvalidLine[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const method = normalizeMethod(storedMethod)
  const showNearestNeighborParameters = method === "nearest-neighbor"
  const showSaltParameter = method === "nearest-neighbor" || method === "salt-adjusted"

  // Migrate unknown/legacy values in the existing session storage lazily.
  useEffect(() => {
    if (storedMethod !== method) setStoredMethod(method)
  }, [method, setStoredMethod, storedMethod])

  const clearResults = () => {
    setResults([])
    setInvalidLines([])
    setFormError(null)
  }

  const updateSequences = (value: string) => {
    setSequences(value)
    clearResults()
  }

  const updateSalt = (value: string) => {
    setSaltConc(value)
    clearResults()
  }

  const updateMethod = (value: string) => {
    setStoredMethod(normalizeMethod(value))
    clearResults()
  }

  const updateOligoConcentration = (value: string) => {
    setOligoConcentrationNM(value)
    clearResults()
  }

  const updateMagnesium = (value: string) => {
    setMagnesiumMM(value)
    clearResults()
  }

  const updateDntp = (value: string) => {
    setDntpMM(value)
    clearResults()
  }

  const calculateTm = () => {
    clearResults()
    if (!sequences.trim()) return

    let parsedParameters: TmParameters
    try {
      const monovalent = showSaltParameter
        ? parseFiniteNumber(saltConc, "monovalentMM", 0, method === "salt-adjusted")
        : DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.monovalentMM
      const oligo = showNearestNeighborParameters
        ? parseFiniteNumber(oligoConcentrationNM, "oligoConcentrationNM", 0, true)
        : DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.oligoConcentrationNM
      const magnesium = showNearestNeighborParameters
        ? parseFiniteNumber(magnesiumMM, "magnesiumMM", 0)
        : DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.magnesiumMM
      const dntp = showNearestNeighborParameters
        ? parseFiniteNumber(dntpMM, "dntpMM", 0)
        : DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.dntpMM

      if (showNearestNeighborParameters && !(monovalent + 120 * Math.sqrt(Math.max(magnesium - dntp, 0)) > 0)) {
        throw new RangeError("effective monovalent ion concentration must be greater than zero")
      }

      parsedParameters = {
        oligoConcentrationNM: oligo,
        monovalentMM: monovalent,
        magnesiumMM: magnesium,
        dntpMM: dntp,
      }
    } catch {
      setFormError(t("tools.tm-calculator.invalidParameters"))
      return
    }

    const nextResults: PrimerResult[] = []
    const nextInvalidLines: InvalidLine[] = []

    sequences.split(/\r?\n/).forEach((rawLine, index) => {
      const original = rawLine.trim()
      if (!original) return
      const cleaned = original.replace(/\s+/g, "").toUpperCase()

      if (!/^[ACGT]+$/.test(cleaned)) {
        nextInvalidLines.push({ line: index + 1, sequence: original, reason: t("tools.tm-calculator.invalidSequence") })
        return
      }
      if (method === "nearest-neighbor" && cleaned.length < 2) {
        nextInvalidLines.push({ line: index + 1, sequence: original, reason: t("tools.tm-calculator.sequenceTooShort") })
        return
      }

      try {
        let tm: number
        switch (method) {
          case "nearest-neighbor":
            tm = tmNearestNeighbor(cleaned, parsedParameters)
            break
          case "wallace":
            tm = tmWallace(cleaned)
            break
          case "basic-gc":
            tm = tmBasicGc(cleaned)
            break
          case "salt-adjusted":
            tm = tmSaltAdjusted(cleaned, parsedParameters.monovalentMM)
            break
        }

        const gc = (cleaned.match(/[GC]/g) || []).length
        nextResults.push({
          sequence: original,
          cleanSequence: cleaned,
          tm: Math.round(tm * 10) / 10,
          length: cleaned.length,
          gcContent: Math.round((gc / cleaned.length) * 1000) / 10,
        })
      } catch {
        nextInvalidLines.push({ line: index + 1, sequence: original, reason: t("tools.tm-calculator.calculationFailed") })
      }
    })

    setResults(nextResults)
    setInvalidLines(nextInvalidLines)
  }

  const methodLabel = t(`tools.tm-calculator.${METHOD_LABEL_KEYS[method]}`)
  const parameterSummary = showNearestNeighborParameters
    ? `${t("tools.tm-calculator.oligoConcentrationLabel")}: ${oligoConcentrationNM} nM · ${t("tools.tm-calculator.monovalentLabel")}: ${saltConc} mM · ${t("tools.tm-calculator.magnesiumLabel")}: ${magnesiumMM} mM · ${t("tools.tm-calculator.dntpLabel")}: ${dntpMM} mM`
    : showSaltParameter
      ? `${t("tools.tm-calculator.monovalentLabel")}: ${saltConc} mM`
      : t("tools.tm-calculator.noParameters")

  const exportRows = results.map((result) => ({
    sequence: result.sequence,
    cleanSequence: result.cleanSequence,
    length: result.length,
    gcContent: `${result.gcContent}%`,
    tm: `${result.tm} °C`,
    method: methodLabel,
    oligoConcentration: showNearestNeighborParameters ? `${oligoConcentrationNM} nM` : "",
    monovalent: showSaltParameter ? `${saltConc} mM` : "",
    magnesium: showNearestNeighborParameters ? `${magnesiumMM} mM` : "",
    dntp: showNearestNeighborParameters ? `${dntpMM} mM` : "",
  }))

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>{t("tools.tm-calculator.name")}</ToolPageTitle>
        <ToolPageDescription>{t("tools.tm-calculator.description")}</ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        <div className="space-y-2">
          <Label htmlFor="primer-sequences">{t("tools.tm-calculator.sequenceLabel")}</Label>
          <Textarea
            id="primer-sequences"
            placeholder={t("tools.tm-calculator.sequencePlaceholder")}
            value={sequences}
            onChange={(event) => updateSequences(event.target.value)}
            className="terminal-input min-h-[120px] font-mono"
            rows={5}
          />
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.tm-calculator.multipleSequencesHint")}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("tools.tm-calculator.methodLabel")}</Label>
          <Select value={method} onValueChange={updateMethod}>
            <SelectTrigger className="terminal-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nearest-neighbor">{t("tools.tm-calculator.nearestNeighbor")}</SelectItem>
              <SelectItem value="wallace">{t("tools.tm-calculator.wallace")}</SelectItem>
              <SelectItem value="basic-gc">{t("tools.tm-calculator.basicGc")}</SelectItem>
              <SelectItem value="salt-adjusted">{t("tools.tm-calculator.saltAdjusted")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground font-mono">
            {t(`tools.tm-calculator.${METHOD_DESCRIPTION_KEYS[method]}`)}
          </div>
        </div>

        {(showNearestNeighborParameters || showSaltParameter) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {showNearestNeighborParameters && (
              <div className="space-y-2">
                <Label htmlFor="oligo-concentration">{t("tools.tm-calculator.oligoConcentrationLabel")}</Label>
                <Input id="oligo-concentration" type="number" min="0" value={oligoConcentrationNM} onChange={(event) => updateOligoConcentration(event.target.value)} className="terminal-input" />
              </div>
            )}
            {showSaltParameter && (
              <div className="space-y-2">
                <Label htmlFor="salt-concentration">{t("tools.tm-calculator.monovalentLabel")}</Label>
                <Input id="salt-concentration" type="number" min="0" value={saltConc} onChange={(event) => updateSalt(event.target.value)} className="terminal-input" />
              </div>
            )}
            {showNearestNeighborParameters && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="magnesium-concentration">{t("tools.tm-calculator.magnesiumLabel")}</Label>
                  <Input id="magnesium-concentration" type="number" min="0" value={magnesiumMM} onChange={(event) => updateMagnesium(event.target.value)} className="terminal-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dntp-concentration">{t("tools.tm-calculator.dntpLabel")}</Label>
                  <Input id="dntp-concentration" type="number" min="0" value={dntpMM} onChange={(event) => updateDntp(event.target.value)} className="terminal-input" />
                </div>
              </>
            )}
          </div>
        )}

        {showNearestNeighborParameters && (
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.tm-calculator.nearestNeighborParametersHint")}
          </div>
        )}

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Button onClick={calculateTm} className="w-full">{t("tools.tm-calculator.calculate")}</Button>

        <TryExample
          example={{
            sequences: "ATCGTACGTTAGCATCGATCG\nTAGCTAGCTAGCTAGCTGCTA\nCGTACGATCGTAGCTAGCTA",
            saltConc: String(DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.monovalentMM),
            oligoConcentrationNM: String(DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.oligoConcentrationNM),
            magnesiumMM: String(DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.magnesiumMM),
            dntpMM: String(DEFAULT_TM_NEAREST_NEIGHBOR_OPTIONS.dntpMM),
            method: "nearest-neighbor",
          }}
          onApply={(example) => {
            updateSequences(example.sequences as string)
            updateSalt(example.saltConc as string)
            updateOligoConcentration(example.oligoConcentrationNM as string)
            updateMagnesium(example.magnesiumMM as string)
            updateDntp(example.dntpMM as string)
            updateMethod(example.method as string)
          }}
        />

        {invalidLines.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-5">
                {invalidLines.map((invalid) => (
                  <li key={`${invalid.line}-${invalid.sequence}`}>
                    {t("tools.tm-calculator.lineLabel")} {invalid.line}: <span className="font-mono">{invalid.sequence}</span> — {invalid.reason}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-mono text-muted-foreground">
                {t("tools.tm-calculator.results")} ({results.length} {t("tools.tm-calculator.primers")})
              </div>
              <div className="text-xs font-mono text-muted-foreground sm:text-right">
                <div>{t("tools.tm-calculator.algorithm")}: {methodLabel}</div>
                <div>{parameterSummary}</div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono font-bold">{t("tools.tm-calculator.sequence")}</TableHead>
                    <TableHead className="font-mono font-bold text-center w-20">{t("tools.tm-calculator.length")}</TableHead>
                    <TableHead className="font-mono font-bold text-center w-24">{t("tools.tm-calculator.gcContent")}</TableHead>
                    <TableHead className="font-mono font-bold text-center w-24">{t("tools.tm-calculator.tmValue")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((primer, index) => (
                    <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono">
                        <div className="break-all text-sm">{primer.sequence}</div>
                        {primer.sequence !== primer.cleanSequence && (
                          <div className="text-xs text-muted-foreground mt-1">{t("tools.tm-calculator.cleaned")}: {primer.cleanSequence}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className="font-mono">{primer.length}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`font-mono ${primer.gcContent >= 40 && primer.gcContent <= 60 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}`}>
                          {primer.gcContent}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center"><Badge variant="default" className="font-mono font-bold text-lg">{primer.tm}°C</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ResultActions
              rows={exportRows}
              headers={EXPORT_HEADERS}
              fasta={results.map((result, index) => ({ id: `primer_${index + 1}`, sequence: result.cleanSequence }))}
              filename="tm-calculator-results"
            />
          </div>
        )}
      </ToolPageContent>
    </ToolPage>
  )
}
