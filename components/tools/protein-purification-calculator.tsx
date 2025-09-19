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
import { Calculator, FlaskConical, BarChart3, Zap, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type AssayMethod = {
  name: string
  range: [number, number] // μg/mL
  advantages: string[]
  limitations: string[]
}

type PurificationStep = {
  id: string
  name: string
  volume: number // mL
  totalProtein: number // mg
  targetActivity: number // units
  totalActivity: number // units
}

type GelType = {
  name: string
  separationRange: [number, number] // kDa
  acrylamidePercent: number
  crosslinkerRatio: string
}

// 蛋白质浓度测定方法
const ASSAY_METHODS: AssayMethod[] = [
  {
    name: "Bradford",
    range: [1, 1400],
    advantages: ["advantage1", "advantage2", "advantage3"],
    limitations: ["limitation1", "limitation2"],
  },
  {
    name: "BCA",
    range: [0.5, 2000],
    advantages: ["advantage1", "advantage2"],
    limitations: ["limitation1", "limitation2"],
  },
  {
    name: "Lowry",
    range: [1, 2000],
    advantages: ["advantage1", "advantage2"],
    limitations: ["limitation1", "limitation2"],
  },
  {
    name: "A280",
    range: [50, 3000],
    advantages: ["advantage1", "advantage2", "advantage3"],
    limitations: ["limitation1", "limitation2"],
  }
]

// SDS-PAGE胶浓度
const GEL_TYPES: GelType[] = [
  { name: "4-20% Gradient", separationRange: [10, 250], acrylamidePercent: 12, crosslinkerRatio: "37.5:1" },
  { name: "8%", separationRange: [40, 200], acrylamidePercent: 8, crosslinkerRatio: "37.5:1" },
  { name: "10%", separationRange: [30, 150], acrylamidePercent: 10, crosslinkerRatio: "37.5:1" },
  { name: "12%", separationRange: [20, 100], acrylamidePercent: 12, crosslinkerRatio: "37.5:1" },
  { name: "15%", separationRange: [10, 80], acrylamidePercent: 15, crosslinkerRatio: "37.5:1" },
  { name: "18%", separationRange: [5, 50], acrylamidePercent: 18, crosslinkerRatio: "37.5:1" }
]

export function ProteinPurificationCalculator() {
  const { t } = useI18n()
  
  // 蛋白质浓度测定
  const [selectedAssay, setSelectedAssay] = useState("Bradford")
  const [absorbance, setAbsorbance] = useState("")
  const [standardCurve, setStandardCurve] = useState("y = 0.0012x + 0.05") // A595 = slope * conc + intercept
  const [dilutionFactor, setDilutionFactor] = useState("1")
  
  // 纯化步骤
  const [purificationSteps, setPurificationSteps] = useState<PurificationStep[]>([
    { id: '1', name: 'Crude extract', volume: 100, totalProtein: 500, targetActivity: 0, totalActivity: 1000 },
    { id: '2', name: 'Ammonium sulfate', volume: 50, totalProtein: 200, targetActivity: 0, totalActivity: 800 },
    { id: '3', name: 'Ion exchange', volume: 20, totalProtein: 50, targetActivity: 0, totalActivity: 600 },
    { id: '4', name: 'Gel filtration', volume: 10, totalProtein: 20, targetActivity: 0, totalActivity: 500 }
  ])
  
  // SDS-PAGE胶浓度
  const [targetMW, setTargetMW] = useState("")
  const [separationRange, setSeparationRange] = useState("")

  const currentAssay = ASSAY_METHODS.find(method => method.name === selectedAssay)

  // 蛋白质浓度计算
  const proteinConcentration = useMemo(() => {
    const abs = parseFloat(absorbance)
    const dilution = parseFloat(dilutionFactor)
    
    if (isNaN(abs) || isNaN(dilution)) return null
    
    // 解析标准曲线 y = mx + b
    const curveMatch = standardCurve.match(/y\s*=\s*([\d.-]+)x\s*([+-])\s*([\d.-]+)/)
    if (!curveMatch) return null
    
    const slope = parseFloat(curveMatch[1])
    const intercept = parseFloat(curveMatch[3]) * (curveMatch[2] === '+' ? 1 : -1)
    
    // 浓度 = (吸光度 - 截距) / 斜率 * 稀释倍数
    const concentration = ((abs - intercept) / slope) * dilution
    
    return {
      concentration,
      slope,
      intercept,
      inRange: currentAssay ? concentration >= currentAssay.range[0] && concentration <= currentAssay.range[1] : true
    }
  }, [absorbance, standardCurve, dilutionFactor, currentAssay])

  // 纯化表计算
  const purificationTable = useMemo(() => {
    if (purificationSteps.length === 0) return []
    
    const firstStep = purificationSteps[0]
    
    return purificationSteps.map((step, index) => {
      const concentration = step.totalProtein / step.volume // mg/mL
      const specificActivity = step.totalActivity / step.totalProtein // units/mg
      const yieldPercent = (step.totalActivity / firstStep.totalActivity) * 100 // %
      const purificationFold = specificActivity / (firstStep.totalActivity / firstStep.totalProtein)
      
      return {
        ...step,
        concentration,
        specificActivity,
        yieldPercent,
        purificationFold
      }
    })
  }, [purificationSteps])

  // 推荐胶浓度
  const recommendedGel = useMemo(() => {
    const mw = parseFloat(targetMW)
    if (isNaN(mw)) return null
    
    // 找到最适合的胶浓度
    const suitable = GEL_TYPES.filter(gel => 
      mw >= gel.separationRange[0] && mw <= gel.separationRange[1]
    )
    
    return suitable.length > 0 ? suitable : GEL_TYPES
  }, [targetMW])

  // 添加纯化步骤
  const addPurificationStep = () => {
    const newId = String(purificationSteps.length + 1)
    setPurificationSteps([...purificationSteps, {
      id: newId,
      name: `Step ${newId}`,
      volume: 0,
      totalProtein: 0,
      targetActivity: 0,
      totalActivity: 0
    }])
  }

  // 删除纯化步骤
  const removePurificationStep = (id: string) => {
    if (purificationSteps.length > 1) {
      setPurificationSteps(purificationSteps.filter(step => step.id !== id))
    }
  }

  // 更新纯化步骤
  const updatePurificationStep = (id: string, field: keyof PurificationStep, value: string | number) => {
    setPurificationSteps(purificationSteps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ))
  }

  // 还原默认纯化步骤
  const resetToDefaultSteps = () => {
    setPurificationSteps([
      { id: '1', name: 'Crude extract', volume: 100, totalProtein: 500, targetActivity: 0, totalActivity: 1000 },
      { id: '2', name: 'Ammonium sulfate', volume: 50, totalProtein: 200, targetActivity: 0, totalActivity: 800 },
      { id: '3', name: 'Ion exchange', volume: 20, totalProtein: 50, targetActivity: 0, totalActivity: 600 },
      { id: '4', name: 'Gel filtration', volume: 10, totalProtein: 20, targetActivity: 0, totalActivity: 500 }
    ])
  }

  const clearAll = () => {
    setAbsorbance("")
    setStandardCurve("y = 0.0012x + 0.05")
    setDilutionFactor("1")
    setTargetMW("")
    setSeparationRange("")
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.protein-purification.name", "Protein Purification Calculator")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.protein-purification.description", "Protein concentration assays, purification fold calculation, recovery statistics, and SDS-PAGE gel concentration")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="assay" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assay" className="font-mono text-xs">
              <FlaskConical className="w-4 h-4 mr-1" />
              {t("tools.protein-purification.assay", "Assay")}
            </TabsTrigger>
            <TabsTrigger value="purification" className="font-mono text-xs">
              <BarChart3 className="w-4 h-4 mr-1" />
              {t("tools.protein-purification.purification", "Purification")}
            </TabsTrigger>
            <TabsTrigger value="recovery" className="font-mono text-xs">
              <Calculator className="w-4 h-4 mr-1" />
              {t("tools.protein-purification.recovery", "Recovery")}
            </TabsTrigger>
            <TabsTrigger value="gel" className="font-mono text-xs">
              <Zap className="w-4 h-4 mr-1" />
              {t("tools.protein-purification.gel", "SDS-PAGE")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assay" className="space-y-4">
            {/* 蛋白质浓度测定 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  {t("tools.protein-purification.concentrationAssay", "Protein Concentration Assay")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-mono">{t("tools.protein-purification.assayMethod", "Assay Method")}</Label>
                      <Select value={selectedAssay} onValueChange={setSelectedAssay}>
                        <SelectTrigger className="font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSAY_METHODS.map(method => (
                            <SelectItem key={method.name} value={method.name} className="font-mono">
                              {method.name} ({method.range[0]}-{method.range[1]} μg/mL)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.protein-purification.absorbance", "Absorbance")}</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={absorbance}
                        onChange={(e) => setAbsorbance(e.target.value)}
                        className="font-mono"
                        placeholder="0.250"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.protein-purification.standardCurve", "Standard Curve")}</Label>
                      <Input
                        value={standardCurve}
                        onChange={(e) => setStandardCurve(e.target.value)}
                        className="font-mono"
                        placeholder="y = 0.0012x + 0.05"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.protein-purification.dilutionFactor", "Dilution Factor")}</Label>
                      <Input
                        type="number"
                        value={dilutionFactor}
                        onChange={(e) => setDilutionFactor(e.target.value)}
                        className="font-mono"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {proteinConcentration && (
                      <div>
                        <h4 className="font-mono font-medium">{t("tools.protein-purification.results", "Results")}</h4>
                        <div className="space-y-2 bg-muted/20 p-4 rounded-lg">
                          <div className="flex justify-between text-sm font-mono">
                            <span>{t("tools.protein-purification.concentration", "Concentration")}:</span>
                            <span className={`font-bold ${proteinConcentration.inRange ? 'text-green-600' : 'text-red-600'}`}>
                              {proteinConcentration.concentration.toFixed(1)} μg/mL
                            </span>
                          </div>
                          {!proteinConcentration.inRange && (
                            <div className="text-xs text-red-600 font-mono">
                              {t("tools.protein-purification.outOfRange", "Outside recommended range")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {currentAssay && (
                      <div>
                        <h4 className="font-mono font-medium">{t("tools.protein-purification.methodInfo", "Method Information")}</h4>
                        <div className="space-y-2 bg-muted/20 p-3 rounded-lg text-xs font-mono">
                          <div><strong>{t("tools.protein-purification.advantages", "Advantages")}:</strong></div>
                          <ul className="list-disc list-inside ml-2">
                            {currentAssay.advantages.map((adv, i) => (
                              <li key={i}>{t(`tools.protein-purification.${selectedAssay.toLowerCase()}.${adv}`)}</li>
                            ))}
                          </ul>
                          <div><strong>{t("tools.protein-purification.limitations", "Limitations")}:</strong></div>
                          <ul className="list-disc list-inside ml-2">
                            {currentAssay.limitations.map((lim, i) => (
                              <li key={i}>{t(`tools.protein-purification.${selectedAssay.toLowerCase()}.${lim}`)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purification" className="space-y-4">
            {/* 纯化表 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center justify-between">
                  <span className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {t("tools.protein-purification.purificationTable", "Purification Table")}
                  </span>
                  <div className="flex gap-2">
                    <Button onClick={resetToDefaultSteps} variant="outline" size="sm" className="font-mono">
                      {t("tools.protein-purification.resetDefault", "Reset Default")}
                    </Button>
                    <Button onClick={addPurificationStep} size="sm" className="font-mono">
                      <Plus className="w-4 h-4 mr-1" />
                      {t("tools.protein-purification.addStep", "Add Step")}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {purificationSteps.map((step, index) => (
                    <div key={step.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded-lg">
                      <div>
                        <Label className="font-mono text-xs">{t("tools.protein-purification.stepName", "Step")}</Label>
                        <Input
                          value={step.name}
                          onChange={(e) => updatePurificationStep(step.id, 'name', e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="font-mono text-xs">{t("tools.protein-purification.volume", "Volume (mL)")}</Label>
                        <Input
                          type="number"
                          value={step.volume}
                          onChange={(e) => updatePurificationStep(step.id, 'volume', parseFloat(e.target.value) || 0)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="font-mono text-xs">{t("tools.protein-purification.totalProtein", "Total Protein (mg)")}</Label>
                        <Input
                          type="number"
                          value={step.totalProtein}
                          onChange={(e) => updatePurificationStep(step.id, 'totalProtein', parseFloat(e.target.value) || 0)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="font-mono text-xs">{t("tools.protein-purification.totalActivity", "Total Activity (U)")}</Label>
                        <Input
                          type="number"
                          value={step.totalActivity}
                          onChange={(e) => updatePurificationStep(step.id, 'totalActivity', parseFloat(e.target.value) || 0)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-end">
                        {purificationSteps.length > 1 && (
                          <Button
                            onClick={() => removePurificationStep(step.id)}
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

                {purificationTable.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-mono">{t("tools.protein-purification.step", "Step")}</TableHead>
                          <TableHead className="font-mono">{t("tools.protein-purification.concentration", "Conc. (mg/mL)")}</TableHead>
                          <TableHead className="font-mono">{t("tools.protein-purification.specificActivity", "Sp. Activity (U/mg)")}</TableHead>
                          <TableHead className="font-mono">{t("tools.protein-purification.yield", "Yield (%)")}</TableHead>
                          <TableHead className="font-mono">{t("tools.protein-purification.purificationFold", "Fold")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purificationTable.map((step) => (
                          <TableRow key={step.id}>
                            <TableCell className="font-mono font-bold">{step.name}</TableCell>
                            <TableCell className="font-mono">{step.concentration.toFixed(1)}</TableCell>
                            <TableCell className="font-mono">{step.specificActivity.toFixed(2)}</TableCell>
                            <TableCell className="font-mono">
                              <Badge variant={step.yieldPercent >= 80 ? 'default' : step.yieldPercent >= 50 ? 'secondary' : 'destructive'}>
                                {step.yieldPercent.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              <Badge variant="outline">
                                {step.purificationFold.toFixed(1)}×
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
          </TabsContent>

          <TabsContent value="recovery" className="space-y-4">
            {/* 回收率统计 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  {t("tools.protein-purification.recoveryStatistics", "Recovery Statistics")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {purificationTable.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <div className="text-sm font-mono text-muted-foreground">{t("tools.protein-purification.overallYield", "Overall Yield")}</div>
                        <div className="text-2xl font-bold font-mono">
                          {purificationTable[purificationTable.length - 1]?.yieldPercent.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <div className="text-sm font-mono text-muted-foreground">{t("tools.protein-purification.finalPurification", "Final Purification")}</div>
                        <div className="text-2xl font-bold font-mono">
                          {purificationTable[purificationTable.length - 1]?.purificationFold.toFixed(1)}×
                        </div>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <div className="text-sm font-mono text-muted-foreground">{t("tools.protein-purification.totalSteps", "Total Steps")}</div>
                        <div className="text-2xl font-bold font-mono">
                          {purificationTable.length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gel" className="space-y-4">
            {/* SDS-PAGE胶浓度 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {t("tools.protein-purification.sdsPageGel", "SDS-PAGE Gel Calculator")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-mono">{t("tools.protein-purification.targetMW", "Target Protein MW (kDa)")}</Label>
                      <Input
                        type="number"
                        value={targetMW}
                        onChange={(e) => setTargetMW(e.target.value)}
                        className="font-mono"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {recommendedGel && (
                      <div>
                        <h4 className="font-mono font-medium">{t("tools.protein-purification.recommendedGels", "Recommended Gels")}</h4>
                        <div className="space-y-2">
                          {recommendedGel.slice(0, 3).map((gel, index) => (
                            <div key={index} className="bg-muted/20 p-2 rounded text-sm font-mono">
                              <div className="font-bold">{gel.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {t("tools.protein-purification.separationRange", "Range")}: {gel.separationRange[0]}-{gel.separationRange[1]} kDa
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono">{t("tools.protein-purification.gelType", "Gel Type")}</TableHead>
                        <TableHead className="font-mono">{t("tools.protein-purification.acrylamide", "Acrylamide %")}</TableHead>
                        <TableHead className="font-mono">{t("tools.protein-purification.separationRange", "Separation Range (kDa)")}</TableHead>
                        <TableHead className="font-mono">{t("tools.protein-purification.crosslinker", "Crosslinker")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {GEL_TYPES.map((gel) => (
                        <TableRow key={gel.name}>
                          <TableCell className="font-mono font-bold">{gel.name}</TableCell>
                          <TableCell className="font-mono">{gel.acrylamidePercent}%</TableCell>
                          <TableCell className="font-mono">{gel.separationRange[0]}-{gel.separationRange[1]}</TableCell>
                          <TableCell className="font-mono">{gel.crosslinkerRatio}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
          <FlaskConical className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t("tools.protein-purification.note", "Purification fold = (Specific activity at step) / (Initial specific activity). Yield = (Total activity at step) / (Initial total activity) × 100%.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default ProteinPurificationCalculator
