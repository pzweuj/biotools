"use client"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"

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
import {
  fitGelStandardCurve,
  parseGelStandardData,
  parseIntensityData,
  predictConcentration,
  predictGelSize,
} from "@/lib/bio"

type MarkerBand = {
  size: number // bp or kDa
  distance: number // migration distance in mm
}

type StandardCurve = ReturnType<typeof fitGelStandardCurve>

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

  // 选择预设标准
  const selectPresetMarker = (markerName: string) => {
    const marker = gelType === 'dna' 
      ? DNA_MARKERS.find(m => m.name === markerName)
      : PROTEIN_MARKERS.find(m => m.name === markerName)
    
    if (marker) {
      const bands = marker.bands.map((size, index) => ({
        size,
      distance: 0 // The user must enter the measured migration distance.
      }))
      setMarkerBands(bands)
      setStandardInput(bands.map(b => `${b.size}\t`).join('\n'))
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

  const parsedStandard = useMemo(() => standardInput
    ? parseGelStandardData(standardInput)
    : { bands: markerBands, error: null }, [standardInput, markerBands])
  const standardCurve = useMemo(() => {
    if (parsedStandard.error) return null
    return fitGelStandardCurve(parsedStandard.bands)
  }, [parsedStandard.bands, parsedStandard.error])

  const parsedIntensity = useMemo(() => parseIntensityData(intensityStandards), [intensityStandards])
  const intensityData = useMemo(() => parsedIntensity.error ? [] : parsedIntensity.standards, [parsedIntensity.error, parsedIntensity.standards])

  // 计算未知条带的估算大小和浓度
  const processedUnknownBands = useMemo(() => {
    return unknownBands.map(band => {
      const estimatedSize = band.distance > 0 && standardCurve ? predictGelSize(band.distance, standardCurve) ?? undefined : undefined
      const concentration = band.intensity != null && intensityData.length >= 2
        ? predictConcentration(band.intensity, intensityData) ?? undefined
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
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>
          {t("tools.gel-electrophoresis.name", "Gel Electrophoresis Analyzer")}
        </ToolPageTitle>
        <ToolPageDescription>
          {t("tools.gel-electrophoresis.description", "Molecular weight standard curve, band size estimation, and concentration quantification")}
        </ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standard" className="text-xs">
              <BarChart3 className="w-4 h-4 mr-1" />
              {t("tools.gel-electrophoresis.standardCurve", "Standard Curve")}
            </TabsTrigger>
            <TabsTrigger value="bands" className="text-xs">
              <Ruler className="w-4 h-4 mr-1" />
              {t("tools.gel-electrophoresis.bandAnalysis", "Band Analysis")}
            </TabsTrigger>
            <TabsTrigger value="quantification" className="text-xs">
              <Zap className="w-4 h-4 mr-1" />
              {t("tools.gel-electrophoresis.quantification", "Quantification")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-4">
            {/* 标准曲线 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t("tools.gel-electrophoresis.molecularWeightStandard", "Molecular Weight Standard")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="">{t("tools.gel-electrophoresis.gelType", "Gel Type")}</Label>
                    <Select value={gelType} onValueChange={(value: any) => setGelType(value)}>
                      <SelectTrigger className="">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dna" className="">DNA</SelectItem>
                        <SelectItem value="protein" className="">{t("tools.gel-electrophoresis.protein", "Protein")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="">{t("tools.gel-electrophoresis.presetMarker", "Preset Marker")}</Label>
                    <Select value={selectedMarker} onValueChange={(value) => {
                      setSelectedMarker(value)
                      if (value) selectPresetMarker(value)
                    }}>
                      <SelectTrigger className="">
                        <SelectValue placeholder={t("tools.gel-electrophoresis.selectMarker", "Select marker...")} />
                      </SelectTrigger>
                      <SelectContent>
                        {(gelType === 'dna' ? DNA_MARKERS : PROTEIN_MARKERS).map(marker => (
                          <SelectItem key={marker.name} value={marker.name} className="">
                            {marker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="">
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

                {parsedStandard.error && <Alert variant="destructive"><AlertDescription>{parsedStandard.error}</AlertDescription></Alert>}
                {!parsedStandard.error && standardInput.trim() && parsedStandard.bands.length < 2 && (
                  <Alert variant="destructive"><AlertDescription>{t("tools.gel-electrophoresis.needTwoBands", "Enter at least two valid ladder bands with measured distances.")}</AlertDescription></Alert>
                )}
                {!parsedStandard.error && standardInput.trim() && parsedStandard.bands.length >= 2 && !standardCurve && (
                  <Alert variant="destructive"><AlertDescription>{t("tools.gel-electrophoresis.distinctDistances", "Measured migration distances must contain at least two distinct values.")}</AlertDescription></Alert>
                )}
                {standardCurve && Number.isFinite(standardCurve.slope) && Number.isFinite(standardCurve.intercept) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">{t("tools.gel-electrophoresis.curveParameters", "Curve Parameters")}</h4>
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
                          <span className={standardCurve.rSquared != null && standardCurve.rSquared >= 0.99 ? 'text-green-600' : standardCurve.rSquared != null && standardCurve.rSquared >= 0.95 ? 'text-yellow-600' : 'text-red-600'}>
                            {standardCurve.rSquared == null ? "undefined" : standardCurve.rSquared.toFixed(4)}
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
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center">
                    <Ruler className="w-4 h-4 mr-2" />
                    {t("tools.gel-electrophoresis.unknownBands", "Unknown Bands")}
                  </span>
                  <Button onClick={addUnknownBand} size="sm" className="">
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
                        <Label className="text-xs">{t("tools.gel-electrophoresis.bandName", "Band Name")}</Label>
                        <Input
                          value={band.name}
                          onChange={(e) => updateUnknownBand(band.id, 'name', e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t("tools.gel-electrophoresis.distance", "Distance (mm)")}</Label>
                        <Input
                          type="number"
                          value={band.distance}
                          onChange={(e) => updateUnknownBand(band.id, 'distance', parseFloat(e.target.value) || 0)}
                          className="font-mono"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t("tools.gel-electrophoresis.intensity", "Intensity (optional)")}</Label>
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

                {processedUnknownBands.some(b => b.estimatedSize != null) && (
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
                              {band.estimatedSize != null ? (
                                <Badge variant="outline">
                                  {band.estimatedSize.toFixed(0)} {gelType === 'dna' ? 'bp' : 'kDa'}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="font-mono">{band.intensity ?? '-'}</TableCell>
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
                <CardTitle className="text-sm flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {t("tools.gel-electrophoresis.concentrationStandards", "Concentration Standards")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="">
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
                  {parsedIntensity.error && <Alert variant="destructive"><AlertDescription>{parsedIntensity.error}</AlertDescription></Alert>}
                </div>

                {processedUnknownBands.some(b => b.concentration != null) && (
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
                        {processedUnknownBands.filter((band) => band.intensity != null).map((band) => (
                          <TableRow key={band.id}>
                            <TableCell className="font-mono font-bold">{band.name}</TableCell>
                            <TableCell className="font-mono">{band.intensity}</TableCell>
                            <TableCell className="font-mono">
                              {band.concentration != null ? (
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
          <Button onClick={clearAll} variant="outline" className="">
            {t("common.clear", "Clear")}
          </Button>
        </div>

        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t("tools.gel-electrophoresis.note", "Standard curve uses log(molecular weight) vs migration distance. Measure distances accurately for best results. R² ≥ 0.95 recommended.")}
          </AlertDescription>
        </Alert>
      </ToolPageContent>
    </ToolPage>
  )
}

export default GelElectrophoresisAnalyzer
