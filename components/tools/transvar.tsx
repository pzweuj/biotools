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
import { Copy, Send, AlertCircle, ExternalLink, Dna, Database } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

// Local API proxy
const API_PROXY = "/api/transvar"

interface ApiResult {
  success: boolean
  input?: string
  refversion?: string
  mode?: string
  databases?: string[]
  results?: any[]
  error?: string | null
}

// Parse TSV result string
interface ParsedResult {
  input: string
  transcript: string
  gene: string
  strand: string
  coordinates: string
  gCoord: string
  cCoord: string
  pCoord: string
  region: string
  info: Record<string, string>
}

function parseTransvarResult(resultStr: string): ParsedResult | null {
  try {
    const lines = resultStr.split("\n")
    if (lines.length < 2) return null

    const header = lines[0].split("\t")
    const values = lines[1].split("\t")

    // Map header to values
    const data: Record<string, string> = {}
    header.forEach((h, i) => {
      data[h] = values[i] || ""
    })

    // Parse coordinates (format: chr3:g.178936091G>A/c.1633G>A/p.E545K)
    const coordStr = data["coordinates(gDNA/cDNA/protein)"] || ""
    const coordParts = coordStr.split("/")
    const gCoord = coordParts.find(p => p.includes("g.")) || ""
    const cCoord = coordParts.find(p => p.includes("c.")) || ""
    const pCoord = coordParts.find(p => p.includes("p.")) || ""

    // Parse info (format: CSQN=Missense;reference_codon=GAG;...)
    const infoStr = data["info"] || ""
    const info: Record<string, string> = {}
    infoStr.split(";").forEach(item => {
      const [key, value] = item.split("=")
      if (key && value) {
        info[key] = value
      }
    })

    return {
      input: data["input"] || "",
      transcript: data["transcript"] || "",
      gene: data["gene"] || "",
      strand: data["strand"] || "",
      coordinates: coordStr,
      gCoord,
      cCoord,
      pCoord,
      region: data["region"] || "",
      info,
    }
  } catch (e) {
    console.error("Failed to parse TransVar result:", e)
    return null
  }
}

