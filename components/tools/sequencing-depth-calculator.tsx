"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useI18n } from "@/lib/i18n"
import { Calculator, ArrowRight, Info } from "lucide-react"

type CalculationMode = "target-to-data" | "data-to-depth"

interface CalculationResult {
  mode: CalculationMode
  targetSize: number
  targetSizeUnit: string
  readLength: number
  readLengthUnit: string
  captureEfficiency: number
  targetDepth?: number
  effectiveDepth?: number
  totalReads?: number
  totalBases?: number
  dataSize?: number
  rawDataSize?: number
}

export function SequencingDepthCalculator() {
  const { t } = useI18n()
  
  // 计算模式
  const [mode, setMode] = useState<CalculationMode>("target-to-data")
  
  // 模式切换处理函数
  const handleModeChange = useCallback((newMode: CalculationMode) => {
    setMode(newMode)
    // 切换模式时清空输入数据和结果
    setTargetDepth("")
    setInputDataSize("")
    setResult(null)
  }, [])
  
  // 通用参数
  const [targetSize, setTargetSize] = useState("")
  const [targetSizeUnit, setTargetSizeUnit] = useState("bp")
  const [readLength, setReadLength] = useState("150")
  const [readLengthUnit, setReadLengthUnit] = useState("bp")
  const [captureEfficiency, setCaptureEfficiency] = useState("80")
  
  // 数据大小显示单位
  const [dataSizeUnit, setDataSizeUnit] = useState<"bp" | "KB" | "MB" | "GB">("GB")
  
  // 目标区域→数据量 模式
  const [targetDepth, setTargetDepth] = useState("")
  
  // 数据量→深度 模式
  const [inputDataSize, setInputDataSize] = useState("")
  const [inputDataSizeUnit, setInputDataSizeUnit] = useState<string>("GB")
  
  // 结果
  const [result, setResult] = useState<CalculationResult | null>(null)

  // 单位转换为bp
  const convertToBasePairs = (value: number, unit: string): number => {
    const conversions: { [key: string]: number } = {
      bp: 1,
      Kb: 1e3,
      Mb: 1e6,
      Gb: 1e9,
    }
    return value * conversions[unit]
  }

  // 单位转换为reads数
  const convertToReads = (value: number, unit: string): number => {
    const conversions: { [key: string]: number } = {
      reads: 1,
      K: 1e3,
      M: 1e6,
      G: 1e9,
    }
    return value * conversions[unit]
  }

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + " G"
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + " M"
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + " K"
    return num.toFixed(decimals)
  }

  // 转换数据大小单位
  const convertDataSize = (bytes: number, unit: "bp" | "KB" | "MB" | "GB"): number => {
    switch (unit) {
      case "bp":
        return bytes
      case "KB":
        return bytes / 1e3
      case "MB":
        return bytes / 1e6
      case "GB":
        return bytes / 1e9
      default:
        return bytes
    }
  }

  // 切换数据大小单位
  const toggleDataSizeUnit = useCallback(() => {
    const units: Array<"bp" | "KB" | "MB" | "GB"> = ["bp", "KB", "MB", "GB"]
    const currentIndex = units.indexOf(dataSizeUnit)
    const nextIndex = (currentIndex + 1) % units.length
    setDataSizeUnit(units[nextIndex])
  }, [dataSizeUnit])

  // 计算
  const calculate = useCallback(() => {
    const targetSizeValue = parseFloat(targetSize)
    const readLengthValue = parseFloat(readLength)
    const captureEfficiencyValue = parseFloat(captureEfficiency)

    if (isNaN(targetSizeValue) || isNaN(readLengthValue) || isNaN(captureEfficiencyValue)) {
      return
    }

    if (captureEfficiencyValue <= 0 || captureEfficiencyValue > 100) {
      return
    }

    const targetSizeBp = convertToBasePairs(targetSizeValue, targetSizeUnit)
    const readLengthBp = convertToBasePairs(readLengthValue, readLengthUnit)
    const efficiencyRatio = captureEfficiencyValue / 100

    if (mode === "target-to-data") {
      // 从目标区域、深度、捕获效率计算所需数据量
      const targetDepthValue = parseFloat(targetDepth)
      if (isNaN(targetDepthValue)) return

      // 目标区域需要的有效碱基数
      const targetBasesNeeded = targetSizeBp * targetDepthValue
      // 考虑捕获效率后需要的总碱基数
      const totalBasesCount = targetBasesNeeded / efficiencyRatio
      // 需要的reads数
      const totalReadsCount = totalBasesCount / readLengthBp
      // 数据大小（FASTQ约0.5字节/碱基）
      const dataSizeBytes = totalBasesCount * 0.5
      // 原始数据量（未考虑捕获效率）
      const rawDataSizeBytes = targetBasesNeeded * 0.5

      setResult({
        mode,
        targetSize: targetSizeValue,
        targetSizeUnit,
        readLength: readLengthValue,
        readLengthUnit,
        captureEfficiency: captureEfficiencyValue,
        targetDepth: targetDepthValue,
        totalReads: totalReadsCount,
        totalBases: totalBasesCount,
        dataSize: dataSizeBytes,
        rawDataSize: rawDataSizeBytes,
      })
    } else {
      // 从实际数据量计算有效深度
      const inputDataSizeValue = parseFloat(inputDataSize)
      if (isNaN(inputDataSizeValue)) return

      // 将输入的数据大小转换为字节
      let dataSizeBytes = inputDataSizeValue
      if (inputDataSizeUnit === "KB") dataSizeBytes = inputDataSizeValue * 1e3
      else if (inputDataSizeUnit === "MB") dataSizeBytes = inputDataSizeValue * 1e6
      else if (inputDataSizeUnit === "GB") dataSizeBytes = inputDataSizeValue * 1e9
      // 从数据大小计算总碱基数（FASTQ约0.5字节/碱基）
      const totalBasesCount = dataSizeBytes / 0.5
      // 计算总reads数
      const totalReadsCount = totalBasesCount / readLengthBp
      // 有效碱基数（考虑捕获效率）
      const effectiveBasesCount = totalBasesCount * efficiencyRatio
      // 有效深度
      const effectiveDepthValue = effectiveBasesCount / targetSizeBp

      setResult({
        mode,
        targetSize: targetSizeValue,
        targetSizeUnit,
        readLength: readLengthValue,
        readLengthUnit,
        captureEfficiency: captureEfficiencyValue,
        effectiveDepth: effectiveDepthValue,
        totalReads: totalReadsCount,
        totalBases: totalBasesCount,
        dataSize: dataSizeBytes,
      })
    }
  }, [targetSize, targetSizeUnit, readLength, readLengthUnit, captureEfficiency, mode, targetDepth, inputDataSize, inputDataSizeUnit])

  const clearAll = useCallback(() => {
    setTargetSize("")
    setReadLength("150")
    setReadLengthUnit("bp")
    setCaptureEfficiency("80")
    setTargetDepth("")
    setInputDataSize("")
    setDataSizeUnit("GB")
    setResult(null)
  }, [])

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.sequencing-depth.name", "Sequencing Depth Calculator")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.sequencing-depth.description", "Calculate NGS sequencing depth and required reads number")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 计算模式选择 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <Label className="text-base font-semibold font-mono">
              {t("tools.sequencing-depth.calculationMode", "Calculation Mode")}
            </Label>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mode} onValueChange={(value) => handleModeChange(value as CalculationMode)}>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="target-to-data" id="target-to-data" />
                  <Label htmlFor="target-to-data" className="flex-1 cursor-pointer font-mono">
                    <div className="font-semibold">
                      {t("tools.sequencing-depth.targetToData", "目标区域 → 数据量")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("tools.sequencing-depth.targetToDataDesc", "根据目标区域、深度需求和捕获效率计算所需数据量（常用）")}
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="data-to-depth" id="data-to-depth" />
                  <Label htmlFor="data-to-depth" className="flex-1 cursor-pointer font-mono">
                    <div className="font-semibold">
                      {t("tools.sequencing-depth.dataToDepth", "数据量 → 有效深度")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("tools.sequencing-depth.dataToDepthDesc", "根据实际数据量和捕获效率计算有效深度")}
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* 输入参数 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              {t("tools.sequencing-depth.parameters", "Parameters")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 目标区域大小 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold font-mono">
                {t("tools.sequencing-depth.targetSize", "目标区域大小")}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={mode === "target-to-data" ? "1.5 (例如：外显子组)" : "1.5"}
                  value={targetSize}
                  onChange={(e) => setTargetSize(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  className="flex-1 font-mono"
                />
                <Select value={targetSizeUnit} onValueChange={setTargetSizeUnit}>
                  <SelectTrigger className="w-24 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bp" className="font-mono">bp</SelectItem>
                    <SelectItem value="Kb" className="font-mono">Kb</SelectItem>
                    <SelectItem value="Mb" className="font-mono">Mb</SelectItem>
                    <SelectItem value="Gb" className="font-mono">Gb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {t("tools.sequencing-depth.targetSizeHint", "例如：Panel 0.5Mb，外显子组 30-50Mb，全基因组 3Gb")}
              </div>
            </div>

            {/* 读长 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold font-mono">
                {t("tools.sequencing-depth.readLength", "读长")}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="150"
                  value={readLength}
                  onChange={(e) => setReadLength(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  className="flex-1 font-mono"
                />
                <Select value={readLengthUnit} onValueChange={setReadLengthUnit}>
                  <SelectTrigger className="w-24 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bp" className="font-mono">bp</SelectItem>
                    <SelectItem value="Kb" className="font-mono">Kb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {t("tools.sequencing-depth.readLengthHint", "常用：PE150 (双端150bp)，PE100，SE50等")}
              </div>
            </div>

            {/* 捕获效率 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold font-mono">
                {t("tools.sequencing-depth.captureEfficiency", "捕获效率 (%)")}
              </Label>
              <Input
                type="number"
                placeholder="80"
                value={captureEfficiency}
                onChange={(e) => setCaptureEfficiency(e.target.value)}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                className="font-mono"
                min="0"
                max="100"
              />
              <div className="text-xs text-muted-foreground font-mono">
                {t("tools.sequencing-depth.captureEfficiencyHint", "目标区域reads占比。Panel通常40-60%，外显子组50-70%，全基因组接近100%")}
              </div>
            </div>

            {/* 条件输入：深度或reads数 */}
            {mode === "target-to-data" ? (
              <div className="space-y-2">
                <Label className="text-base font-semibold font-mono">
                  {t("tools.sequencing-depth.targetDepth", "目标深度 (×)")}
                </Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={targetDepth}
                  onChange={(e) => setTargetDepth(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  className="font-mono"
                />
                <div className="text-xs text-muted-foreground font-mono">
                  {t("tools.sequencing-depth.targetDepthHint", "常用：Panel 500-1000×，外显子组 100×，全基因组 30×")}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-base font-semibold font-mono">
                  {t("tools.sequencing-depth.inputDataSize", "数据量")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="5"
                    value={inputDataSize}
                    onChange={(e) => setInputDataSize(e.target.value)}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                    className="flex-1 font-mono"
                  />
                  <Select value={inputDataSizeUnit} onValueChange={setInputDataSizeUnit}>
                    <SelectTrigger className="w-24 font-mono">
                      <SelectValue placeholder="GB" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B" className="font-mono">B</SelectItem>
                      <SelectItem value="KB" className="font-mono">KB</SelectItem>
                      <SelectItem value="MB" className="font-mono">MB</SelectItem>
                      <SelectItem value="GB" className="font-mono">GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {t("tools.sequencing-depth.inputDataSizeHint", "输入实际测序产生的数据量（FASTQ文件大小）")}
                </div>
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-2 pt-2">
              <Button onClick={calculate} className="flex-1 font-mono">
                <Calculator className="w-4 h-4 mr-2" />
                {t("common.calculate")}
              </Button>
              <Button onClick={clearAll} variant="outline" className="font-mono">
                {t("common.clear", "Clear")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 结果显示 */}
        {result && (
          <Card className="border-2 border-primary/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center">
                <ArrowRight className="w-4 h-4 mr-2" />
                {t("tools.sequencing-depth.results", "Results")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-mono">
                    {t("tools.sequencing-depth.targetSize", "目标区域大小")}
                  </div>
                  <div className="text-lg font-bold font-mono">
                    {result.targetSize} {result.targetSizeUnit}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-mono">
                    {t("tools.sequencing-depth.readLength", "读长")}
                  </div>
                  <div className="text-lg font-bold font-mono">{result.readLength} {result.readLengthUnit}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-mono">
                    {t("tools.sequencing-depth.captureEfficiency", "捕获效率")}
                  </div>
                  <div className="text-lg font-bold font-mono">{result.captureEfficiency}%</div>
                </div>
                {result.mode === "target-to-data" && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-mono">
                      {t("tools.sequencing-depth.targetDepth", "目标深度")}
                    </div>
                    <div className="text-lg font-bold font-mono">{result.targetDepth}×</div>
                  </div>
                )}
              </div>

              <div className="border-t pt-3 space-y-3">
                {result.mode === "target-to-data" ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <span className="font-mono font-semibold">
                        {t("tools.sequencing-depth.requiredReads", "所需Reads数")}
                      </span>
                      <Badge variant="default" className="text-base font-mono px-3 py-1">
                        {formatNumber(result.totalReads!)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <span className="font-mono font-semibold">
                        {t("tools.sequencing-depth.requiredDataSize", "所需数据量")}
                      </span>
                      <Badge 
                        variant="default" 
                        className="text-base font-mono px-3 py-1 cursor-pointer hover:bg-primary/90 transition-colors"
                        onClick={toggleDataSizeUnit}
                        title="点击切换单位"
                      >
                        {convertDataSize(result.dataSize!, dataSizeUnit).toFixed(2)} {dataSizeUnit}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-mono font-semibold">
                        {t("tools.sequencing-depth.totalBases", "总碱基数")}
                      </span>
                      <Badge variant="outline" className="text-base font-mono px-3 py-1">
                        {formatNumber(result.totalBases!)} bp
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <span className="font-mono font-semibold">
                        {t("tools.sequencing-depth.effectiveDepth", "有效深度")}
                      </span>
                      <Badge variant="default" className="text-base font-mono px-3 py-1">
                        {result.effectiveDepth?.toFixed(2)}×
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-mono font-semibold">
                        {t("tools.sequencing-depth.totalReads", "总Reads数")}
                      </span>
                      <Badge variant="outline" className="text-base font-mono px-3 py-1">
                        {formatNumber(result.totalReads!)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-mono font-semibold">
                        {t("tools.sequencing-depth.totalBases", "总碱基数")}
                      </span>
                      <Badge variant="outline" className="text-base font-mono px-3 py-1">
                        {formatNumber(result.totalBases!)} bp
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-mono font-semibold">
                        {t("tools.sequencing-depth.estimatedDataSize", "数据大小")}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-base font-mono px-3 py-1 cursor-pointer hover:bg-muted transition-colors"
                        onClick={toggleDataSizeUnit}
                        title="点击切换单位"
                      >
                        {convertDataSize(result.dataSize!, dataSizeUnit).toFixed(2)} {dataSizeUnit}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 提示信息 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t(
              "tools.sequencing-depth.formula",
              "公式：有效深度 = (总Reads数 × 读长 × 捕获效率) / 目标区域大小。数据大小按FASTQ格式估算。"
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
