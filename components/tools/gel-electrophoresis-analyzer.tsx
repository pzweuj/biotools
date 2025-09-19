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
import { BarChart3, Ruler, Zap, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type MarkerBand = {
  size: number // bp or kDa
  distance: number // migration distance in mm
}

type StandardCurve = {
  slope: number
  intercept: number
  rSquared: number
}

type UnknownBand = {
  id: string
  name: string
  distance: number
  intensity?: number
  estimatedSize?: number
  concentration?: number
}

type DNAMarker = {
  name: string
  bands: number[] // sizes in bp
}

type ProteinMarker = {
  name: string
  bands: number[] // sizes in kDa
}

// 常用DNA分子量标准
const DNA_MARKERS: DNAMarker[] = [
  { name: "1kb DNA Ladder", bands: [10000, 8000, 6000, 5000, 4000, 3000, 2500, 2000, 1500, 1000, 750, 500, 250] },
  { name: "100bp DNA Ladder", bands: [1500, 1200, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100] },
  { name: "λ DNA/HindIII", bands: [23130, 9416, 6557, 4361, 2322, 2027, 564, 125] },
  { name: "φX174/HaeIII", bands: [1353, 1078, 872, 603, 310, 281, 271, 234, 194, 118, 72] }
]

// 常用蛋白质分子量标准
const PROTEIN_MARKERS: ProteinMarker[] = [
  { name: "Broad Range (2-212 kDa)", bands: [212, 158, 116, 97, 66, 55, 37, 31, 24, 17, 12, 6, 4, 2] },
  { name: "Mid Range (14-116 kDa)", bands: [116, 97, 66, 55, 37, 31, 24, 17, 14] },
  { name: "Low Range (3.4-40 kDa)", bands: [40, 35, 25, 18, 14, 10, 7, 3.4] },
  { name: "High Range (46-480 kDa)", bands: [480, 242, 146, 66, 46] }
]

export function GelElectrophoresisAnalyzer() {
  const { t } = useI18n()
  const [gelType, setGelType] = useState<'dna' | 'protein'>('dna')
  const [selectedMarker, setSelectedMarker] = useState("")
  const [markerBands, setMarkerBands] = useState<MarkerBand[]>([])
  const [unknownBands, setUnknownBands] = useState<UnknownBand[]>([
    { id: '1', name: 'Band 1', distance: 0 }
  ])
  const [standardInput, setStandardInput] = useState("")
  const [intensityStandards, setIntensityStandards] = useState("")

  // 解析标准曲线数据
  const parseStandardData = (text: string): MarkerBand[] => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    const data: MarkerBand[] = []
    
    for (const line of lines) {
      const parts = line.split(/[\t,]/).map(p => p.trim())
      if (parts.length >= 2) {
        const size = parseFloat(parts[0])
        const distance = parseFloat(parts[1])
        if (!isNaN(size) && !isNaN(distance)) {
          data.push({ size, distance })
        }
      }
    }
    return data.sort((a, b) => b.size - a.size) // 按分子量降序排列
  }

  // 线性回归计算
  const calculateStandardCurve = (bands: MarkerBand[]): StandardCurve => {
    if (bands.length < 2) return { slope: 0, intercept: 0, rSquared: 0 }

    // 使用对数分子量 vs 迁移距离
    const points = bands.map(b => ({ x: b.distance, y: Math.log10(b.size) }))
    const n = points.length
    
    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)
    const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // 计算R²
    const yMean = sumY / n
    const ssRes = points.reduce((sum, p) => {
      const predicted = slope * p.x + intercept
      return sum + Math.pow(p.y - predicted, 2)
    }, 0)
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0)
    const rSquared = 1 - (ssRes / ssTot)

    return { slope, intercept, rSquared }
  }

  // 估算未知条带大小
  const estimateBandSize = (distance: number, curve: StandardCurve): number => {
    const logSize = curve.slope * distance + curve.intercept
    return Math.pow(10, logSize)
  }

  // 解析浓度标准数据
  const parseIntensityData = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim())
    const data: { concentration: number; intensity: number }[] = []
    
    for (const line of lines) {
      const parts = line.split(/[\t,]/).map(p => p.trim())
      if (parts.length >= 2) {
        const concentration = parseFloat(parts[0])
        const intensity = parseFloat(parts[1])
        if (!isNaN(concentration) && !isNaN(intensity)) {
          data.push({ concentration, intensity })
        }
      }
    }
    return data
  }

  // 浓度定量分析
  const quantifyConcentration = (intensity: number, standards: { concentration: number; intensity: number }[]): number => {
    if (standards.length < 2) return 0

    // 线性回归: intensity = slope * concentration + intercept
    const n = standards.length
    const sumX = standards.reduce((sum, s) => sum + s.concentration, 0)
    const sumY = standards.reduce((sum, s) => sum + s.intensity, 0)
    const sumXY = standards.reduce((sum, s) => sum + s.concentration * s.intensity, 0)
    const sumXX = standards.reduce((sum, s) => sum + s.concentration * s.concentration, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // 根据强度计算浓度
    return (intensity - intercept) / slope
  }

  // 选择预设标准
  const selectPresetMarker = (markerName: string) => {
    const marker = gelType === 'dna' 
      ? DNA_MARKERS.find(m => m.name === markerName)
      : PROTEIN_MARKERS.find(m => m.name === markerName)
    
    if (marker) {
      const bands = marker.bands.map((size, index) => ({
        size,
        distance: 10 + index * 5 // 示例距离，用户需要实际测量
      }))
      setMarkerBands(bands)
      setStandardInput(bands.map(b => `${b.size}\t${b.distance}`).join('\n'))
    }
  }

  // 添加未知条带
  const addUnknownBand = () => {
    const newId = String(unknownBands.length + 1)
    setUnknownBands([...unknownBands, {
      id: newId,
      name: `Band ${newId}`,
      distance: 0
    }])
  }

  // 移除未知条带
  const removeUnknownBand = (id: string) => {
    if (unknownBands.length > 1) {
      setUnknownBands(unknownBands.filter(band => band.id !== id))
    }
  }

  // 更新未知条带
  const updateUnknownBand = (id: string, field: keyof UnknownBand, value: string | number | undefined) => {
    setUnknownBands(unknownBands.map(band => 
      band.id === id ? { ...band, [field]: value } : band
    ))
  }

  const standardCurve = useMemo(() => {
    const bands = standardInput ? parseStandardData(standardInput) : markerBands
    return calculateStandardCurve(bands)
  }, [standardInput, markerBands])

  const intensityData = useMemo(() => parseIntensityData(intensityStandards), [intensityStandards])

  // 计算未知条带的估算大小和浓度
  const processedUnknownBands = useMemo(() => {
    return unknownBands.map(band => {
      const estimatedSize = band.distance > 0 ? estimateBandSize(band.distance, standardCurve) : undefined
      const concentration = band.intensity && intensityData.length >= 2 
        ? quantifyConcentration(band.intensity, intensityData) 
        : undefined
      
      return {
        ...band,
        estimatedSize,
        concentration
      }
    })
  }, [unknownBands, standardCurve, intensityData])

  const clearAll = () => {
    setMarkerBands([])
    setUnknownBands([{ id: '1', name: 'Band 1', distance: 0 }])
    setStandardInput("")
    setIntensityStandards("")
    setSelectedMarker("")
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.gel-electrophoresis.name", "Gel Electrophoresis Analyzer")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.gel-electrophoresis.description", "Molecular weight standard curve, band size estimation, and concentration quantification")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standard" className="font-mono text-xs">
              <BarChart3 className="w-4 h-4 mr-1" />
              {t("tools.gel-electrophoresis.standardCurve", "Standard Curve")}
            </TabsTrigger>
            <TabsTrigger value="bands" className="font-mono text-xs">
              <Ruler className="w-4 h-4 mr-1" />
              {t("tools.gel-electrophoresis.bandAnalysis", "Band Analysis")}
            </TabsTrigger>
            <TabsTrigger value="quantification" className="font-mono text-xs">
              <Zap className="w-4 h-4 mr-1" />
              {t("tools.gel-electrophoresis.quantification", "Quantification")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-4">
            {/* 标准曲线 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t("tools.gel-electrophoresis.molecularWeightStandard", "Molecular Weight Standard")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="font-mono">{t("tools.gel-electrophoresis.gelType", "Gel Type")}</Label>
                    <Select value={gelType} onValueChange={(value: any) => setGelType(value)}>
                      <SelectTrigger className="font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dna" className="font-mono">DNA</SelectItem>
                        <SelectItem value="protein" className="font-mono">{t("tools.gel-electrophoresis.protein", "Protein")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-mono">{t("tools.gel-electrophoresis.presetMarker", "Preset Marker")}</Label>
                    <Select value={selectedMarker} onValueChange={(value) => {
                      setSelectedMarker(value)
                      if (value) selectPresetMarker(value)
                    }}>
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder={t("tools.gel-electrophoresis.selectMarker", "Select marker...")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(gelType === 'dna' ? DNA_MARKERS : PROTEIN_MARKERS).map(marker => (
                          <SelectItem key={marker.name} value={marker.name} className="font-mono">
                            {marker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono">
                    {t("tools.gel-electrophoresis.standardData", "Standard Data")} 
                    ({gelType === 'dna' ? 'bp' : 'kDa'}, {t("tools.gel-electrophoresis.distance", "Distance (mm)")})
                  </Label>
                  <Textarea
                    placeholder={gelType === 'dna' 
                      ? t("tools.gel-electrophoresis.dnaPlaceholder", "10000\t15\n5000\t25\n3000\t35\n1000\t50\n500\t65")
                      : t("tools.gel-electrophoresis.proteinPlaceholder", "116\t20\n97\t25\n66\t35\n45\t45\n31\t55")
                    }
                    value={standardInput}
                    onChange={(e) => setStandardInput(e.target.value)}
                    className="terminal-input min-h-[120px] font-mono"
                    rows={6}
                  />
                </div>

                {standardCurve.rSquared > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-mono font-medium">{t("tools.gel-electrophoresis.curveParameters", "Curve Parameters")}</h4>
                      <div className="space-y-2 text-sm font-mono bg-muted/20 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span>{t("tools.gel-electrophoresis.slope", "Slope")}:</span>
                          <span>{standardCurve.slope.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("tools.gel-electrophoresis.intercept", "Intercept")}:</span>
                          <span>{standardCurve.intercept.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>R²:</span>
                          <span className={standardCurve.rSquared >= 0.99 ? 'text-green-600' : standardCurve.rSquared >= 0.95 ? 'text-yellow-600' : 'text-red-600'}>
                            {standardCurve.rSquared.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bands" className="space-y-4">
            {/* 条带分析 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center justify-between">
                  <span className="flex items-center">
                    <Ruler className="w-4 h-4 mr-2" />
                    {t("tools.gel-electrophoresis.unknownBands", "Unknown Bands")}
                  </span>
                  <Button onClick={addUnknownBand} size="sm" className="font-mono">
                    <Plus className="w-4 h-4 mr-1" />
                    {t("tools.gel-electrophoresis.addBand", "Add Band")}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {unknownBands.map((band, index) => (
                    <div key={band.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                      <div>
                        <Label className="font-mono text-xs">{t("tools.gel-electrophoresis.bandName", "Band Name")}</Label>
                        <Input
                          value={band.name}
                          onChange={(e) => updateUnknownBand(band.id, 'name', e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <Label className="font-mono text-xs">{t("tools.gel-electrophoresis.distance", "Distance (mm)")}</Label>
                        <Input
                          type="number"
                          value={band.distance}
                          onChange={(e) => updateUnknownBand(band.id, 'distance', parseFloat(e.target.value) || 0)}
                          className="font-mono"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="font-mono text-xs">{t("tools.gel-electrophoresis.intensity", "Intensity (optional)")}</Label>
                        <Input
                          type="number"
                          value={band.intensity || ''}
                          onChange={(e) => {
                            const value = e.target.value
                            updateUnknownBand(band.id, 'intensity', value ? parseFloat(value) : undefined)
                          }}
                          className="font-mono"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-end">
                        {unknownBands.length > 1 && (
                          <Button
                            onClick={() => removeUnknownBand(band.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {processedUnknownBands.some(b => b.estimatedSize) && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-mono">{t("tools.gel-electrophoresis.bandName", "Band Name")}</TableHead>
                          <TableHead className="font-mono">{t("tools.gel-electrophoresis.distance", "Distance (mm)")}</TableHead>
                          <TableHead className="font-mono">{t("tools.gel-electrophoresis.estimatedSize", "Estimated Size")}</TableHead>
                          <TableHead className="font-mono">{t("tools.gel-electrophoresis.intensity", "Intensity")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedUnknownBands.map((band) => (
                          <TableRow key={band.id}>
                            <TableCell className="font-mono font-bold">{band.name}</TableCell>
                            <TableCell className="font-mono">{band.distance}</TableCell>
                            <TableCell className="font-mono">
                              {band.estimatedSize ? (
                                <Badge variant="outline">
                                  {band.estimatedSize.toFixed(0)} {gelType === 'dna' ? 'bp' : 'kDa'}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="font-mono">{band.intensity || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quantification" className="space-y-4">
            {/* 浓度定量 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {t("tools.gel-electrophoresis.concentrationStandards", "Concentration Standards")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono">
                    {t("tools.gel-electrophoresis.intensityData", "Intensity Data")} 
                    ({t("tools.gel-electrophoresis.concentration", "Concentration")}, {t("tools.gel-electrophoresis.intensity", "Intensity")})
                  </Label>
                  <Textarea
                    placeholder={t("tools.gel-electrophoresis.intensityPlaceholder", "100\t5000\n200\t10000\n300\t15000\n400\t20000\n500\t25000")}
                    value={intensityStandards}
                    onChange={(e) => setIntensityStandards(e.target.value)}
                    className="terminal-input min-h-[120px] font-mono"
                    rows={6}
                  />
                  <div className="text-xs text-muted-foreground font-mono">
                    {intensityData.length} {t("tools.gel-electrophoresis.standardPoints", "standard points loaded")}
                  </div>
                </div>

                {processedUnknownBands.some(b => b.concentration) && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-mono">{t("tools.gel-electrophoresis.bandName", "Band Name")}</TableHead>
                          <TableHead className="font-mono">{t("tools.gel-electrophoresis.intensity", "Intensity")}</TableHead>
                          <TableHead className="font-mono">{t("tools.gel-electrophoresis.estimatedConcentration", "Estimated Concentration")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedUnknownBands.filter(b => b.intensity).map((band) => (
                          <TableRow key={band.id}>
                            <TableCell className="font-mono font-bold">{band.name}</TableCell>
                            <TableCell className="font-mono">{band.intensity}</TableCell>
                            <TableCell className="font-mono">
                              {band.concentration ? (
                                <Badge variant="default">
                                  {band.concentration.toFixed(1)} ng/μL
                                </Badge>
                              ) : '-'}
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
        </Tabs>

        <div className="flex gap-2">
          <Button onClick={clearAll} variant="outline" className="font-mono">
            {t("common.clear", "Clear")}
          </Button>
        </div>

        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t("tools.gel-electrophoresis.note", "Standard curve uses log(molecular weight) vs migration distance. Measure distances accurately for best results. R² ≥ 0.95 recommended.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default GelElectrophoresisAnalyzer
