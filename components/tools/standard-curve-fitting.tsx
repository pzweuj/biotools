"use client"

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

interface DataPoint {
  x: number
  y: number
}

interface FitResult {
  type: 'linear' | 'logarithmic' | 'exponential' | 'power'
  equation: string
  rSquared: number
  parameters: { [key: string]: number }
  predictedPoints: DataPoint[]
}

export function StandardCurveFitting() {
  const { t } = useI18n()
  
  const [dataInput, setDataInput] = useState("")
  const [fitType, setFitType] = useState<'linear' | 'logarithmic' | 'exponential' | 'power'>('linear')
  const [unknownValues, setUnknownValues] = useState("")
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  
  // 解析数据输入
  const parseData = () => {
    const lines = dataInput.trim().split('\n')
    const points: DataPoint[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      const parts = trimmed.split(/[\t,;\s]+/)
      if (parts.length >= 2) {
        const x = parseFloat(parts[0])
        const y = parseFloat(parts[1])
        if (!isNaN(x) && !isNaN(y)) {
          points.push({ x, y })
        }
      }
    }
    
    setDataPoints(points)
  }
  
  // 线性拟合：y = a + bx
  const linearFit = (points: DataPoint[]): FitResult => {
    const n = points.length
    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0)
    
    const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const a = (sumY - b * sumX) / n
    
    const predictedPoints = points.map(p => ({ x: p.x, y: a + b * p.x }))
    const rSquared = calculateRSquared(points, predictedPoints)
    
    const sign = b >= 0 ? '+' : ''
    const equation = `y = ${a.toFixed(4)} ${sign} ${b.toFixed(4)}x`
    
    return {
      type: 'linear',
      equation,
      rSquared,
      parameters: { a, b },
      predictedPoints
    }
  }
  
  // 对数拟合：y = a + b*ln(x)
  const logarithmicFit = (points: DataPoint[]): FitResult => {
    const validPoints = points.filter(p => p.x > 0)
    const logPoints = validPoints.map(p => ({ x: Math.log(p.x), y: p.y }))
    const linearResult = linearFit(logPoints)
    
    const a = linearResult.parameters.a
    const b = linearResult.parameters.b
    
    const predictedPoints = validPoints.map(p => ({ x: p.x, y: a + b * Math.log(p.x) }))
    const rSquared = calculateRSquared(validPoints, predictedPoints)
    
    const sign = b >= 0 ? '+' : ''
    const equation = `y = ${a.toFixed(4)} ${sign} ${b.toFixed(4)}*ln(x)`
    
    return {
      type: 'logarithmic',
      equation,
      rSquared,
      parameters: { a, b },
      predictedPoints
    }
  }
  
  // 指数拟合：y = a * e^(bx)
  const exponentialFit = (points: DataPoint[]): FitResult => {
    const validPoints = points.filter(p => p.y > 0)
    const logPoints = validPoints.map(p => ({ x: p.x, y: Math.log(p.y) }))
    const linearResult = linearFit(logPoints)
    
    const a = Math.exp(linearResult.parameters.a)
    const b = linearResult.parameters.b
    
    const predictedPoints = validPoints.map(p => ({ x: p.x, y: a * Math.exp(b * p.x) }))
    const rSquared = calculateRSquared(validPoints, predictedPoints)
    
    const equation = `y = ${a.toFixed(4)} * e^(${b.toFixed(4)}x)`
    
    return {
      type: 'exponential',
      equation,
      rSquared,
      parameters: { a, b },
      predictedPoints
    }
  }
  
  // 幂函数拟合：y = a * x^b
  const powerFit = (points: DataPoint[]): FitResult => {
    const validPoints = points.filter(p => p.x > 0 && p.y > 0)
    const logPoints = validPoints.map(p => ({ x: Math.log(p.x), y: Math.log(p.y) }))
    const linearResult = linearFit(logPoints)
    
    const a = Math.exp(linearResult.parameters.a)
    const b = linearResult.parameters.b
    
    const predictedPoints = validPoints.map(p => ({ x: p.x, y: a * Math.pow(p.x, b) }))
    const rSquared = calculateRSquared(validPoints, predictedPoints)
    
    const equation = `y = ${a.toFixed(4)} * x^${b.toFixed(4)}`
    
    return {
      type: 'power',
      equation,
      rSquared,
      parameters: { a, b },
      predictedPoints
    }
  }
  
  // 计算R²
  const calculateRSquared = (observed: DataPoint[], predicted: DataPoint[]): number => {
    const meanY = observed.reduce((sum, p) => sum + p.y, 0) / observed.length
    const ssTotal = observed.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0)
    const ssResidual = observed.reduce((sum, p, i) => sum + Math.pow(p.y - predicted[i].y, 2), 0)
    return 1 - (ssResidual / ssTotal)
  }
  
  // 执行拟合
  const fitResult = useMemo(() => {
    if (dataPoints.length < 2) return null
    
    try {
      switch (fitType) {
        case 'linear':
          return linearFit(dataPoints)
        case 'logarithmic':
          return logarithmicFit(dataPoints)
        case 'exponential':
          return exponentialFit(dataPoints)
        case 'power':
          return powerFit(dataPoints)
        default:
          return null
      }
    } catch (error) {
      console.error('Fitting error:', error)
      return null
    }
  }, [dataPoints, fitType])
  
  // 预测未知值
  const predictions = useMemo(() => {
    if (!fitResult || !unknownValues.trim()) return []
    
    const values = unknownValues.split(/[,\s\n]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
    
    return values.map(value => {
      let predicted = 0
      const { a, b } = fitResult.parameters
      
      switch (fitResult.type) {
        case 'linear':
          predicted = a + b * value
          break
        case 'logarithmic':
          predicted = value > 0 ? a + b * Math.log(value) : NaN
          break
        case 'exponential':
          predicted = a * Math.exp(b * value)
          break
        case 'power':
          predicted = value > 0 ? a * Math.pow(value, b) : NaN
          break
      }
      
      return { x: value, y: predicted }
    })
  }, [fitResult, unknownValues])
  
  const clearAll = () => {
    setDataInput("")
    setDataPoints([])
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
    parseData()
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground flex items-center gap-2">
          <LineChart className="w-5 h-5" />
          {t("tools.standard-curve.name", "Standard Curve Fitting")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.standard-curve.description", "Fit standard curves with linear, logarithmic, exponential, or power models - calculate R² and predict unknown values")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 数据输入 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              {t("tools.standard-curve.dataInput", "Data Input")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-input" className="font-mono">
                {t("tools.standard-curve.dataLabel", "X-Y Data Points")}
              </Label>
              <Textarea
                id="data-input"
                placeholder={t("tools.standard-curve.dataPlaceholder", "Enter data as X Y pairs (one per line)\nExample:\n0 0.05\n10 0.15\n20 0.25")}
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                className="terminal-input min-h-[150px] font-mono"
                rows={8}
              />
              <div className="text-xs text-muted-foreground font-mono">
                {t("tools.standard-curve.formatHint", "Supports tab, comma, semicolon, or space separated values. Lines starting with # are ignored.")}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={parseData} className="font-mono flex-1">
                {t("tools.standard-curve.loadData", "Load Data")}
              </Button>
              <Button onClick={loadExample} variant="outline" className="font-mono">
                {t("tools.standard-curve.loadExample", "Example")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="font-mono">
                {t("common.clear")}
              </Button>
            </div>

            {dataPoints.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="font-mono text-sm">
                  {t("tools.standard-curve.dataLoaded", "Loaded")} {dataPoints.length} {t("tools.standard-curve.dataPoints", "data points")}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 拟合设置 */}
        {dataPoints.length >= 2 && (
          <Card className="border-2 border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t("tools.standard-curve.fittingOptions", "Fitting Options")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.standard-curve.fitType", "Fit Type")}</Label>
                <Select value={fitType} onValueChange={(v) => setFitType(v as any)}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear" className="font-mono">
                      {t("tools.standard-curve.linear", "Linear")} (y = a + bx)
                    </SelectItem>
                    <SelectItem value="logarithmic" className="font-mono">
                      {t("tools.standard-curve.logarithmic", "Logarithmic")} (y = a + b*ln(x))
                    </SelectItem>
                    <SelectItem value="exponential" className="font-mono">
                      {t("tools.standard-curve.exponential", "Exponential")} (y = a * e^(bx))
                    </SelectItem>
                    <SelectItem value="power" className="font-mono">
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
                <CardTitle className="text-sm font-mono">
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
                      {fitResult.rSquared.toFixed(6)}
                      {fitResult.rSquared > 0.99 && (
                        <Badge variant="default" className="ml-2">
                          {t("tools.standard-curve.excellent", "Excellent")}
                        </Badge>
                      )}
                      {fitResult.rSquared > 0.95 && fitResult.rSquared <= 0.99 && (
                        <Badge variant="secondary" className="ml-2">
                          {t("tools.standard-curve.good", "Good")}
                        </Badge>
                      )}
                      {fitResult.rSquared <= 0.95 && (
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
                        const residual = point.y - predicted.y
                        return (
                          <TableRow key={index}>
                            <TableCell className="text-center font-mono">{point.x.toFixed(4)}</TableCell>
                            <TableCell className="text-center font-mono">{point.y.toFixed(4)}</TableCell>
                            <TableCell className="text-center font-mono">{predicted.y.toFixed(4)}</TableCell>
                            <TableCell className="text-center font-mono">
                              <Badge variant={Math.abs(residual) < 0.01 ? "default" : "outline"}>
                                {residual.toFixed(4)}
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
                <CardTitle className="text-sm font-mono">
                  {t("tools.standard-curve.predictUnknown", "Predict Unknown Values")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unknown-values" className="font-mono">
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
                                {isNaN(pred.y) ? 'N/A' : pred.y.toFixed(4)}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StandardCurveFitting
