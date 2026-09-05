"use client"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"

// 引物坐标计算：输入 FASTA 模板 + 基因组起始坐标 + F/R 引物，
// 输出 F/R 引物在基因组上的起始/终止坐标（含链向、5'/3' 端、扩增子跨度）。
// 坐标约定：1-based inclusive；模板假定与基因组正链同向。
// 算法实现在 lib/bio/coordinates.ts（纯函数 + 单测）。

import { useState } from "react"
import { useToolStorage } from "@/hooks/use-tool-storage"
import { TryExample } from "@/components/try-example"
import { ResultActions } from "@/components/result-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, ArrowRight, AlertTriangle, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import {
  parseFasta,
  cleanDnaStrict,
  locatePrimer,
  computeAmplicon,
  type PrimerLocation,
  type PrimerStrand,
} from "@/lib/bio"

interface CalcResult {
  templateName: string
  templateLength: number
  genomicStart: number
  fProvided: boolean
  rProvided: boolean
  fLocation: PrimerLocation
  rLocation: PrimerLocation
  amplicon: ReturnType<typeof computeAmplicon> | null
}

const STRAND_CLASS: Record<PrimerStrand, string> = {
  "+": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "-": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
}

// 未输入该引物时的空占位（hits 为空，渲染时跳过该引物区块）
const emptyLocation = (expectedStrand: PrimerStrand): PrimerLocation => ({
  primer: "",
  expectedStrand,
  strand: expectedStrand,
  orientationMatches: true,
  hits: [],
})

