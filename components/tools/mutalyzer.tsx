"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n"
import { Copy, Send, AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// 使用本地API代理避免CORS问题
const MUTALYZER_API_PROXY = "/api/mutalyzer"

interface ApiResult {
  success: boolean
  data?: any
  error?: string
}

export function Mutalyzer() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Normalize
  const [normalizeInput, setNormalizeInput] = useState("")
  const [normalizeResult, setNormalizeResult] = useState<ApiResult | null>(null)
  
  // Map
  const [mapDescription, setMapDescription] = useState("")
  const [mapReferenceId, setMapReferenceId] = useState("")
  const [mapResult, setMapResult] = useState<ApiResult | null>(null)
  
  // Description Extract
  const [extractReference, setExtractReference] = useState("")
  const [extractObserved, setExtractObserved] = useState("")
  const [extractResult, setExtractResult] = useState<ApiResult | null>(null)
  
  // Mutate
  const [mutateInput, setMutateInput] = useState("")
  const [mutateResult, setMutateResult] = useState<ApiResult | null>(null)
  
  // Convert (HGVS format conversion)
  const [convertInput, setConvertInput] = useState("")
  const [convertResult, setConvertResult] = useState<ApiResult | null>(null)

  // API call helper - 通过本地代理调用Mutalyzer API
  const callMutalyzerApi = async (endpoint: string): Promise<ApiResult> => {
    try {
      // 使用本地API代理，将endpoint作为查询参数传递
      const response = await fetch(`${MUTALYZER_API_PROXY}?endpoint=${encodeURIComponent(endpoint)}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        return { success: false, error: errorData.error || `HTTP ${response.status}: ${response.statusText}` }
      }
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Normalize handler
  const handleNormalize = async () => {
    if (!normalizeInput.trim()) return
    setLoading(true)
    const result = await callMutalyzerApi(`/normalize/${encodeURIComponent(normalizeInput)}`)
    setNormalizeResult(result)
    setLoading(false)
  }

  // Map handler
  const handleMap = async () => {
    if (!mapDescription.trim() || !mapReferenceId.trim()) return
    setLoading(true)
    const result = await callMutalyzerApi(
      `/map/?description=${encodeURIComponent(mapDescription)}&reference_id=${encodeURIComponent(mapReferenceId)}`
    )
    setMapResult(result)
    setLoading(false)
  }

  // Extract handler
  const handleExtract = async () => {
    if (!extractReference.trim() || !extractObserved.trim()) return
    setLoading(true)
    const result = await callMutalyzerApi(
      `/description_extract/?reference=${encodeURIComponent(extractReference)}&observed=${encodeURIComponent(extractObserved)}`
    )
    setExtractResult(result)
    setLoading(false)
  }

  // Mutate handler
  const handleMutate = async () => {
    if (!mutateInput.trim()) return
    setLoading(true)
    const result = await callMutalyzerApi(`/mutate/${encodeURIComponent(mutateInput)}`)
    setMutateResult(result)
    setLoading(false)
  }

  // Convert handler (HGVS format conversion)
  const handleConvert = async () => {
    if (!convertInput.trim()) return
    setLoading(true)
    const result = await callMutalyzerApi(`/normalize/${encodeURIComponent(convertInput)}`)
    setConvertResult(result)
    setLoading(false)
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

  // Parse and render formatted result
  const renderFormattedResult = (data: any) => {
    // Normalize result
    if (data.normalized_description || data.corrected_description) {
      return (
        <div className="space-y-3">
          {data.input_description && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.inputDesc")}</div>
              <code className="block bg-muted p-3 rounded text-sm font-mono">{data.input_description}</code>
            </div>
          )}
          
          {data.normalized_description && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.normalizedDesc")}</div>
                {data.normalized_description.includes(':g.') && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-semibold">
                    {t("tools.mutalyzer.genomicCoord")}
                  </span>
                )}
                {data.normalized_description.includes(':c.') && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-semibold">
                    {t("tools.mutalyzer.transcriptCoord")}
                  </span>
                )}
              </div>
              <code className="block bg-primary/10 border border-primary/30 p-3 rounded text-sm font-mono font-semibold">
                {data.normalized_description}
              </code>
            </div>
          )}

          {/* Equivalent c. descriptions */}
          {data.equivalent_descriptions?.c && data.equivalent_descriptions.c.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.cDescriptions")}</div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.equivalent_descriptions.c.map((item: any, idx: number) => (
                  <div key={idx} className="bg-muted p-2 rounded text-xs font-mono space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{item.description}</code>
                      {item.tag?.details && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                          {item.tag.details}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equivalent p. descriptions */}
          {data.equivalent_descriptions?.p && data.equivalent_descriptions.p.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.pDescriptions")}</div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.equivalent_descriptions.p.map((item: any, idx: number) => (
                  <div key={idx} className="bg-muted p-2 rounded text-xs font-mono space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{item.description}</code>
                      {item.tag?.details && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                          {item.tag.details}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.protein?.description && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.proteinDesc")}</div>
              <code className="block bg-muted p-3 rounded text-sm font-mono">{data.protein.description}</code>
            </div>
          )}

          {data.rna?.description && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.rnaDesc")}</div>
              <code className="block bg-muted p-3 rounded text-sm font-mono">{data.rna.description}</code>
            </div>
          )}

          {data.infos && data.infos.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.notices")}</div>
              {data.infos.map((info: any, idx: number) => (
                <Alert key={idx} className="text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription>{info.details}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Map result
    if (data.mapped_description || data.equivalent_descriptions || data.descriptions) {
      return (
        <div className="space-y-3">
          {data.mapped_description && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.mappedDesc")}</div>
              <code className="block bg-primary/10 border border-primary/30 p-3 rounded text-sm font-mono font-semibold">
                {data.mapped_description}
              </code>
            </div>
          )}
          
          {data.ref_seq_differences !== undefined && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.refSeqDiff")}</div>
              <div className={`p-3 rounded text-sm font-medium ${
                data.ref_seq_differences 
                  ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900"
                  : "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900"
              }`}>
                {data.ref_seq_differences 
                  ? `⚠️ ${t("tools.mutalyzer.hasDifferences")}`
                  : `✓ ${t("tools.mutalyzer.noDifferences")}`
                }
              </div>
            </div>
          )}

          {data.equivalent_descriptions && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.equivalentDesc")}</div>
              {Object.entries(data.equivalent_descriptions).map(([key, value]: [string, any]) => (
                <div key={key} className="space-y-1">
                  <div className="text-xs text-muted-foreground capitalize">{key}</div>
                  <code className="block bg-muted p-2 rounded text-sm font-mono">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </code>
                </div>
              ))}
            </div>
          )}

          {data.descriptions && !data.equivalent_descriptions && (
            <div className="space-y-2">
              {Object.entries(data.descriptions).map(([key, value]: [string, any]) => (
                <div key={key} className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground capitalize">{key}</div>
                  <code className="block bg-muted p-3 rounded text-sm font-mono">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </code>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Extract result - handle both object with description field and direct string
    if (data.description || (typeof data === 'string' && data.trim())) {
      const description = data.description || data
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.extractedDesc")}</div>
            <code className="block bg-primary/10 border border-primary/30 p-3 rounded text-sm font-mono font-semibold">
              {description}
            </code>
          </div>
          {data.description && (
            <Alert className="text-xs">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription>
                {t("tools.mutalyzer.extractHintNote")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )
    }

    // Mutate result - handle nested sequence object
    if (data.sequence || data.mutated_sequence || data.sequences) {
      const mutatedSeq = data.sequence?.seq || data.mutated_sequence
      const referenceSeq = data.reference_sequence
      const seqLength = mutatedSeq ? mutatedSeq.length : 0
      
      return (
        <div className="space-y-3">
          {mutatedSeq && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.mutatedSeq")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("tools.mutalyzer.seqLength")}: {seqLength} bp
                </div>
              </div>
              <Textarea
                value={mutatedSeq}
                readOnly
                className="font-mono text-xs min-h-[150px] bg-primary/5 border-primary/30"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCopy(mutatedSeq)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  {t("tools.mutalyzer.copySeq")}
                </Button>
                <Button
                  onClick={() => {
                    const fasta = `>Mutated_Sequence\n${mutatedSeq.match(/.{1,60}/g)?.join('\n') || mutatedSeq}`
                    handleCopy(fasta)
                  }}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  {t("tools.mutalyzer.copyFasta")}
                </Button>
              </div>
            </div>
          )}
          {referenceSeq && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">{t("tools.mutalyzer.referenceSeq")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("tools.mutalyzer.seqLength")}: {referenceSeq.length} bp
                </div>
              </div>
              <Textarea
                value={referenceSeq}
                readOnly
                className="font-mono text-xs min-h-[150px] bg-muted"
              />
            </div>
          )}
        </div>
      )
    }

    // Fallback: show raw JSON
    return null
  }

  // Render result
  const renderResult = (result: ApiResult | null) => {
    if (!result) return null
    
    if (!result.success) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )
    }

    const formattedResult = renderFormattedResult(result.data)

    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">{t("tools.mutalyzer.result")}</Label>
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

        {/* Formatted result */}
        {formattedResult && (
          <Card>
            <CardContent className="pt-6">
              {formattedResult}
            </CardContent>
          </Card>
        )}

        {/* Raw JSON (collapsible) */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            {t("tools.mutalyzer.viewRawJson")}
          </summary>
          <div className="mt-2 border-2 border-muted rounded-md p-1 bg-muted/20">
            <Textarea
              value={JSON.stringify(result.data, null, 2)}
              readOnly
              className="font-mono text-xs min-h-[200px] border-0 bg-background"
            />
          </div>
        </details>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.mutalyzer.name")}</CardTitle>
          <CardDescription>{t("tools.mutalyzer.description")}</CardDescription>
          <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-300">
              <span className="inline-flex items-center flex-wrap gap-1">
                <span>{t("tools.mutalyzer.apiNotice")}</span>
                <a 
                  href="https://mutalyzer.nl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-semibold hover:underline text-yellow-900 dark:text-yellow-200 whitespace-nowrap"
                >
                  Mutalyzer.nl
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </span>
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="convert" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="convert">{t("tools.mutalyzer.convert")}</TabsTrigger>
              <TabsTrigger value="normalize">{t("tools.mutalyzer.normalize")}</TabsTrigger>
              <TabsTrigger value="map">{t("tools.mutalyzer.map")}</TabsTrigger>
              <TabsTrigger value="extract">{t("tools.mutalyzer.extract")}</TabsTrigger>
              <TabsTrigger value="mutate">{t("tools.mutalyzer.mutate")}</TabsTrigger>
            </TabsList>

            {/* Convert Tab - HGVS Format Conversion */}
            <TabsContent value="convert" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="convert-input" className="text-base font-semibold">
                  {t("tools.mutalyzer.hgvsDescription")}
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Input
                    id="convert-input"
                    value={convertInput}
                    onChange={(e) => setConvertInput(e.target.value)}
                    placeholder="NC_000007.14:g.117559590G>A 或 NM_003002.2:c.274G>T"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tools.mutalyzer.convertHint")}
                </p>
              </div>

              {/* Helper card for chromosome format */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs space-y-2">
                  <div className="font-semibold">{t("tools.mutalyzer.chrFormatNote")}</div>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 font-mono">✓</span>
                      <code className="text-green-600 dark:text-green-400">GRCh38(chr7):g.55259071A&gt;C</code>
                      <span className="text-muted-foreground">({t("tools.mutalyzer.supported")})</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 font-mono">✓</span>
                      <code className="text-green-600 dark:text-green-400">NC_000007.14:g.55259071A&gt;C</code>
                      <span className="text-muted-foreground">({t("tools.mutalyzer.refseqFormat")})</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 font-mono">✓</span>
                      <code className="text-green-600 dark:text-green-400">NM_003002.2:c.274G&gt;T</code>
                      <span className="text-muted-foreground">({t("tools.mutalyzer.transcriptFormat")})</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="font-medium mb-1">{t("tools.mutalyzer.formatExamples")}:</div>
                    <div className="space-y-1 pl-2">
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">GRCh38:</span> GRCh38(chr7):g.55259071A&gt;C
                      </div>
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">GRCh37:</span> GRCh37(chr7):g.55259071A&gt;C
                      </div>
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">RefSeq:</span> NC_000007.14:g.55259071A&gt;C
                      </div>
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">cDNA:</span> NM_003002.2:c.274G&gt;T
                      </div>
                    </div>
                    <div className="mt-2 text-muted-foreground">
                      {t("tools.mutalyzer.allFormatsSupported")}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleConvert} 
                disabled={loading || !convertInput.trim()}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? t("common.loading") : t("tools.mutalyzer.submit")}
              </Button>
              {renderResult(convertResult)}
            </TabsContent>

            {/* Normalize Tab */}
            <TabsContent value="normalize" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="normalize-input" className="text-base font-semibold">
                  {t("tools.mutalyzer.variantDescription")}
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Input
                    id="normalize-input"
                    value={normalizeInput}
                    onChange={(e) => setNormalizeInput(e.target.value)}
                    placeholder="NM_003002.2:c.274G>T"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tools.mutalyzer.normalizeHint")}
                </p>
              </div>
              <Button 
                onClick={handleNormalize} 
                disabled={loading || !normalizeInput.trim()}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? t("common.loading") : t("tools.mutalyzer.submit")}
              </Button>
              {renderResult(normalizeResult)}
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="map-description" className="text-base font-semibold">
                  {t("tools.mutalyzer.variantDescription")}
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Input
                    id="map-description"
                    value={mapDescription}
                    onChange={(e) => setMapDescription(e.target.value)}
                    placeholder="NM_003002.2:c.274G>T"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="map-reference" className="text-base font-semibold">
                  {t("tools.mutalyzer.targetReference")}
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Input
                    id="map-reference"
                    value={mapReferenceId}
                    onChange={(e) => setMapReferenceId(e.target.value)}
                    placeholder="NM_003002.4"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tools.mutalyzer.mapHint")}
                </p>
              </div>
              <Button 
                onClick={handleMap} 
                disabled={loading || !mapDescription.trim() || !mapReferenceId.trim()}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? t("common.loading") : t("tools.mutalyzer.submit")}
              </Button>
              {renderResult(mapResult)}
            </TabsContent>

            {/* Extract Tab */}
            <TabsContent value="extract" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="extract-reference" className="text-base font-semibold">
                  {t("tools.mutalyzer.referenceSequence")}
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Input
                    id="extract-reference"
                    value={extractReference}
                    onChange={(e) => setExtractReference(e.target.value)}
                    placeholder="AAAATTTCCCCCGGGG"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="extract-observed" className="text-base font-semibold">
                  {t("tools.mutalyzer.observedSequence")}
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Input
                    id="extract-observed"
                    value={extractObserved}
                    onChange={(e) => setExtractObserved(e.target.value)}
                    placeholder="AAAATTTCCCCGGGGG"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tools.mutalyzer.extractHint")}
                </p>
              </div>
              <Button 
                onClick={handleExtract} 
                disabled={loading || !extractReference.trim() || !extractObserved.trim()}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? t("common.loading") : t("tools.mutalyzer.submit")}
              </Button>
              {renderResult(extractResult)}
            </TabsContent>

            {/* Mutate Tab */}
            <TabsContent value="mutate" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mutate-input" className="text-base font-semibold">
                  {t("tools.mutalyzer.variantDescription")}
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Input
                    id="mutate-input"
                    value={mutateInput}
                    onChange={(e) => setMutateInput(e.target.value)}
                    placeholder="NM_003002.2:c.274G>T"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tools.mutalyzer.mutateHint")}
                </p>
              </div>
              <Button 
                onClick={handleMutate} 
                disabled={loading || !mutateInput.trim()}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? t("common.loading") : t("tools.mutalyzer.submit")}
              </Button>
              {renderResult(mutateResult)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.mutalyzer.examplesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("tools.mutalyzer.example1Title")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.mutalyzer.input")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">NM_003002.2:c.274G&gt;T</code>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.mutalyzer.output")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">{t("tools.mutalyzer.example1Output")}</code>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("tools.mutalyzer.example2Title")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.mutalyzer.input")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">
                  {t("tools.mutalyzer.example2Input")}
                </code>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.mutalyzer.output")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">{t("tools.mutalyzer.example2Output")}</code>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("tools.mutalyzer.example3Title")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.mutalyzer.input")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">
                  {t("tools.mutalyzer.example3Input")}
                </code>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t("tools.mutalyzer.output")}:</div>
                <code className="block bg-muted p-2 rounded text-sm">{t("tools.mutalyzer.example3Output")}</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Reference */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.mutalyzer.apiReference")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("tools.mutalyzer.apiDescription")}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://mutalyzer.nl/api/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("tools.mutalyzer.viewApiDocs")}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://mutalyzer.nl" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("tools.mutalyzer.visitWebsite")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
