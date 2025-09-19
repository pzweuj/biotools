"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Calculator, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type CtData = {
  sample: string
  target: string
  ct: number
  group: 'control' | 'treatment'
}

type StandardCurvePoint = {
  dilution: number
  logDilution: number
  ct: number
}

type StandardCurveResult = {
  slope: number
  intercept: number
  rSquared: number
  efficiency: number
}

export function QpcrDataAnalyzer() {
  const { t } = useI18n()
  const [ctInput, setCtInput] = useState("")
  const [standardCurveInput, setStandardCurveInput] = useState("")
  const [referenceGene, setReferenceGene] = useState("GAPDH")
  const [controlGroup, setControlGroup] = useState("control")
  const [treatmentGroup, setTreatmentGroup] = useState("treatment")

  // 解析Ct数据
  const parseCtData = (text: string): CtData[] => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    const data: CtData[] = []
    
    for (const line of lines) {
      const parts = line.split(/[\t,]/).map(p => p.trim())
      if (parts.length >= 4) {
        const [sample, target, ctStr, group] = parts
        const ct = parseFloat(ctStr)
        if (!isNaN(ct)) {
          data.push({
            sample,
            target,
            ct,
            group: group.toLowerCase() === 'treatment' ? 'treatment' : 'control'
          })
        }
      }
    }
    return data
  }

  // 解析标准曲线数据
  const parseStandardCurve = (text: string): StandardCurvePoint[] => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    const data: StandardCurvePoint[] = []
    
    for (const line of lines) {
      const parts = line.split(/[\t,]/).map(p => p.trim())
      if (parts.length >= 2) {
        const [dilutionStr, ctStr] = parts
        const dilution = parseFloat(dilutionStr)
        const ct = parseFloat(ctStr)
        if (!isNaN(dilution) && !isNaN(ct) && dilution > 0) {
          data.push({
            dilution,
            logDilution: Math.log10(dilution),
            ct
          })
        }
      }
    }
    return data.sort((a, b) => a.logDilution - b.logDilution)
  }

  // 线性回归计算
  const linearRegression = (points: StandardCurvePoint[]): StandardCurveResult => {
    const n = points.length
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0, efficiency: 0 }

    const sumX = points.reduce((sum, p) => sum + p.logDilution, 0)
    const sumY = points.reduce((sum, p) => sum + p.ct, 0)
    const sumXY = points.reduce((sum, p) => sum + p.logDilution * p.ct, 0)
    const sumXX = points.reduce((sum, p) => sum + p.logDilution * p.logDilution, 0)
    const sumYY = points.reduce((sum, p) => sum + p.ct * p.ct, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // 计算R²
    const yMean = sumY / n
    const ssRes = points.reduce((sum, p) => {
      const predicted = slope * p.logDilution + intercept
      return sum + Math.pow(p.ct - predicted, 2)
    }, 0)
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.ct - yMean, 2), 0)
    const rSquared = 1 - (ssRes / ssTot)

    // 计算PCR效率: E = 10^(-1/slope) - 1
    const efficiency = Math.pow(10, -1 / slope) - 1

    return { slope, intercept, rSquared, efficiency }
  }

  // ΔΔCt分析
  const calculateDeltaDeltaCt = (data: CtData[]) => {
    const results: any[] = []
    const targets = [...new Set(data.map(d => d.target))].filter(t => t !== referenceGene)
    
    for (const target of targets) {
      const targetData = data.filter(d => d.target === target)
      const refData = data.filter(d => d.target === referenceGene)
      
      // 按样本分组计算ΔCt
      const samples = [...new Set(targetData.map(d => d.sample))]
      
      for (const sample of samples) {
        const targetCt = targetData.find(d => d.sample === sample)?.ct
        const refCt = refData.find(d => d.sample === sample)?.ct
        const group = targetData.find(d => d.sample === sample)?.group
        
        if (targetCt !== undefined && refCt !== undefined) {
          const deltaCt = targetCt - refCt
          results.push({
            sample,
            target,
            group,
            targetCt,
            refCt,
            deltaCt
          })
        }
      }
    }

    // 计算ΔΔCt和fold change
    const finalResults = results.map(r => {
      // 找到对照组的平均ΔCt
      const controlDeltas = results.filter(cr => 
        cr.target === r.target && cr.group === 'control'
      ).map(cr => cr.deltaCt)
      
      const controlMeanDeltaCt = controlDeltas.length > 0 
        ? controlDeltas.reduce((sum, ct) => sum + ct, 0) / controlDeltas.length 
        : 0

      const deltaDeltaCt = r.deltaCt - controlMeanDeltaCt
      const foldChange = Math.pow(2, -deltaDeltaCt)

      return {
        ...r,
        controlMeanDeltaCt,
        deltaDeltaCt,
        foldChange
      }
    })

    return finalResults
  }

  const ctData = useMemo(() => parseCtData(ctInput), [ctInput])
  const standardCurveData = useMemo(() => parseStandardCurve(standardCurveInput), [standardCurveInput])
  const curveResult = useMemo(() => linearRegression(standardCurveData), [standardCurveData])
  const deltaDeltaCtResults = useMemo(() => calculateDeltaDeltaCt(ctData), [ctData, referenceGene])

  const clearAll = () => {
    setCtInput("")
    setStandardCurveInput("")
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.qpcr-data-analyzer.name", "qPCR Data Analyzer")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.qpcr-data-analyzer.description", "Ct calculation, ΔΔCt relative quantification, standard curve fitting, and efficiency calculation")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="ddct" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ddct" className="font-mono text-xs">
              <Calculator className="w-4 h-4 mr-1" />
              {t("tools.qpcr-data-analyzer.ddctAnalysis", "ΔΔCt Analysis")}
            </TabsTrigger>
            <TabsTrigger value="standard" className="font-mono text-xs">
              <TrendingUp className="w-4 h-4 mr-1" />
              {t("tools.qpcr-data-analyzer.standardCurve", "Standard Curve")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ddct" className="space-y-4">
            {/* ΔΔCt分析 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t("tools.qpcr-data-analyzer.ddctInput", "ΔΔCt Data Input")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="font-mono">{t("tools.qpcr-data-analyzer.referenceGene", "Reference Gene")}</Label>
                    <Input
                      value={referenceGene}
                      onChange={(e) => setReferenceGene(e.target.value)}
                      className="font-mono"
                      placeholder="GAPDH"
                    />
                  </div>
                  <div>
                    <Label className="font-mono">{t("tools.qpcr-data-analyzer.controlGroup", "Control Group")}</Label>
                    <Input
                      value={controlGroup}
                      onChange={(e) => setControlGroup(e.target.value)}
                      className="font-mono"
                      placeholder="control"
                    />
                  </div>
                  <div>
                    <Label className="font-mono">{t("tools.qpcr-data-analyzer.treatmentGroup", "Treatment Group")}</Label>
                    <Input
                      value={treatmentGroup}
                      onChange={(e) => setTreatmentGroup(e.target.value)}
                      className="font-mono"
                      placeholder="treatment"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono">{t("tools.qpcr-data-analyzer.ctData", "Ct Data (Sample, Target, Ct, Group)")}</Label>
                  <Textarea
                    placeholder={t("tools.qpcr-data-analyzer.ctPlaceholder", "Sample1\tGAPDH\t20.5\tcontrol\nSample1\tGeneX\t25.2\tcontrol\nSample2\tGAPDH\t20.8\ttreatment\nSample2\tGeneX\t23.1\ttreatment")}
                    value={ctInput}
                    onChange={(e) => setCtInput(e.target.value)}
                    className="terminal-input min-h-[120px] font-mono"
                    rows={6}
                  />
                  <div className="text-xs text-muted-foreground font-mono">
                    {ctData.length} {t("tools.qpcr-data-analyzer.dataPoints", "data points loaded")}
                  </div>
                </div>

                {deltaDeltaCtResults.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-mono">{t("tools.qpcr-data-analyzer.sample", "Sample")}</TableHead>
                          <TableHead className="font-mono">{t("tools.qpcr-data-analyzer.target", "Target")}</TableHead>
                          <TableHead className="font-mono">{t("tools.qpcr-data-analyzer.group", "Group")}</TableHead>
                          <TableHead className="font-mono">ΔCt</TableHead>
                          <TableHead className="font-mono">ΔΔCt</TableHead>
                          <TableHead className="font-mono">{t("tools.qpcr-data-analyzer.foldChange", "Fold Change")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deltaDeltaCtResults.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{result.sample}</TableCell>
                            <TableCell className="font-mono">{result.target}</TableCell>
                            <TableCell>
                              <Badge variant={result.group === 'control' ? 'secondary' : 'default'}>
                                {result.group}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{result.deltaCt.toFixed(2)}</TableCell>
                            <TableCell className="font-mono">{result.deltaDeltaCt.toFixed(2)}</TableCell>
                            <TableCell className="font-mono font-bold">
                              {result.foldChange.toFixed(2)}×
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standard" className="space-y-4">
            {/* 标准曲线 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t("tools.qpcr-data-analyzer.standardCurveInput", "Standard Curve Data")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono">{t("tools.qpcr-data-analyzer.dilutionData", "Dilution Data (Dilution, Ct)")}</Label>
                  <Textarea
                    placeholder={t("tools.qpcr-data-analyzer.dilutionPlaceholder", "1000000\t15.2\n100000\t18.5\n10000\t21.8\n1000\t25.1\n100\t28.4")}
                    value={standardCurveInput}
                    onChange={(e) => setStandardCurveInput(e.target.value)}
                    className="terminal-input min-h-[120px] font-mono"
                    rows={6}
                  />
                  <div className="text-xs text-muted-foreground font-mono">
                    {standardCurveData.length} {t("tools.qpcr-data-analyzer.curvePoints", "curve points loaded")}
                  </div>
                </div>

                {standardCurveData.length >= 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-mono font-medium">{t("tools.qpcr-data-analyzer.curveParameters", "Curve Parameters")}</h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between">
                          <span>{t("tools.qpcr-data-analyzer.slope", "Slope")}:</span>
                          <span>{curveResult.slope.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("tools.qpcr-data-analyzer.intercept", "Intercept")}:</span>
                          <span>{curveResult.intercept.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>R²:</span>
                          <span className={curveResult.rSquared >= 0.99 ? 'text-green-600' : curveResult.rSquared >= 0.95 ? 'text-yellow-600' : 'text-red-600'}>
                            {curveResult.rSquared.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("tools.qpcr-data-analyzer.efficiency", "Efficiency")}:</span>
                          <span className={curveResult.efficiency >= 0.9 && curveResult.efficiency <= 1.1 ? 'text-green-600' : 'text-yellow-600'}>
                            {(curveResult.efficiency * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-mono">{t("tools.qpcr-data-analyzer.dilution", "Dilution")}</TableHead>
                            <TableHead className="font-mono">Log(Dilution)</TableHead>
                            <TableHead className="font-mono">Ct</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {standardCurveData.map((point, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{point.dilution.toExponential(1)}</TableCell>
                              <TableCell className="font-mono">{point.logDilution.toFixed(2)}</TableCell>
                              <TableCell className="font-mono">{point.ct.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button onClick={clearAll} variant="outline" className="font-mono">
            {t("common.clear", "Clear")}
          </Button>
        </div>

        <Alert>
          <Calculator className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t("tools.qpcr-data-analyzer.note", "ΔΔCt method: 2^(-ΔΔCt). PCR efficiency calculated from slope: E = 10^(-1/slope) - 1. Optimal efficiency: 90-110%.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default QpcrDataAnalyzer
