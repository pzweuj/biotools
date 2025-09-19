"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, FlaskConical, Microscope, Activity } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type MediaComponent = {
  name: string
  concentration: string
  volume: number
  finalConcentration: string
}

type CellLine = {
  name: string
  recommendedDensity: [number, number] // min, max cells/cm²
  splitRatio: [number, number] // min, max ratio
  doublingTime: number // hours
}

// 常用细胞系参数
const CELL_LINES: CellLine[] = [
  { name: "HEK293", recommendedDensity: [3000, 8000], splitRatio: [3, 10], doublingTime: 24 },
  { name: "HeLa", recommendedDensity: [2000, 6000], splitRatio: [3, 8], doublingTime: 20 },
  { name: "A549", recommendedDensity: [2500, 7000], splitRatio: [3, 6], doublingTime: 22 },
  { name: "MCF-7", recommendedDensity: [3000, 8000], splitRatio: [2, 5], doublingTime: 29 },
  { name: "U-87 MG", recommendedDensity: [2000, 5000], splitRatio: [3, 8], doublingTime: 28 },
  { name: "CHO", recommendedDensity: [4000, 10000], splitRatio: [4, 10], doublingTime: 18 }
]

export function CellCultureCalculator() {
  const { t } = useI18n()
  
  // 细胞密度计算
  const [cellCount, setCellCount] = useState("")
  const [squaresCounted, setSquaresCounted] = useState("4")
  const [dilutionFactor, setDilutionFactor] = useState("1")
  const [chamberType, setChamberType] = useState("standard") // standard, improved
  
  // 传代计算
  const [selectedCellLine, setSelectedCellLine] = useState("HEK293")
  const [currentDensity, setCurrentDensity] = useState("")
  const [targetDensity, setTargetDensity] = useState("")
  const [flaskArea, setFlaskArea] = useState("25") // cm²
  const [newFlaskArea, setNewFlaskArea] = useState("75")
  
  // 培养基配制
  const [mediaVolume, setMediaVolume] = useState("500")
  const [mediaComponents, setMediaComponents] = useState<MediaComponent[]>([
    { name: "FBS", concentration: "10%", volume: 0, finalConcentration: "10%" },
    { name: "Penicillin/Streptomycin", concentration: "100×", volume: 0, finalConcentration: "1×" },
    { name: "L-Glutamine", concentration: "200mM", volume: 0, finalConcentration: "2mM" }
  ])
  
  // 细胞活力统计
  const [liveCells, setLiveCells] = useState("")
  const [deadCells, setDeadCells] = useState("")
  const [totalCellsViability, setTotalCellsViability] = useState("")

  const currentCellLine = CELL_LINES.find(line => line.name === selectedCellLine)

  // 血细胞计数板计算
  const cellDensityCalculation = useMemo(() => {
    const count = parseFloat(cellCount)
    const squares = parseFloat(squaresCounted)
    const dilution = parseFloat(dilutionFactor)
    
    if (isNaN(count) || isNaN(squares) || isNaN(dilution) || squares === 0) return null
    
    // 标准血细胞计数板: 1个大方格 = 0.1 μL = 1×10⁻⁴ mL
    // 改良血细胞计数板: 1个大方格 = 0.04 μL = 4×10⁻⁵ mL
    const volumePerSquare = chamberType === "standard" ? 1e-4 : 4e-5 // mL
    const totalVolume = squares * volumePerSquare
    
    const cellsPerMl = (count / totalVolume) * dilution
    const cellsPerμl = cellsPerMl / 1000
    
    return {
      cellsPerMl,
      cellsPerμl,
      totalVolume,
      averageCellsPerSquare: count / squares
    }
  }, [cellCount, squaresCounted, dilutionFactor, chamberType])

  // 传代计算
  const passageCalculation = useMemo(() => {
    const current = parseFloat(currentDensity)
    const target = parseFloat(targetDensity)
    const oldArea = parseFloat(flaskArea)
    const newArea = parseFloat(newFlaskArea)
    
    if (isNaN(current) || isNaN(target) || isNaN(oldArea) || isNaN(newArea)) return null
    
    const totalCells = current * oldArea
    const requiredCells = target * newArea
    const splitRatio = totalCells / requiredCells
    const dilutionRatio = requiredCells / totalCells
    
    // 计算所需培养基体积 (假设细胞悬液体积为1mL)
    const cellSuspensionVolume = 1 // mL
    const mediaVolume = (cellSuspensionVolume / dilutionRatio) - cellSuspensionVolume
    
    return {
      totalCells,
      requiredCells,
      splitRatio,
      dilutionRatio,
      cellSuspensionVolume,
      mediaVolume: Math.max(0, mediaVolume)
    }
  }, [currentDensity, targetDensity, flaskArea, newFlaskArea])

  // 培养基配制计算
  const mediaPreparation = useMemo(() => {
    const totalVol = parseFloat(mediaVolume)
    if (isNaN(totalVol)) return []
    
    return mediaComponents.map(component => {
      let volume = 0
      
      // 解析浓度格式
      if (component.concentration.includes('%')) {
        const percent = parseFloat(component.concentration.replace('%', ''))
        const finalPercent = parseFloat(component.finalConcentration.replace('%', ''))
        volume = (totalVol * finalPercent) / percent
      } else if (component.concentration.includes('×')) {
        const stockConc = parseFloat(component.concentration.replace('×', ''))
        const finalConc = parseFloat(component.finalConcentration.replace('×', ''))
        volume = (totalVol * finalConc) / stockConc
      } else if (component.concentration.includes('mM') && component.finalConcentration.includes('mM')) {
        const stockConc = parseFloat(component.concentration.replace('mM', ''))
        const finalConc = parseFloat(component.finalConcentration.replace('mM', ''))
        volume = (totalVol * finalConc) / stockConc
      }
      
      return {
        ...component,
        volume: volume
      }
    })
  }, [mediaVolume, mediaComponents])

  // 细胞活力统计
  const viabilityStats = useMemo(() => {
    const live = parseFloat(liveCells)
    const dead = parseFloat(deadCells)
    const total = parseFloat(totalCellsViability)
    
    if (!isNaN(live) && !isNaN(dead)) {
      const totalCells = live + dead
      const viability = (live / totalCells) * 100
      return {
        type: 'live_dead',
        totalCells,
        liveCells: live,
        deadCells: dead,
        viability
      }
    } else if (!isNaN(live) && !isNaN(total)) {
      const viability = (live / total) * 100
      const deadCells = total - live
      return {
        type: 'live_total',
        totalCells: total,
        liveCells: live,
        deadCells,
        viability
      }
    }
    
    return null
  }, [liveCells, deadCells, totalCellsViability])

  const clearAll = () => {
    setCellCount("")
    setCurrentDensity("")
    setTargetDensity("")
    setLiveCells("")
    setDeadCells("")
    setTotalCellsViability("")
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.cell-culture-calculator.name", "Cell Culture Calculator")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.cell-culture-calculator.description", "Cell density calculation, passage dilution ratios, media preparation, and viability statistics")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="density" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="density" className="font-mono text-xs">
              <Microscope className="w-4 h-4 mr-1" />
              {t("tools.cell-culture-calculator.cellDensity", "Cell Density")}
            </TabsTrigger>
            <TabsTrigger value="passage" className="font-mono text-xs">
              <Calculator className="w-4 h-4 mr-1" />
              {t("tools.cell-culture-calculator.passage", "Passage")}
            </TabsTrigger>
            <TabsTrigger value="media" className="font-mono text-xs">
              <FlaskConical className="w-4 h-4 mr-1" />
              {t("tools.cell-culture-calculator.media", "Media")}
            </TabsTrigger>
            <TabsTrigger value="viability" className="font-mono text-xs">
              <Activity className="w-4 h-4 mr-1" />
              {t("tools.cell-culture-calculator.viability", "Viability")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="density" className="space-y-4">
            {/* 细胞密度计算 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Microscope className="w-4 h-4 mr-2" />
                  {t("tools.cell-culture-calculator.hemocytometer", "Hemocytometer Counting")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.chamberType", "Chamber Type")}</Label>
                      <Select value={chamberType} onValueChange={setChamberType}>
                        <SelectTrigger className="font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard" className="font-mono">{t("tools.cell-culture-calculator.standard", "Standard (0.1 μL/square)")}</SelectItem>
                          <SelectItem value="improved" className="font-mono">{t("tools.cell-culture-calculator.improved", "Improved Neubauer (0.04 μL/square)")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.cellCount", "Cell Count")}</Label>
                      <Input
                        type="number"
                        value={cellCount}
                        onChange={(e) => setCellCount(e.target.value)}
                        className="font-mono"
                        placeholder="120"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.squaresCounted", "Squares Counted")}</Label>
                      <Input
                        type="number"
                        value={squaresCounted}
                        onChange={(e) => setSquaresCounted(e.target.value)}
                        className="font-mono"
                        placeholder="4"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.dilutionFactor", "Dilution Factor")}</Label>
                      <Input
                        type="number"
                        value={dilutionFactor}
                        onChange={(e) => setDilutionFactor(e.target.value)}
                        className="font-mono"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {cellDensityCalculation && (
                    <div className="space-y-3">
                      <h4 className="font-mono font-medium">{t("tools.cell-culture-calculator.results", "Results")}</h4>
                      <div className="space-y-2 bg-muted/20 p-4 rounded-lg">
                        <div className="space-y-2 text-sm font-mono">
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.cellsPerMl", "Cells/mL")}:</span>
                            <span className="font-bold">{cellDensityCalculation.cellsPerMl.toExponential(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.cellsPerUl", "Cells/μL")}:</span>
                            <span>{cellDensityCalculation.cellsPerμl.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.avgPerSquare", "Avg/Square")}:</span>
                            <span>{cellDensityCalculation.averageCellsPerSquare.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>{t("tools.cell-culture-calculator.countedVolume", "Counted Volume")}:</span>
                            <span>{(cellDensityCalculation.totalVolume * 1000).toFixed(3)} μL</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passage" className="space-y-4">
            {/* 传代计算 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  {t("tools.cell-culture-calculator.passageCalculation", "Passage Calculation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.cellLine", "Cell Line")}</Label>
                      <Select value={selectedCellLine} onValueChange={setSelectedCellLine}>
                        <SelectTrigger className="font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CELL_LINES.map(line => (
                            <SelectItem key={line.name} value={line.name} className="font-mono">
                              {line.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.currentDensity", "Current Density (cells/cm²)")}</Label>
                      <Input
                        type="number"
                        value={currentDensity}
                        onChange={(e) => setCurrentDensity(e.target.value)}
                        className="font-mono"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.targetDensity", "Target Density (cells/cm²)")}</Label>
                      <Input
                        type="number"
                        value={targetDensity}
                        onChange={(e) => setTargetDensity(e.target.value)}
                        className="font-mono"
                        placeholder="5000"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="font-mono text-xs">{t("tools.cell-culture-calculator.currentFlask", "Current Flask (cm²)")}</Label>
                        <Input
                          type="number"
                          value={flaskArea}
                          onChange={(e) => setFlaskArea(e.target.value)}
                          className="font-mono"
                          placeholder="25"
                        />
                      </div>
                      <div>
                        <Label className="font-mono text-xs">{t("tools.cell-culture-calculator.newFlask", "New Flask (cm²)")}</Label>
                        <Input
                          type="number"
                          value={newFlaskArea}
                          onChange={(e) => setNewFlaskArea(e.target.value)}
                          className="font-mono"
                          placeholder="75"
                        />
                      </div>
                    </div>

                    {currentCellLine && (
                      <div className="text-xs font-mono text-muted-foreground bg-muted/20 p-2 rounded">
                        <div>{t("tools.cell-culture-calculator.recommended", "Recommended")}:</div>
                        <div>• {t("tools.cell-culture-calculator.density", "Density")}: {currentCellLine.recommendedDensity[0]}-{currentCellLine.recommendedDensity[1]} cells/cm²</div>
                        <div>• {t("tools.cell-culture-calculator.splitRatio", "Split")}: 1:{currentCellLine.splitRatio[0]}-1:{currentCellLine.splitRatio[1]}</div>
                        <div>• {t("tools.cell-culture-calculator.doublingTime", "Doubling")}: {currentCellLine.doublingTime}h</div>
                      </div>
                    )}
                  </div>

                  {passageCalculation && (
                    <div className="space-y-3">
                      <h4 className="font-mono font-medium">{t("tools.cell-culture-calculator.passageProtocol", "Passage Protocol")}</h4>
                      <div className="space-y-2 bg-muted/20 p-4 rounded-lg">
                        <div className="space-y-2 text-sm font-mono">
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.totalCells", "Total Cells")}:</span>
                            <span>{passageCalculation.totalCells.toExponential(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.splitRatio", "Split Ratio")}:</span>
                            <span className="font-bold">1:{passageCalculation.splitRatio.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.cellSuspension", "Cell Suspension")}:</span>
                            <span>{passageCalculation.cellSuspensionVolume} mL</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.addMedia", "Add Media")}:</span>
                            <span className="font-bold">{passageCalculation.mediaVolume.toFixed(1)} mL</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            {/* 培养基配制 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  {t("tools.cell-culture-calculator.mediaPreparation", "Media Preparation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-mono">{t("tools.cell-culture-calculator.totalVolume", "Total Volume (mL)")}</Label>
                  <Input
                    type="number"
                    value={mediaVolume}
                    onChange={(e) => setMediaVolume(e.target.value)}
                    className="font-mono"
                    placeholder="500"
                  />
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono">{t("tools.cell-culture-calculator.component", "Component")}</TableHead>
                        <TableHead className="font-mono">{t("tools.cell-culture-calculator.stockConc", "Stock Conc.")}</TableHead>
                        <TableHead className="font-mono">{t("tools.cell-culture-calculator.finalConc", "Final Conc.")}</TableHead>
                        <TableHead className="font-mono">{t("tools.cell-culture-calculator.volume", "Volume (mL)")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mediaPreparation.map((component, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono font-bold">{component.name}</TableCell>
                          <TableCell className="font-mono">{component.concentration}</TableCell>
                          <TableCell className="font-mono">{component.finalConcentration}</TableCell>
                          <TableCell className="font-mono">
                            <Badge variant="outline">
                              {component.volume.toFixed(2)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Alert>
                  <FlaskConical className="h-4 w-4" />
                  <AlertDescription className="font-mono text-sm">
                    {t("tools.cell-culture-calculator.mediaNote", "Add components to base medium in order. Adjust volume with base medium to reach final volume. Filter sterilize if needed.")}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viability" className="space-y-4">
            {/* 细胞活力统计 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  {t("tools.cell-culture-calculator.viabilityAssessment", "Viability Assessment")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.liveCells", "Live Cells")}</Label>
                      <Input
                        type="number"
                        value={liveCells}
                        onChange={(e) => setLiveCells(e.target.value)}
                        className="font-mono"
                        placeholder="95"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.deadCells", "Dead Cells (optional)")}</Label>
                      <Input
                        type="number"
                        value={deadCells}
                        onChange={(e) => setDeadCells(e.target.value)}
                        className="font-mono"
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.cell-culture-calculator.totalCells", "Total Cells (optional)")}</Label>
                      <Input
                        type="number"
                        value={totalCellsViability}
                        onChange={(e) => setTotalCellsViability(e.target.value)}
                        className="font-mono"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {viabilityStats && (
                    <div className="space-y-3">
                      <h4 className="font-mono font-medium">{t("tools.cell-culture-calculator.viabilityResults", "Viability Results")}</h4>
                      <div className="space-y-2 bg-muted/20 p-4 rounded-lg">
                        <div className="space-y-2 text-sm font-mono">
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.totalCells", "Total Cells")}:</span>
                            <span>{viabilityStats.totalCells}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.liveCells", "Live Cells")}:</span>
                            <span className="text-green-600">{viabilityStats.liveCells}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("tools.cell-culture-calculator.deadCells", "Dead Cells")}:</span>
                            <span className="text-red-600">{viabilityStats.deadCells}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>{t("tools.cell-culture-calculator.viability", "Viability")}:</span>
                            <span className={`font-bold ${viabilityStats.viability >= 90 ? 'text-green-600' : viabilityStats.viability >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {viabilityStats.viability.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs font-mono text-muted-foreground mt-2">
                          {viabilityStats.viability >= 90 && t("tools.cell-culture-calculator.excellentViability", "Excellent viability")}
                          {viabilityStats.viability >= 70 && viabilityStats.viability < 90 && t("tools.cell-culture-calculator.goodViability", "Good viability")}
                          {viabilityStats.viability < 70 && t("tools.cell-culture-calculator.poorViability", "Poor viability - check culture conditions")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
            {t("tools.cell-culture-calculator.note", "Standard hemocytometer: 1 large square = 0.1 μL. Improved Neubauer: 1 large square = 0.04 μL. Always count viable cells using trypan blue exclusion.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default CellCultureCalculator
