"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n"
import { Copy, Send, AlertCircle, Info, Dna, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Local API proxy
const API_PROXY = "/api/spliceai"

interface ApiResult {
  success: boolean
  data?: any
  error?: string
}

export function SpliceAI() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Input parameters
  const [variant, setVariant] = useState("")
  const [hgVersion, setHgVersion] = useState("38")
  const [model, setModel] = useState("pangolin")
  const [distance, setDistance] = useState("50")
  const [mask, setMask] = useState("0")

  const [result, setResult] = useState<ApiResult | null>(null)

  // Parse variant to validate format
  const validateVariant = (v: string): boolean => {
    const pattern = /^chr\d+-\d+-[ATCGN]+-[ATCGN]+$/i
    return pattern.test(v.trim())
  }

  // Submit query
  const handleSubmit = async () => {
    if (!variant.trim()) return

    const trimmedVariant = variant.trim()
    if (!validateVariant(trimmedVariant)) {
      setResult({
        success: false,
        error: t("tools.spliceai.invalidFormat"),
      })
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams({
        model,
        hg: hgVersion,
        variant: trimmedVariant,
        distance,
        mask,
      })

      const response = await fetch(`${API_PROXY}?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setResult({ success: true, data })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  // Copy result
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Get score interpretation
  const getScoreInterpretation = (score: number): { label: string; color: string } => {
    if (score >= 0.5) return { label: t("tools.spliceai.veryHigh"), color: "bg-red-500" }
    if (score >= 0.3) return { label: t("tools.spliceai.high"), color: "bg-orange-500" }
    if (score >= 0.1) return { label: t("tools.spliceai.medium"), color: "bg-yellow-500" }
    return { label: t("tools.spliceai.low"), color: "bg-green-500" }
  }

  // Render Pangolin result
  const renderPangolinResult = (data: any) => {
    const {
      variant,
      hg,
      mask,
      distance,
      scores = [],
      allNonZeroScores = [],
      allNonZeroScoresStrand,
      allNonZeroScoresTranscriptId,
    } = data

    return (
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className="text-sm">
            {t("tools.spliceai.variant")}: <strong>{variant}</strong>
          </Badge>
          <Badge variant="outline" className="text-sm">
            GRCh{hg}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {t("tools.spliceai.distance")}: {distance} bp
          </Badge>
          <Badge variant="outline" className="text-sm">
            {t("tools.spliceai.mask")}: {mask}
          </Badge>
        </div>

        {/* Transcript Scores */}
        {scores.length > 0 ? (
          <div className="space-y-4">
            <Label className="text-base font-semibold">{t("tools.spliceai.transcriptScores")} ({scores.length})</Label>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                {scores.map((scoreData: any, idx: number) => {
                  const dsSg = parseFloat(scoreData.DS_SG)
                  const dsSl = parseFloat(scoreData.DS_SL)
                  const maxScore = Math.max(dsSg, dsSl, Math.abs(dsSl))
                  const isPrimary = scoreData.t_priority === "MS"

                  return (
                    <Card key={idx} className={isPrimary ? "border-primary border-2" : "border-muted"}>
                      <CardContent className="pt-4 space-y-3">
                        {/* Gene and Transcript Info */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="secondary" className="text-sm">
                            {scoreData.g_name}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-mono">
                            {scoreData.g_id}
                          </Badge>
                          {isPrimary && <Badge variant="default" className="text-xs">MANE Select</Badge>}
                          <Badge variant="outline" className="text-xs">{scoreData.t_type}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {scoreData.t_strand === "-" ? t("tools.spliceai.negativeStrand") : t("tools.spliceai.positiveStrand")}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground font-mono">
                          {scoreData.t_id}
                          {scoreData.t_refseq_ids && ` (${scoreData.t_refseq_ids.join(", ")})`}
                        </div>

                        {/* Overall Prediction */}
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">{t("tools.spliceai.prediction")}:</div>
                          {maxScore >= 0.3 && (
                            <Badge variant="destructive">{t("tools.spliceai.spliceAltering")}</Badge>
                          )}
                          {maxScore >= 0.1 && maxScore < 0.3 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t("tools.spliceai.possiblyAltering")}</Badge>
                          )}
                          {maxScore < 0.1 && (
                            <Badge variant="outline">{t("tools.spliceai.likelyBenign")}</Badge>
                          )}
                        </div>

                        {/* Delta Scores */}
                        <div className="grid grid-cols-2 gap-3">
                          <Card className="bg-muted/30">
                            <CardContent className="pt-3">
                              <div className="text-xs text-muted-foreground mb-1">
                                {t("tools.spliceai.spliceGain")} (DS_SG)
                              </div>
                              <div className="text-xl font-bold">{dsSg.toFixed(3)}</div>
                              <div className={`mt-1 px-2 py-0.5 rounded text-xs text-white ${getScoreInterpretation(dsSg).color}`}>
                                {getScoreInterpretation(dsSg).label}
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-muted/30">
                            <CardContent className="pt-3">
                              <div className="text-xs text-muted-foreground mb-1">
                                {t("tools.spliceai.spliceLoss")} (DS_SL)
                              </div>
                              <div className="text-xl font-bold">{dsSl.toFixed(3)}</div>
                              <div className={`mt-1 px-2 py-0.5 rounded text-xs text-white ${getScoreInterpretation(Math.abs(dsSl)).color}`}>
                                {getScoreInterpretation(Math.abs(dsSl)).label}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("tools.spliceai.noScores")}</AlertDescription>
          </Alert>
        )}

        {/* All Non-Zero Scores */}
        {allNonZeroScores.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              {t("tools.spliceai.allNonZeroScores")} ({allNonZeroScores.length})
            </Label>
            <div className="text-sm text-muted-foreground">
              {t("tools.spliceai.transcript")}: {allNonZeroScoresTranscriptId} ({allNonZeroScoresStrand === "-" ? t("tools.spliceai.negativeStrand") : t("tools.spliceai.positiveStrand")})
            </div>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2 pr-4">
                {allNonZeroScores.map((score: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/20 p-2 rounded text-sm">
                    <span className="font-mono font-semibold">pos: {score.pos}</span>
                    <div className="flex gap-3 text-xs">
                      <span><span className="text-muted-foreground">SL:</span> REF={parseFloat(score.SL_REF).toFixed(2)}, ALT={parseFloat(score.SL_ALT).toFixed(2)}</span>
                      <span><span className="text-muted-foreground">SG:</span> REF={parseFloat(score.SG_REF).toFixed(2)}, ALT={parseFloat(score.SG_ALT).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScoreInterpretationGuide />
        <RawJsonSection data={data} />
      </div>
    )
  }

  // Render SpliceAI result
  const renderSpliceAIResult = (data: any) => {
    const {
      variant,
      hg,
      mask,
      distance,
      scores = [],
      allNonZeroScores = [],
      sai10kPredictions,
    } = data

    // Find the primary transcript (MS priority)
    const primaryTranscript = scores.find((s: any) => s.t_priority === "MS") || scores[0]

    return (
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className="text-sm">
            {t("tools.spliceai.variant")}: <strong>{variant}</strong>
          </Badge>
          <Badge variant="outline" className="text-sm">
            GRCh{hg}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {t("tools.spliceai.distance")}: {distance} bp
          </Badge>
          <Badge variant="outline" className="text-sm">
            {t("tools.spliceai.mask")}: {mask}
          </Badge>
        </div>

        {/* Splicing Abberation Prediction (if available) */}
        {sai10kPredictions?.aberration && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Dna className="h-5 w-5" />
                <span className="font-semibold">{t("tools.spliceai.splicingPrediction")}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("tools.spliceai.aberrationType")}: </span>
                  <Badge variant="destructive" className="ml-1">{sai10kPredictions.aberration.aberration_type}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("tools.spliceai.confidence")}: </span>
                  <Badge variant={sai10kPredictions.aberration.confidence === "high" ? "default" : "secondary"}>
                    {sai10kPredictions.aberration.confidence}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("tools.spliceai.maxDeltaScore")}: </span>
                  <span className="font-mono font-semibold">{sai10kPredictions.aberration.max_delta_score.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("tools.spliceai.regionType")}: </span>
                  <span>{sai10kPredictions.aberration.affected_region?.region_type}</span>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {sai10kPredictions.aberration.description}
                </AlertDescription>
              </Alert>

              {sai10kPredictions.frameshift && (
                <Alert variant="destructive" className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("tools.spliceai.potentialFrameshift")}: {sai10kPredictions.frameshift.description}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transcript Scores */}
        {scores.length > 0 && primaryTranscript ? (
          <div className="space-y-4">
            <Label className="text-base font-semibold">{t("tools.spliceai.transcriptScores")} ({scores.length})</Label>

            {/* Primary Transcript Highlight */}
            <Card className="border-primary border-2">
              <CardContent className="pt-4 space-y-4">
                {/* Gene Info */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="secondary" className="text-sm">
                    {primaryTranscript.g_name}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono">
                    {primaryTranscript.g_id}
                  </Badge>
                  {primaryTranscript.t_priority === "MS" && (
                    <Badge variant="default" className="text-xs">MANE Select</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{primaryTranscript.t_type}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {primaryTranscript.t_strand === "-" ? t("tools.spliceai.negativeStrand") : t("tools.spliceai.positiveStrand")}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground font-mono">
                  {primaryTranscript.t_id}
                  {primaryTranscript.t_refseq_ids && primaryTranscript.t_refseq_ids.length > 0 && (
                    <> ({primaryTranscript.t_refseq_ids.join(", ")})</>
                  )}
                </div>

                {/* Delta Scores - SpliceAI has 4 scores */}
                <div className="space-y-2">
                  <Label className="text-sm">{t("tools.spliceai.deltaScores")}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Acceptor Gain */}
                    <Card className="bg-muted/30">
                      <CardContent className="pt-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t("tools.spliceai.acceptorGain")} (DS_AG)
                        </div>
                        <div className="text-xl font-bold">{parseFloat(primaryTranscript.DS_AG).toFixed(3)}</div>
                        <div className={`mt-1 px-2 py-0.5 rounded text-xs text-white ${getScoreInterpretation(parseFloat(primaryTranscript.DS_AG)).color}`}>
                          {getScoreInterpretation(parseFloat(primaryTranscript.DS_AG)).label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t("tools.spliceai.pos")}: {primaryTranscript.DP_AG}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Acceptor Loss */}
                    <Card className="bg-muted/30">
                      <CardContent className="pt-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t("tools.spliceai.acceptorLoss")} (DS_AL)
                        </div>
                        <div className="text-xl font-bold">{parseFloat(primaryTranscript.DS_AL).toFixed(3)}</div>
                        <div className={`mt-1 px-2 py-0.5 rounded text-xs text-white ${getScoreInterpretation(parseFloat(primaryTranscript.DS_AL)).color}`}>
                          {getScoreInterpretation(parseFloat(primaryTranscript.DS_AL)).label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t("tools.spliceai.pos")}: {primaryTranscript.DP_AL}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Donor Gain */}
                    <Card className="bg-muted/30">
                      <CardContent className="pt-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t("tools.spliceai.donorGain")} (DS_DG)
                        </div>
                        <div className="text-xl font-bold">{parseFloat(primaryTranscript.DS_DG).toFixed(3)}</div>
                        <div className={`mt-1 px-2 py-0.5 rounded text-xs text-white ${getScoreInterpretation(parseFloat(primaryTranscript.DS_DG)).color}`}>
                          {getScoreInterpretation(parseFloat(primaryTranscript.DS_DG)).label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t("tools.spliceai.pos")}: {primaryTranscript.DP_DG}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Donor Loss */}
                    <Card className="bg-muted/30">
                      <CardContent className="pt-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t("tools.spliceai.donorLoss")} (DS_DL)
                        </div>
                        <div className="text-xl font-bold">{parseFloat(primaryTranscript.DS_DL).toFixed(3)}</div>
                        <div className={`mt-1 px-2 py-0.5 rounded text-xs text-white ${getScoreInterpretation(parseFloat(primaryTranscript.DS_DL)).color}`}>
                          {getScoreInterpretation(parseFloat(primaryTranscript.DS_DL)).label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t("tools.spliceai.pos")}: {primaryTranscript.DP_DL}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Exon Structure */}
                {primaryTranscript.EXON_STARTS && primaryTranscript.EXON_ENDS && (
                  <div className="space-y-2">
                    <Label className="text-sm">{t("tools.spliceai.exonStructure")}</Label>
                    <div className="text-xs text-muted-foreground">
                      {t("tools.spliceai.numExons")}: {primaryTranscript.EXON_STARTS.length} |
                      CDS: {primaryTranscript.CDS_START?.toLocaleString()} - {primaryTranscript.CDS_END?.toLocaleString()}
                    </div>
                    <ScrollArea className="h-[100px]">
                      <div className="space-y-1 pr-4 text-xs font-mono">
                        {primaryTranscript.EXON_STARTS.map((start: number, idx: number) => (
                          <div key={idx} className="flex justify-between bg-muted/20 p-1 rounded">
                            <span>Exon {idx + 1}:</span>
                            <span>{start.toLocaleString()} - {primaryTranscript.EXON_ENDS[idx].toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Other transcripts summary */}
            {scores.length > 1 && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  {t("tools.spliceai.showOtherTranscripts")} ({scores.length - 1})
                </summary>
                <ScrollArea className="h-[200px] mt-2">
                  <div className="space-y-2 pr-4">
                    {scores.filter((s: any) => s.t_priority !== "MS").slice(0, 10).map((scoreData: any, idx: number) => (
                      <Card key={idx} className="bg-muted/20">
                        <CardContent className="pt-2 pb-2">
                          <div className="flex flex-wrap gap-2 items-center mb-1">
                            <span className="text-sm font-mono">{scoreData.t_id}</span>
                            <span className="text-xs text-muted-foreground">{scoreData.g_name}</span>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <span>AG: {parseFloat(scoreData.DS_AG).toFixed(2)}</span>
                            <span>AL: {parseFloat(scoreData.DS_AL).toFixed(2)}</span>
                            <span>DG: {parseFloat(scoreData.DS_DG).toFixed(2)}</span>
                            <span>DL: {parseFloat(scoreData.DS_DL).toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </details>
            )}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("tools.spliceai.noScores")}</AlertDescription>
          </Alert>
        )}

        {/* All Non-Zero Scores (SpliceAI format) */}
        {allNonZeroScores.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              {t("tools.spliceai.allNonZeroScores")} ({allNonZeroScores.length})
            </Label>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2 pr-4">
                {allNonZeroScores.map((score: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/20 p-2 rounded text-sm">
                    <span className="font-mono font-semibold">pos: {score.pos}</span>
                    <div className="flex gap-3 text-xs">
                      <span><span className="text-muted-foreground">RA:</span> {parseFloat(score.RA).toFixed(3)}</span>
                      <span><span className="text-muted-foreground">AA:</span> {parseFloat(score.AA).toFixed(3)}</span>
                      <span><span className="text-muted-foreground">RD:</span> {parseFloat(score.RD).toFixed(3)}</span>
                      <span><span className="text-muted-foreground">AD:</span> {parseFloat(score.AD).toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScoreInterpretationGuide />
        <RawJsonSection data={data} />
      </div>
    )
  }

  // Score interpretation guide component
  const ScoreInterpretationGuide = () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div className="font-semibold">{t("tools.spliceai.interpretationGuide")}</div>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-red-500">&ge; 0.5</span>
              <span>{t("tools.spliceai.veryHighDesc")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-orange-500">0.3 - 0.5</span>
              <span>{t("tools.spliceai.highDesc")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-yellow-500">0.1 - 0.3</span>
              <span>{t("tools.spliceai.mediumDesc")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-green-500">&lt; 0.1</span>
              <span>{t("tools.spliceai.lowDescPangolin")}</span>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )

  // Raw JSON section component
  const RawJsonSection = ({ data }: { data: any }) => (
    <details className="group">
      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
        <span className="group-open:rotate-90 transition-transform">▶</span>
        {t("tools.spliceai.viewRawJson")}
      </summary>
      <div className="mt-2 border-2 border-muted rounded-md p-1 bg-muted/20">
        <Textarea
          value={JSON.stringify(data, null, 2)}
          readOnly
          className="font-mono text-xs min-h-[200px] border-0 bg-background"
        />
      </div>
    </details>
  )

  // Main render
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.spliceai.name")}</CardTitle>
          <CardDescription>{t("tools.spliceai.description")}</CardDescription>
          <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-300">
              <span className="inline-flex items-center flex-wrap gap-1">
                <span>{t("tools.spliceai.apiNotice")}</span>
                <a
                  href="https://spliceailookup.broadinstitute.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-semibold hover:underline text-yellow-900 dark:text-yellow-200 whitespace-nowrap"
                >
                  spliceailookup.broadinstitute.org
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </span>
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("tools.spliceai.selectModel")}</Label>
            <Tabs value={model} onValueChange={setModel} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="spliceai">SpliceAI</TabsTrigger>
                <TabsTrigger value="pangolin">Pangolin</TabsTrigger>
              </TabsList>
              <TabsContent value="spliceai" className="mt-4">
                <p className="text-sm text-muted-foreground">{t("tools.spliceai.spliceaiDesc")}</p>
              </TabsContent>
              <TabsContent value="pangolin" className="mt-4">
                <p className="text-sm text-muted-foreground">{t("tools.spliceai.pangolinDesc")}</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Input Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Variant Input */}
            <div className="space-y-2">
              <Label htmlFor="variant" className="text-base font-semibold">
                {t("tools.spliceai.variant")} <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                <Input
                  id="variant"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  placeholder="chr8-140300616-T-G"
                  className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("tools.spliceai.variantHint")}
              </p>
            </div>

            {/* Genome Version */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("tools.spliceai.genomeVersion")}</Label>
              <Select value={hgVersion} onValueChange={setHgVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="38">GRCh38 (hg38)</SelectItem>
                  <SelectItem value="37">GRCh37 (hg19)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Distance Parameter */}
            <div className="space-y-2">
              <Label htmlFor="distance" className="text-base font-semibold">
                {t("tools.spliceai.distance")} <span className="text-muted-foreground text-sm">({t("tools.spliceai.optional")})</span>
              </Label>
              <Select value={distance} onValueChange={setDistance}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">{t("tools.spliceai.distance10")} (10 bp)</SelectItem>
                  <SelectItem value="25">{t("tools.spliceai.distance25")} (25 bp)</SelectItem>
                  <SelectItem value="50">{t("tools.spliceai.distance50")} (50 bp)</SelectItem>
                  <SelectItem value="100">{t("tools.spliceai.distance100")} (100 bp)</SelectItem>
                  <SelectItem value="200">{t("tools.spliceai.distance200")} (200 bp)</SelectItem>
                  <SelectItem value="500">{t("tools.spliceai.distance500")} (500 bp)</SelectItem>
                  <SelectItem value="1000">{t("tools.spliceai.distance1000")} (1000 bp)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t("tools.spliceai.distanceHint")}
              </p>
            </div>

            {/* Mask Parameter */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {t("tools.spliceai.mask")} <span className="text-muted-foreground text-sm">({t("tools.spliceai.optional")})</span>
              </Label>
              <Select value={mask} onValueChange={setMask}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("tools.spliceai.rawScores")} (0)</SelectItem>
                  <SelectItem value="1">{t("tools.spliceai.maskedScores")} (1)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t("tools.spliceai.maskHint")}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !variant.trim()}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? t("common.loading") : t("tools.spliceai.analyze")}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {!result.success ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">{t("tools.spliceai.result")}</Label>
                    <Button
                      onClick={() => handleCopy(JSON.stringify(result.data, null, 2))}
                      variant="ghost"
                      size="sm"
                      className="h-8"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copied ? t("common.copied") : t("common.copy")}
                    </Button>
                  </div>
                  <Card>
                    <CardContent className="pt-6">
                      {model === "spliceai"
                        ? renderSpliceAIResult(result.data)
                        : renderPangolinResult(result.data)}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Usage Examples */}
          <Card>
            <CardHeader>
              <CardTitle>{t("tools.spliceai.examplesTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">{t("tools.spliceai.example1Title")}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">{t("tools.spliceai.input")}:</div>
                    <code className="block bg-muted p-2 rounded text-sm font-mono">
                      chr8-140300616-T-G
                    </code>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">{t("tools.spliceai.model")}:</div>
                    <code className="block bg-muted p-2 rounded text-sm">SpliceAI / Pangolin (GRCh38)</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parameter Reference */}
          <Card>
            <CardHeader>
              <CardTitle>{t("tools.spliceai.paramReference")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="font-medium">{t("tools.spliceai.paramVariant")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("tools.spliceai.paramVariantDesc")}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{t("tools.spliceai.paramDistance")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("tools.spliceai.paramDistanceDesc")}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{t("tools.spliceai.paramMask")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("tools.spliceai.paramMaskDesc")}
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}