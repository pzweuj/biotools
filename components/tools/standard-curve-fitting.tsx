"use client"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Calculator, TrendingUp, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { fitCalibration, parseCalibrationData, predictCalibration, type CalibrationFit } from "@/lib/bio"

interface DataPoint {
  x: number
  y: number
}

type FitResult = CalibrationFit & { predictedPoints: DataPoint[] }

export function StandardCurveFitting() {
  const { t } = useI18n()
  
  const [dataInput, setDataInput] = useState("")
  const [fitType, setFitType] = useState<'linear' | 'logarithmic' | 'exponential' | 'power'>('linear')
  const [unknownValues, setUnknownValues] = useState("")
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [dataError, setDataError] = useState<string | null>(null)
  
  const parseData = (text = dataInput) => {
    const parsed = parseCalibrationData(text)
    setDataPoints(parsed.points)
    setDataError(parsed.error)
  }
  
  // 执行拟合；保留错误信息以便页面解释为什么没有结果。
  const fitState = useMemo(() => {
    if (dataError || dataPoints.length < 2) return { result: null, error: null as string | null }

    try {
      const fit = fitCalibration(dataPoints, fitType)
      return {
        result: {
          ...fit,
          predictedPoints: dataPoints.map((point, index) => ({ x: point.x, y: fit.predicted[index] })),
        },
        error: null,
      }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Unable to fit these data",
      }
    }
  }, [dataPoints, fitType, dataError])
  const fitResult = fitState.result

  // 预测未知值。非法 token 或不满足模型定义域时不保留同一批输入中的部分伪结果。
  const predictionState = useMemo(() => {
    if (!fitResult || !unknownValues.trim()) return { values: [] as DataPoint[], error: null as string | null }
    const tokens = unknownValues.split(/[,\s\n]+/).filter(Boolean)
    const values = tokens.map((token) => Number(token))
    if (values.some((value) => !Number.isFinite(value))) {
      return { values: [], error: "Unknown X values must be finite numbers" }
    }
    const predicted = values.map((value) => ({ x: value, y: predictCalibration(fitResult, value) }))
    if (predicted.some((point) => point.y == null)) {
      return { values: [], error: "One or more unknown X values are outside the selected model domain" }
    }
    return {
      values: predicted.map((point) => ({ x: point.x, y: point.y as number })),
      error: null,
    }
  }, [fitResult, unknownValues])
  const predictions = predictionState.values
  
  const clearAll = () => {
    setDataInput("")
    setDataPoints([])
    setDataError(null)
    setUnknownValues("")
  }
  
  const loadExample = () => {
    const example = `# Concentration (x) vs Absorbance (y)
0	0.05
10	0.15
20	0.25
30	0.35
40	0.45
50	0.55
60	0.65`
    setDataInput(example)
    parseData(example)
  }

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>
          <LineChart className="w-5 h-5" />
          {t("tools.standard-curve.name", "Standard Curve Fitting")}
        </ToolPageTitle>
        <ToolPageDescription>
          {t("tools.standard-curve.description", "Fit standard curves with linear, logarithmic, exponential, or power models - calculate R² and predict unknown values")}
        </ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        {/* 数据输入 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              {t("tools.standard-curve.dataInput", "Data Input")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-input" className="">
                {t("tools.standard-curve.dataLabel", "X-Y Data Points")}
              </Label>
              <Textarea
                id="data-input"
                placeholder={t("tools.standard-curve.dataPlaceholder", "Enter data as X Y pairs (one per line)\nExample:\n0 0.05\n10 0.15\n20 0.25")}
                value={dataInput}
                    onChange={(e) => { setDataInput(e.target.value); setDataPoints([]); setDataError(null) }}
                className="terminal-input min-h-[150px] font-mono"
                rows={8}
              />
              <div className="text-xs text-muted-foreground font-mono">
                {t("tools.standard-curve.formatHint", "Supports tab, comma, semicolon, or space separated values. Lines starting with # are ignored.")}
              </div>
              {dataError && <Alert variant="destructive"><AlertDescription>{dataError}</AlertDescription></Alert>}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => parseData()} className="flex-1">
                {t("tools.standard-curve.loadData", "Load Data")}
              </Button>
              <Button onClick={loadExample} variant="outline" className="">
                {t("tools.standard-curve.loadExample", "Example")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="">
                {t("common.clear")}
              </Button>
            </div>

            {dataPoints.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {t("tools.standard-curve.dataLoaded", "Loaded")} {dataPoints.length} {t("tools.standard-curve.dataPoints", "data points")}
                </AlertDescription>
              </Alert>
            )}
            {fitState.error && <Alert variant="destructive"><AlertDescription>{fitState.error}</AlertDescription></Alert>}
          </CardContent>
        </Card>

        {/* 拟合设置 */}
        {dataPoints.length >= 2 && (
          <Card className="border-2 border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t("tools.standard-curve.fittingOptions", "Fitting Options")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="">{t("tools.standard-curve.fitType", "Fit Type")}</Label>
                <Select value={fitType} onValueChange={(v) => setFitType(v as any)}>
                  <SelectTrigger className="">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear" className="">
                      {t("tools.standard-curve.linear", "Linear")} (y = a + bx)
                    </SelectItem>
                    <SelectItem value="logarithmic" className="">
                      {t("tools.standard-curve.logarithmic", "Logarithmic")} (y = a + b*ln(x))
                    </SelectItem>
                    <SelectItem value="exponential" className="">
                      {t("tools.standard-curve.exponential", "Exponential")} (y = a * e^(bx))
                    </SelectItem>
                    <SelectItem value="power" className="">
                      {t("tools.standard-curve.power", "Power")} (y = a * x^b)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 拟合结果 */}
        {fitResult && (
          <>
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm ">
                  {t("tools.standard-curve.fitResults", "Fit Results")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-xs text-muted-foreground font-mono mb-1">
                      {t("tools.standard-curve.equation", "Equation")}
                    </div>
                    <div className="text-lg font-mono font-bold break-all">
                      {fitResult.equation}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-xs text-muted-foreground font-mono mb-1">
                      R² {t("tools.standard-curve.coefficient", "(Coefficient of Determination)")}
                    </div>
                    <div className="text-lg font-mono font-bold">
                      {fitResult.rSquared == null ? "undefined" : fitResult.rSquared.toFixed(6)}
                      {fitResult.rSquared != null && fitResult.rSquared > 0.99 && (
                        <Badge variant="default" className="ml-2">
                          {t("tools.standard-curve.excellent", "Excellent")}
                        </Badge>
                      )}
                      {fitResult.rSquared != null && fitResult.rSquared > 0.95 && fitResult.rSquared <= 0.99 && (
                        <Badge variant="secondary" className="ml-2">
                          {t("tools.standard-curve.good", "Good")}
                        </Badge>
                      )}
                      {fitResult.rSquared != null && fitResult.rSquared <= 0.95 && (
                        <Badge variant="outline" className="ml-2">
                          {t("tools.standard-curve.fair", "Fair")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* 数据表格 */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono font-bold text-center">X</TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          Y {t("tools.standard-curve.observed", "(Observed)")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          Y {t("tools.standard-curve.predicted", "(Predicted)")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.standard-curve.residual", "Residual")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataPoints.map((point, index) => {
                        const predicted = fitResult.predictedPoints[index]
                        const residual = Number.isFinite(predicted?.y) ? point.y - predicted.y : NaN
                        return (
                          <TableRow key={index}>
                            <TableCell className="text-center font-mono">{point.x.toFixed(4)}</TableCell>
                            <TableCell className="text-center font-mono">{point.y.toFixed(4)}</TableCell>
                            <TableCell className="text-center font-mono">{Number.isFinite(predicted?.y) ? predicted.y.toFixed(4) : "N/A"}</TableCell>
                            <TableCell className="text-center font-mono">
                              <Badge variant={Math.abs(residual) < 0.01 ? "default" : "outline"}>
                                {Number.isFinite(residual) ? residual.toFixed(4) : "N/A"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 预测未知值 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm ">
                  {t("tools.standard-curve.predictUnknown", "Predict Unknown Values")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unknown-values" className="">
                    {t("tools.standard-curve.unknownX", "Enter X values (comma or space separated)")}
                  </Label>
                  <Input
                    id="unknown-values"
                    value={unknownValues}
                    onChange={(e) => setUnknownValues(e.target.value)}
                    className="terminal-input"
                    placeholder="15, 25, 35, 45"
                  />
                </div>

                {predictionState.error && <Alert variant="destructive"><AlertDescription>{predictionState.error}</AlertDescription></Alert>}

                {predictions.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-mono font-bold text-center">
                            X {t("tools.standard-curve.input", "(Input)")}
                          </TableHead>
                          <TableHead className="font-mono font-bold text-center">
                            Y {t("tools.standard-curve.predicted", "(Predicted)")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {predictions.map((pred, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-center font-mono">{pred.x.toFixed(4)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-mono">
                                {pred.y.toFixed(4)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t("tools.standard-curve.methodNote", "Exponential and power fits use log-linearization. Predictions are forward y-from-x only; no inverse calibration is performed.")}
              </AlertDescription>
            </Alert>
          </>
        )}
      </ToolPageContent>
    </ToolPage>
  )
}

export default StandardCurveFitting
