"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Info, Dna } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface GCSkewResult {
  position: number
  gcSkew: number
  gcContent: number
  window: string
}

export function GcSkewAnalyzer() {
  const { t } = useI18n()
  
  const [sequence, setSequence] = useState("")
  const [windowSize, setWindowSize] = useState("100")
  const [stepSize, setStepSize] = useState("10")
  const [results, setResults] = useState<GCSkewResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // 计算GC Skew
  const calculateGCSkew = (seq: string): { gcSkew: number; gcContent: number } => {
    const g = (seq.match(/G/g) || []).length
    const c = (seq.match(/C/g) || []).length
    const a = (seq.match(/A/g) || []).length
    const t = (seq.match(/T/g) || []).length
    
    const gcSkew = (g + c) > 0 ? (g - c) / (g + c) : 0
    const gcContent = seq.length > 0 ? ((g + c) / seq.length) * 100 : 0
    
    return { gcSkew, gcContent }
  }
  
  // 滑动窗口分析
  const analyzeSequence = async () => {
    if (!sequence.trim()) return
    
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const cleanSeq = sequence.toUpperCase().replace(/[^ATCG]/g, "")
    const window = parseInt(windowSize) || 100
    const step = parseInt(stepSize) || 10
    
    if (cleanSeq.length < window) {
      alert(t("tools.gc-skew.sequenceTooShort", "Sequence is too short for the specified window size"))
      setIsAnalyzing(false)
      return
    }
    
    const skewResults: GCSkewResult[] = []
    
    for (let i = 0; i <= cleanSeq.length - window; i += step) {
      const windowSeq = cleanSeq.substring(i, i + window)
      const { gcSkew, gcContent } = calculateGCSkew(windowSeq)
      
      skewResults.push({
        position: i + 1, // 1-based
        gcSkew,
        gcContent,
        window: windowSeq
      })
    }
    
    setResults(skewResults)
    setIsAnalyzing(false)
  }
  
  // 统计信息
  const statistics = useMemo(() => {
    if (results.length === 0) return null
    
    const gcSkews = results.map(r => r.gcSkew)
    const gcContents = results.map(r => r.gcContent)
    
    const maxSkew = Math.max(...gcSkews)
    const minSkew = Math.min(...gcSkews)
    const avgSkew = gcSkews.reduce((sum, val) => sum + val, 0) / gcSkews.length
    const avgGC = gcContents.reduce((sum, val) => sum + val, 0) / gcContents.length
    
    const maxSkewPos = results[gcSkews.indexOf(maxSkew)].position
    const minSkewPos = results[gcSkews.indexOf(minSkew)].position
    
    return {
      maxSkew,
      minSkew,
      avgSkew,
      avgGC,
      maxSkewPos,
      minSkewPos
    }
  }, [results])
  
  const clearAll = () => {
    setSequence("")
    setResults([])
  }
  
  const loadExample = () => {
    const example = `>Example bacterial replication origin region
ATGCGCTAGCTAGCGCGATCGATCGCTAGCTAGCGCGCTAGCTAGCGCGATCGATCGCTA
GCTAGCGCGCTAGCTAGCGCGATCGATCGCTAGCTAGCGCGCTAGCTAGCGCGATCGATC
GCTAGCTAGCGCGCTAGCTAGCGCGATCGATCGCTAGCTAGCGCGCTAGCTAGCGCGATC`
    setSequence(example)
  }
  
  const getSkewColor = (skew: number): string => {
    if (skew > 0.1) return "text-green-600 dark:text-green-400"
    if (skew < -0.1) return "text-red-600 dark:text-red-400"
    return "text-muted-foreground"
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t("tools.gc-skew.name", "GC Skew Analyzer")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.gc-skew.description", "Calculate GC skew [(G-C)/(G+C)] using sliding window analysis - useful for identifying replication origins and strand bias")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 序列输入 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Dna className="w-4 h-4 mr-2" />
              {t("tools.gc-skew.sequenceInput", "Sequence Input")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sequence" className="font-mono">
                {t("tools.gc-skew.sequenceLabel", "DNA Sequence")}
              </Label>
              <Textarea
                id="sequence"
                placeholder={t("tools.gc-skew.sequencePlaceholder", "Enter DNA sequence (FASTA format or plain text)\nExample:\n>Sequence\nATCGATCGATCG...")}
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                className="terminal-input min-h-[150px] font-mono"
                rows={8}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="window-size" className="font-mono">
                  {t("tools.gc-skew.windowSize", "Window Size (bp)")}
                </Label>
                <Input
                  id="window-size"
                  type="number"
                  value={windowSize}
                  onChange={(e) => setWindowSize(e.target.value)}
                  className="terminal-input"
                  min="10"
                  placeholder="100"
                />
                <div className="text-xs text-muted-foreground font-mono">
                  {t("tools.gc-skew.windowHint", "Typical: 100-1000 bp for bacterial, 1000-10000 bp for eukaryotic")}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="step-size" className="font-mono">
                  {t("tools.gc-skew.stepSize", "Step Size (bp)")}
                </Label>
                <Input
                  id="step-size"
                  type="number"
                  value={stepSize}
                  onChange={(e) => setStepSize(e.target.value)}
                  className="terminal-input"
                  min="1"
                  placeholder="10"
                />
                <div className="text-xs text-muted-foreground font-mono">
                  {t("tools.gc-skew.stepHint", "Smaller steps give smoother curves but more data points")}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={analyzeSequence} className="font-mono flex-1" disabled={isAnalyzing}>
                {isAnalyzing ? t("common.loading") : t("tools.gc-skew.analyze", "Analyze")}
              </Button>
              <Button onClick={loadExample} variant="outline" className="font-mono">
                {t("tools.gc-skew.loadExample", "Example")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="font-mono">
                {t("common.clear")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        {statistics && (
          <Card className="border-2 border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono">
                {t("tools.gc-skew.statistics", "Statistics")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    {t("tools.gc-skew.avgGC", "Avg GC Content")}
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {statistics.avgGC.toFixed(2)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    {t("tools.gc-skew.avgSkew", "Avg GC Skew")}
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {statistics.avgSkew.toFixed(4)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    {t("tools.gc-skew.range", "Skew Range")}
                  </div>
                  <div className="text-xl font-mono font-bold">
                    {statistics.minSkew.toFixed(3)} ~ {statistics.maxSkew.toFixed(3)}
                  </div>
                </div>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="font-mono text-sm">
                  {t("tools.gc-skew.maxSkewAt", "Max GC Skew at position")}: {statistics.maxSkewPos} bp<br/>
                  {t("tools.gc-skew.minSkewAt", "Min GC Skew at position")}: {statistics.minSkewPos} bp
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* 结果表格 */}
        {results.length > 0 && (
          <Card className="border-2 border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono">
                {t("tools.gc-skew.results", "Analysis Results")} ({results.length} {t("tools.gc-skew.windows", "windows")})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono font-bold text-center">
                        {t("tools.gc-skew.position", "Position")}
                      </TableHead>
                      <TableHead className="font-mono font-bold text-center">
                        {t("tools.gc-skew.gcSkew", "GC Skew")}
                      </TableHead>
                      <TableHead className="font-mono font-bold text-center">
                        {t("tools.gc-skew.gcContent", "GC Content")}
                      </TableHead>
                      <TableHead className="font-mono font-bold text-center">
                        {t("tools.gc-skew.trend", "Trend")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.slice(0, 100).map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center font-mono">
                          {result.position}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`font-mono ${getSkewColor(result.gcSkew)}`}>
                            {result.gcSkew.toFixed(4)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {result.gcContent.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-center">
                          {result.gcSkew > 0 ? (
                            <Badge variant="default" className="font-mono">
                              G &gt; C
                            </Badge>
                          ) : result.gcSkew < 0 ? (
                            <Badge variant="secondary" className="font-mono">
                              C &gt; G
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-mono">
                              G = C
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {results.length > 100 && (
                <div className="text-xs text-muted-foreground font-mono text-center mt-2">
                  {t("tools.gc-skew.showingFirst", "Showing first 100 of")} {results.length} {t("tools.gc-skew.windows", "windows")}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 说明 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            <div className="font-bold mb-1">{t("tools.gc-skew.about", "About GC Skew")}:</div>
            {t("tools.gc-skew.aboutText", "GC Skew = (G-C)/(G+C) indicates strand asymmetry. Positive values mean more G than C, negative values mean more C than G. Sharp transitions often indicate replication origins (oriC) or terminus regions.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default GcSkewAnalyzer