export function PrimerCoordinateCalculator() {
  const { t } = useI18n()
  const [template, setTemplate] = useToolStorage("primer-coordinate-calculator:template", "")
  const [genomicStart, setGenomicStart] = useToolStorage("primer-coordinate-calculator:genomicStart", "1")
  const [refName, setRefName] = useToolStorage("primer-coordinate-calculator:refName", "")
  const [fPrimer, setFPrimer] = useToolStorage("primer-coordinate-calculator:fPrimer", "")
  const [rPrimer, setRPrimer] = useToolStorage("primer-coordinate-calculator:rPrimer", "")
  const [result, setResult] = useState<CalcResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fmtCoord = (start: number, end: number) => {
    const ref = refName.trim()
    return ref ? `${ref}:${start}-${end}` : `${start}-${end}`
  }

  const calculate = () => {
    // 解析模板：取第一条 FASTA 记录；无 header 时整体作为序列
    const records = parseFasta(template)
    let seq: string
    let name: string
    if (records.length > 0) {
      seq = cleanDnaStrict(records[0].sequence)
      name = records[0].id || records[0].description || "template"
    } else {
      seq = cleanDnaStrict(template)
      name = "template"
    }

    if (seq.length === 0) {
      setError("emptyTemplate")
      setResult(null)
      return
    }

    const g = Number.parseInt(genomicStart, 10)
    if (!Number.isFinite(g) || g < 1) {
      setError("invalidCoordinate")
      setResult(null)
      return
    }

    const fClean = cleanDnaStrict(fPrimer)
    const rClean = cleanDnaStrict(rPrimer)
    if (fClean.length === 0 && rClean.length === 0) {
      setError("emptyPrimer")
      setResult(null)
      return
    }

    const fProvided = fClean.length > 0
    const rProvided = rClean.length > 0
    const fLocation = fProvided ? locatePrimer(seq, fClean, "+", g) : emptyLocation("+")
    const rLocation = rProvided ? locatePrimer(seq, rClean, "-", g) : emptyLocation("-")

    let amplicon: CalcResult["amplicon"] = null
    if (fLocation.hits.length > 0 && rLocation.hits.length > 0) {
      amplicon = computeAmplicon(fLocation.hits[0], rLocation.hits[0])
    }

    setError(null)
    setResult({
      templateName: name,
      templateLength: seq.length,
      genomicStart: g,
      fProvided,
      rProvided,
      fLocation,
      rLocation,
      amplicon,
    })
  }

  const handleClear = () => {
    setTemplate("")
    setGenomicStart("1")
    setRefName("")
    setFPrimer("")
    setRPrimer("")
    setResult(null)
    setError(null)
  }

  const strandLabel = (s: PrimerStrand) =>
    s === "+" ? t("tools.primer-coordinate-calculator.plus") : t("tools.primer-coordinate-calculator.minus")

  const renderHitsTable = (location: PrimerLocation, label: "F" | "R") => {
    const hits = location.hits
    const titleKey = label === "F" ? "forwardPrimer" : "reversePrimer"
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">{label}</Badge>
          <span className="font-mono text-sm font-medium">{t(`tools.primer-coordinate-calculator.${titleKey}`)}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {t("tools.primer-coordinate-calculator.results")}: {hits.length}
          </span>
        </div>

        {hits.length === 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t(`tools.primer-coordinate-calculator.${label === "F" ? "notFoundF" : "notFoundR"}`)}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono font-bold w-12">#</TableHead>
                  <TableHead className="font-mono font-bold">{t("tools.primer-coordinate-calculator.strand")}</TableHead>
                  <TableHead className="font-mono font-bold">{t("tools.primer-coordinate-calculator.genomicStartCol")}</TableHead>
                  <TableHead className="font-mono font-bold">{t("tools.primer-coordinate-calculator.genomicEndCol")}</TableHead>
                  <TableHead className="font-mono font-bold">{t("tools.primer-coordinate-calculator.fivePrime")}</TableHead>
                  <TableHead className="font-mono font-bold">{t("tools.primer-coordinate-calculator.threePrime")}</TableHead>
                  <TableHead className="font-mono font-bold">{t("tools.primer-coordinate-calculator.templatePos")}</TableHead>
                  <TableHead className="font-mono font-bold text-center w-16">{t("tools.primer-coordinate-calculator.length")}</TableHead>
                  <TableHead className="font-mono font-bold">{t("tools.primer-coordinate-calculator.matchedSeq")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hits.map((h, i) => (
                  <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-center">{i + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-xs ${STRAND_CLASS[h.strand]}`}>
                        {h.strand} {strandLabel(h.strand)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-medium">{h.genomicStart}</TableCell>
                    <TableCell className="font-mono font-medium">{h.genomicEnd}</TableCell>
                    <TableCell className="font-mono text-sm">{h.fivePrimeGenomic}</TableCell>
                    <TableCell className="font-mono text-sm">{h.threePrimeGenomic}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {h.templateStart}-{h.templateEnd}
                    </TableCell>
                    <TableCell className="text-center font-mono">{h.length}</TableCell>
                    <TableCell className="font-mono text-xs break-all">{h.matchedSequence}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!location.orientationMatches && hits.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t("tools.primer-coordinate-calculator.oppositeStrandNote")}
            </AlertDescription>
          </Alert>
        )}
        {hits.length > 1 && (
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.primer-coordinate-calculator.multipleHitsHint")}
          </div>
        )}
      </div>
    )
  }

  const exportRows = result
    ? [
        ...result.fLocation.hits.map((h, i) => ({
          primer: "F",
          hit: i + 1,
          strand: h.strand,
          genomicStart: h.genomicStart,
          genomicEnd: h.genomicEnd,
          fivePrime: h.fivePrimeGenomic,
          threePrime: h.threePrimeGenomic,
          templateStart: h.templateStart,
          templateEnd: h.templateEnd,
          length: h.length,
          matchedSequence: h.matchedSequence,
        })),
        ...result.rLocation.hits.map((h, i) => ({
          primer: "R",
          hit: i + 1,
          strand: h.strand,
          genomicStart: h.genomicStart,
          genomicEnd: h.genomicEnd,
          fivePrime: h.fivePrimeGenomic,
          threePrime: h.threePrimeGenomic,
          templateStart: h.templateStart,
          templateEnd: h.templateEnd,
          length: h.length,
          matchedSequence: h.matchedSequence,
        })),
      ]
    : []
  const exportHeaders = [
    "primer", "hit", "strand", "genomicStart", "genomicEnd",
    "fivePrime", "threePrime", "templateStart", "templateEnd", "length", "matchedSequence",
  ]

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>
          {t("tools.primer-coordinate-calculator.name")}
        </ToolPageTitle>
        <ToolPageDescription>
          {t("tools.primer-coordinate-calculator.description")}
        </ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        {/* 模板序列 */}
        <div className="space-y-2">
          <Label htmlFor="template" className="">
            {t("tools.primer-coordinate-calculator.templateLabel")}
          </Label>
          <Textarea
            id="template"
            placeholder={t("tools.primer-coordinate-calculator.templatePlaceholder")}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="terminal-input min-h-[120px] font-mono"
            rows={5}
          />
        </div>

        {/* 基因组起始坐标 + 可选参考名 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="genomic-start" className="">
              {t("tools.primer-coordinate-calculator.genomicStartLabel")}
            </Label>
            <Input
              id="genomic-start"
              type="number"
              min={1}
              value={genomicStart}
              onChange={(e) => setGenomicStart(e.target.value)}
              placeholder={t("tools.primer-coordinate-calculator.genomicStartPlaceholder")}
              className="terminal-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref-name" className="">
              {t("tools.primer-coordinate-calculator.refNameLabel")}
            </Label>
            <Input
              id="ref-name"
              value={refName}
              onChange={(e) => setRefName(e.target.value)}
              placeholder={t("tools.primer-coordinate-calculator.refNamePlaceholder")}
              className="terminal-input font-mono"
            />
            <div className="text-xs text-muted-foreground font-mono">
              {t("tools.primer-coordinate-calculator.refNameHint")}
            </div>
          </div>
        </div>

        {/* F / R 引物 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="f-primer" className="">
              {t("tools.primer-coordinate-calculator.fPrimerLabel")}
            </Label>
            <Input
              id="f-primer"
              value={fPrimer}
              onChange={(e) => setFPrimer(e.target.value.toUpperCase())}
              placeholder={t("tools.primer-coordinate-calculator.fPrimerPlaceholder")}
              className="terminal-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-primer" className="">
              {t("tools.primer-coordinate-calculator.rPrimerLabel")}
            </Label>
            <Input
              id="r-primer"
              value={rPrimer}
              onChange={(e) => setRPrimer(e.target.value.toUpperCase())}
              placeholder={t("tools.primer-coordinate-calculator.rPrimerPlaceholder")}
              className="terminal-input font-mono"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          {t("tools.primer-coordinate-calculator.formatHint")}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={calculate}
            className="flex-1 "
            disabled={!template.trim() || (!fPrimer.trim() && !rPrimer.trim())}
          >
            {t("tools.primer-coordinate-calculator.calculate")}
          </Button>
          <Button onClick={handleClear} variant="outline" className="">
            {t("common.clear")}
          </Button>
        </div>

        <TryExample
          example={{
            template: ">amplicon\nATCGATCGAAACTTGTAAC",
            genomicStart: "1000",
            refName: "chr1",
            fPrimer: "ATCGATCG",
            rPrimer: "GTTACAAG",
          }}
          onApply={(ex) => {
            setTemplate(ex.template as string)
            setGenomicStart(ex.genomicStart as string)
            setRefName(ex.refName as string)
            setFPrimer(ex.fPrimer as string)
            setRPrimer(ex.rPrimer as string)
          }}
        />

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t(`tools.primer-coordinate-calculator.${error}`)}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-mono text-muted-foreground">
              <span>{t("tools.primer-coordinate-calculator.results")}</span>
              <span className="text-border">|</span>
              <span>{result.templateName}</span>
              <span className="text-border">|</span>
              <span>{result.templateLength} bp</span>
              <span className="text-border">|</span>
              <span>{t("tools.primer-coordinate-calculator.genomicStartLabel")}: {result.genomicStart}</span>
            </div>

            {/* 扩增子摘要 */}
            {result.amplicon && (
              <div className="rounded-lg border bg-muted/30 p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm font-medium">
                    {t("tools.primer-coordinate-calculator.amplicon")}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Badge variant="default" className="font-mono">
                    {fmtCoord(result.amplicon.genomicStart, result.amplicon.genomicEnd)}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono">
                    {result.amplicon.size} bp
                  </Badge>
                </div>
                {!result.amplicon.valid && (
                  <Badge variant="outline" className="font-mono text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {t(`tools.primer-coordinate-calculator.ampliconInvalid.${result.amplicon.reason}`)}
                  </Badge>
                )}
              </div>
            )}

            {result.fProvided && renderHitsTable(result.fLocation, "F")}
            {result.rProvided && renderHitsTable(result.rLocation, "R")}

            <ResultActions
              rows={exportRows}
              headers={exportHeaders}
              filename="primer-coordinate-results"
            />
          </div>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {t("tools.primer-coordinate-calculator.coordinateConvention")}
          </AlertDescription>
        </Alert>
      </ToolPageContent>
    </ToolPage>
  )
}