export function TransVar() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Input parameters
  const [variant, setVariant] = useState("")
  const [variants, setVariants] = useState("")
  const [refversion, setRefversion] = useState("hg19")
  const [mode, setMode] = useState("ganno")
  const [databases, setDatabases] = useState<string[]>(["refseq"])

  const [result, setResult] = useState<ApiResult | null>(null)
  const [inputMode, setInputMode] = useState<"single" | "batch">("single")

  // Database options
  const databaseOptions = [
    { id: "refseq", label: "RefSeq" },
    { id: "ensembl", label: "Ensembl" },
    { id: "ucsc", label: "UCSC" },
  ]

  // Toggle database selection
  const toggleDatabase = (db: string) => {
    setDatabases((prev) =>
      prev.includes(db) ? prev.filter((d) => d !== db) : [...prev, db]
    )
  }

  // Submit query
  const handleSubmit = async () => {
    const trimmedVariant = inputMode === "single" ? variant.trim() : variants.trim()
    if (!trimmedVariant) return

    setLoading(true)

    try {
      const payload =
        inputMode === "batch"
          ? {
              variants: trimmedVariant.split("\n").map((v) => v.trim()).filter(Boolean),
              refversion,
              mode,
              databases,
            }
          : {
              variant: trimmedVariant,
              refversion,
              mode,
              databases,
            }

      const response = await fetch(API_PROXY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
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

  // Render single annotation result
  const renderAnnotationResult = (item: any, idx: number) => {
    // Check if item has the expected structure
    if (!item.result) {
      return (
        <Card key={idx} className="border-muted">
          <CardContent className="pt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t("tools.transvar.noResults")}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }

    const parsed = parseTransvarResult(item.result)

    if (!parsed) {
      return (
        <Card key={idx} className="border-muted">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{item.database}</Badge>
              {!item.success && <Badge variant="destructive">{t("common.error")}</Badge>}
            </div>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {item.result}
            </pre>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card key={idx} className="border-muted">
        <CardContent className="pt-4 space-y-3">
          {/* Database and Status */}
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">{item.database}</Badge>
            {item.success ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                {t("common.success")}
              </Badge>
            ) : (
              <Badge variant="destructive">{t("common.error")}</Badge>
            )}
          </div>

          {/* Gene and Transcript Info */}
          <div className="flex flex-wrap gap-2 items-center">
            {parsed.gene && (
              <Badge variant="secondary" className="text-sm">
                {parsed.gene}
              </Badge>
            )}
            {parsed.transcript && (
              <Badge variant="outline" className="text-xs font-mono">
                {parsed.transcript}
              </Badge>
            )}
            {parsed.strand && (
              <Badge variant="outline" className="text-xs">
                {parsed.strand === "-" ? t("tools.transvar.negativeStrand") : t("tools.transvar.positiveStrand")}
              </Badge>
            )}
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Genomic */}
            {parsed.gCoord && (
              <div className="space-y-1">
                <div className="font-semibold text-muted-foreground">{t("tools.transvar.genomicCoord")}</div>
                <code className="block bg-muted p-2 rounded text-xs font-mono break-all">
                  {parsed.gCoord}
                </code>
              </div>
            )}

            {/* Transcript */}
            {parsed.cCoord && (
              <div className="space-y-1">
                <div className="font-semibold text-muted-foreground">{t("tools.transvar.transcriptCoord")}</div>
                <code className="block bg-muted p-2 rounded text-xs font-mono break-all">
                  {parsed.cCoord}
                </code>
              </div>
            )}

            {/* Protein */}
            {parsed.pCoord && (
              <div className="space-y-1">
                <div className="font-semibold text-muted-foreground">{t("tools.transvar.proteinCoord")}</div>
                <code className="block bg-muted p-2 rounded text-xs font-mono break-all">
                  {parsed.pCoord}
                </code>
              </div>
            )}
          </div>

          {/* Region */}
          {parsed.region && (
            <div className="space-y-1">
              <div className="font-semibold text-muted-foreground">{t("tools.transvar.region")}</div>
              <code className="block bg-muted p-2 rounded text-xs font-mono">
                {parsed.region}
              </code>
            </div>
          )}

          {/* Additional Info */}
          {Object.keys(parsed.info).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("tools.transvar.additionalInfo")}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(parsed.info).slice(0, 12).map(([key, value]: [string, string]) => (
                  <div key={key} className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">{key}: </span>
                    <span className="font-mono break-all">{value}</span>
                  </div>
                ))}
                {Object.keys(parsed.info).length > 12 && (
                  <div className="bg-muted/50 p-2 rounded text-muted-foreground">
                    +{Object.keys(parsed.info).length - 12} more...
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Render results
  const renderResults = (data: ApiResult) => {
    if (!data.results || data.results.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("tools.transvar.noResults")}</AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className="text-sm">
            {t("tools.transvar.input")}: <strong>{data.input}</strong>
          </Badge>
          <Badge variant="outline" className="text-sm">
            {data.refversion}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {t("tools.transvar.mode")}: {data.mode}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {t("tools.transvar.databases")}: {data.databases?.join(", ")}
          </Badge>
        </div>

        {/* Results List */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            {t("tools.transvar.annotationResults")} ({data.results.length})
          </Label>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {data.results.map((item: any, idx: number) => renderAnnotationResult(item, idx))}
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }

  // Raw JSON section
  const RawJsonSection = ({ data }: { data: any }) => (
    <details className="group">
      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
        <span className="group-open:rotate-90 transition-transform">▶</span>
        {t("tools.transvar.viewRawJson")}
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
          <CardTitle>{t("tools.transvar.name")}</CardTitle>
          <CardDescription>{t("tools.transvar.description")}</CardDescription>
          <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-300">
              <span className="inline-flex items-center flex-wrap gap-1">
                <span>{t("tools.transvar.apiNotice")}</span>
                <a
                  href="https://pzweuj-transvarweb.hf.space/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-semibold hover:underline text-yellow-900 dark:text-yellow-200 whitespace-nowrap"
                >
                  TransVar Web
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </span>
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Mode Selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("tools.transvar.inputMode")}</Label>
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "single" | "batch")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">{t("tools.transvar.singleInput")}</TabsTrigger>
                <TabsTrigger value="batch">{t("tools.transvar.batchInput")}</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="mt-4 space-y-2">
                <Label htmlFor="variant">
                  {t("tools.transvar.variant")} <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Input
                    id="variant"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    placeholder="PIK3CA:p.E545K"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tools.transvar.variantHint")}
                </p>
              </TabsContent>
              <TabsContent value="batch" className="mt-4 space-y-2">
                <Label htmlFor="variants">
                  {t("tools.transvar.variants")} <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-muted-foreground/30 rounded-md p-1 bg-muted/20">
                  <Textarea
                    id="variants"
                    value={variants}
                    onChange={(e) => setVariants(e.target.value)}
                    placeholder="PIK3CA:p.E545K&#10;EGFR:p.L858R&#10;KRAS:p.G12D"
                    className="font-mono border-0 focus-visible:ring-2 focus-visible:ring-primary bg-background min-h-[120px]"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("tools.transvar.variantsHint")}
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reference Version */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("tools.transvar.refversion")}</Label>
              <Select value={refversion} onValueChange={setRefversion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hg38">GRCh38 (hg38)</SelectItem>
                  <SelectItem value="hg19">GRCh37 (hg19)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("tools.transvar.annotationMode")}</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="panno">{t("tools.transvar.modePanno")}</SelectItem>
                  <SelectItem value="ganno">{t("tools.transvar.modeGanno")}</SelectItem>
                  <SelectItem value="canno">{t("tools.transvar.modeCanno")}</SelectItem>
                  <SelectItem value="region">{t("tools.transvar.modeRegion")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {mode === "panno" && t("tools.transvar.modePannoDesc")}
                {mode === "ganno" && t("tools.transvar.modeGannoDesc")}
                {mode === "canno" && t("tools.transvar.modeCannoDesc")}
                {mode === "region" && t("tools.transvar.modeRegionDesc")}
              </p>
            </div>
          </div>

          {/* Databases */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("tools.transvar.databasesLabel")}</Label>
            <div className="flex flex-wrap gap-4">
              {databaseOptions.map((db) => (
                <div key={db.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`db-${db.id}`}
                    checked={databases.includes(db.id)}
                    onCheckedChange={() => toggleDatabase(db.id)}
                  />
                  <label
                    htmlFor={`db-${db.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {db.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("tools.transvar.databasesHint")}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || (inputMode === "single" ? !variant.trim() : !variants.trim())}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? t("common.loading") : t("tools.transvar.annotate")}
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
                    <Label className="text-base font-semibold">{t("tools.transvar.result")}</Label>
                    <Button
                      onClick={() => handleCopy(JSON.stringify(result, null, 2))}
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
                      {renderResults(result)}
                    </CardContent>
                  </Card>
                  <RawJsonSection data={result} />
                </div>
              )}
            </div>
          )}

          {/* Usage Examples */}
          <Card>
            <CardHeader>
              <CardTitle>{t("tools.transvar.examplesTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("tools.transvar.example1Title")}</div>
                  <div className="text-xs text-muted-foreground mb-1">{t("tools.transvar.input")}:</div>
                  <code className="block bg-muted p-2 rounded text-sm font-mono">
                    PIK3CA:p.E545K
                  </code>
                  <div className="text-xs text-muted-foreground">{t("tools.transvar.example1Desc")}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("tools.transvar.example2Title")}</div>
                  <div className="text-xs text-muted-foreground mb-1">{t("tools.transvar.input")}:</div>
                  <code className="block bg-muted p-2 rounded text-sm font-mono">
                    chr7:140453136-140453136
                  </code>
                  <div className="text-xs text-muted-foreground">{t("tools.transvar.example2Desc")}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("tools.transvar.example3Title")}</div>
                  <div className="text-xs text-muted-foreground mb-1">{t("tools.transvar.input")}:</div>
                  <code className="block bg-muted p-2 rounded text-sm font-mono">
                    NM_004333.4:c.1799T&gt;A
                  </code>
                  <div className="text-xs text-muted-foreground">{t("tools.transvar.example3Desc")}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("tools.transvar.example4Title")}</div>
                  <div className="text-xs text-muted-foreground mb-1">{t("tools.transvar.input")}:</div>
                  <code className="block bg-muted p-2 rounded text-sm font-mono">
                    BRAF:p.V600E
                  </code>
                  <div className="text-xs text-muted-foreground">{t("tools.transvar.example4Desc")}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode Reference */}
          <Card>
            <CardHeader>
              <CardTitle>{t("tools.transvar.paramReference")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="font-medium">{t("tools.transvar.paramVariant")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("tools.transvar.paramVariantDesc")}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{t("tools.transvar.paramRefversion")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("tools.transvar.paramRefversionDesc")}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{t("tools.transvar.paramMode")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("tools.transvar.paramModeDesc")}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{t("tools.transvar.paramDatabases")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("tools.transvar.paramDatabasesDesc")}
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}