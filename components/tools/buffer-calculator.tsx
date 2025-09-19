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
import { Beaker, Calculator, Zap, FlaskConical } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type BufferSystem = {
  name: string
  pKa: number
  acidForm: string
  baseForm: string
  mw_acid: number
  mw_base: number
  phRange: [number, number]
  applications: string[]
}

type Salt = {
  name: string
  formula: string
  mw: number
  dissociation: { ion: string; charge: number; count: number }[]
}

// 常用缓冲液系统
const BUFFER_SYSTEMS: BufferSystem[] = [
  {
    name: "Phosphate Buffer",
    pKa: 7.21,
    acidForm: "NaH₂PO₄",
    baseForm: "Na₂HPO₄",
    mw_acid: 119.98,
    mw_base: 141.96,
    phRange: [6.2, 8.2],
    applications: ["Cell culture", "Protein purification", "Western blot"]
  },
  {
    name: "Tris Buffer",
    pKa: 8.06,
    acidForm: "Tris-HCl",
    baseForm: "Tris",
    mw_acid: 157.6,
    mw_base: 121.14,
    phRange: [7.0, 9.0],
    applications: ["DNA/RNA work", "Protein biochemistry", "PCR"]
  },
  {
    name: "HEPES Buffer",
    pKa: 7.55,
    acidForm: "HEPES",
    baseForm: "HEPES-Na",
    mw_acid: 238.31,
    mw_base: 260.29,
    phRange: [6.8, 8.2],
    applications: ["Cell culture", "Physiological pH", "Enzyme assays"]
  },
  {
    name: "Acetate Buffer",
    pKa: 4.76,
    acidForm: "CH₃COOH",
    baseForm: "CH₃COONa",
    mw_acid: 60.05,
    mw_base: 82.03,
    phRange: [3.8, 5.8],
    applications: ["Low pH applications", "Protein precipitation", "Histology"]
  },
  {
    name: "Bicine Buffer",
    pKa: 8.35,
    acidForm: "Bicine",
    baseForm: "Bicine-Na",
    mw_acid: 163.17,
    mw_base: 185.15,
    phRange: [7.6, 9.0],
    applications: ["Protein electrophoresis", "High pH applications"]
  },
  {
    name: "MES Buffer",
    pKa: 6.15,
    acidForm: "MES",
    baseForm: "MES-Na",
    mw_acid: 195.24,
    mw_base: 217.22,
    phRange: [5.5, 6.7],
    applications: ["Plant cell culture", "Low pH protein work"]
  }
]

// 常用盐类
const SALTS: Salt[] = [
  {
    name: "Sodium Chloride",
    formula: "NaCl",
    mw: 58.44,
    dissociation: [
      { ion: "Na⁺", charge: 1, count: 1 },
      { ion: "Cl⁻", charge: -1, count: 1 }
    ]
  },
  {
    name: "Potassium Chloride",
    formula: "KCl",
    mw: 74.55,
    dissociation: [
      { ion: "K⁺", charge: 1, count: 1 },
      { ion: "Cl⁻", charge: -1, count: 1 }
    ]
  },
  {
    name: "Magnesium Chloride",
    formula: "MgCl₂",
    mw: 95.21,
    dissociation: [
      { ion: "Mg²⁺", charge: 2, count: 1 },
      { ion: "Cl⁻", charge: -1, count: 2 }
    ]
  },
  {
    name: "Calcium Chloride",
    formula: "CaCl₂",
    mw: 110.98,
    dissociation: [
      { ion: "Ca²⁺", charge: 2, count: 1 },
      { ion: "Cl⁻", charge: -1, count: 2 }
    ]
  },
  {
    name: "Sodium Sulfate",
    formula: "Na₂SO₄",
    mw: 142.04,
    dissociation: [
      { ion: "Na⁺", charge: 1, count: 2 },
      { ion: "SO₄²⁻", charge: -2, count: 1 }
    ]
  }
]

export function BufferCalculator() {
  const { t } = useI18n()
  const [selectedBuffer, setSelectedBuffer] = useState("Phosphate Buffer")
  const [targetPH, setTargetPH] = useState("7.4")
  const [totalConcentration, setTotalConcentration] = useState("100")
  const [finalVolume, setFinalVolume] = useState("1000")
  
  // 离子强度计算
  const [selectedSalt, setSelectedSalt] = useState("NaCl")
  const [saltConcentration, setSaltConcentration] = useState("150")
  
  // 摩尔浓度换算
  const [compound, setCompound] = useState("")
  const [molecularWeight, setMolecularWeight] = useState("")
  const [mass, setMass] = useState("")
  const [volume, setVolume] = useState("1000")
  const [molarity, setMolarity] = useState("")

  const currentBuffer = BUFFER_SYSTEMS.find(b => b.name === selectedBuffer)
  const currentSalt = SALTS.find(s => s.formula === selectedSalt)

  // Henderson-Hasselbalch方程计算缓冲液配比
  const calculateBufferRatio = (pH: number, pKa: number) => {
    const ratio = Math.pow(10, pH - pKa) // [A-]/[HA] = 10^(pH-pKa)
    const acidFraction = 1 / (1 + ratio)
    const baseFraction = ratio / (1 + ratio)
    return { acidFraction, baseFraction, ratio }
  }

  // 计算缓冲液配方
  const bufferRecipe = useMemo(() => {
    if (!currentBuffer) return null
    
    const pH = parseFloat(targetPH)
    const totalConc = parseFloat(totalConcentration) // mM
    const volume = parseFloat(finalVolume) // mL
    
    if (isNaN(pH) || isNaN(totalConc) || isNaN(volume)) return null
    
    const { acidFraction, baseFraction } = calculateBufferRatio(pH, currentBuffer.pKa)
    
    const acidConc = totalConc * acidFraction // mM
    const baseConc = totalConc * baseFraction // mM
    
    // 计算所需质量 (mg)
    const acidMass = (acidConc * volume * currentBuffer.mw_acid) / 1000
    const baseMass = (baseConc * volume * currentBuffer.mw_base) / 1000
    
    return {
      acidConc,
      baseConc,
      acidMass,
      baseMass,
      ratio: baseFraction / acidFraction
    }
  }, [currentBuffer, targetPH, totalConcentration, finalVolume])

  // 计算离子强度
  const ionicStrength = useMemo(() => {
    if (!currentSalt) return 0
    
    const conc = parseFloat(saltConcentration) // mM
    if (isNaN(conc)) return 0
    
    // I = 0.5 * Σ(ci * zi²)
    let strength = 0
    for (const ion of currentSalt.dissociation) {
      const ionConc = (conc * ion.count) / 1000 // M
      strength += ionConc * Math.pow(ion.charge, 2)
    }
    
    return strength * 0.5 * 1000 // 转换为mM
  }, [currentSalt, saltConcentration])

  // 摩尔浓度换算
  const molarityConversion = useMemo(() => {
    const mw = parseFloat(molecularWeight)
    const m = parseFloat(mass)
    const v = parseFloat(volume)
    const M = parseFloat(molarity)
    
    if (!isNaN(mw) && !isNaN(m) && !isNaN(v)) {
      // 从质量和体积计算摩尔浓度
      const calculatedMolarity = (m / mw) / (v / 1000)
      return { type: 'from_mass' as const, molarity: calculatedMolarity }
    } else if (!isNaN(mw) && !isNaN(M) && !isNaN(v)) {
      // 从摩尔浓度计算所需质量
      const calculatedMass = M * (v / 1000) * mw
      return { type: 'from_molarity' as const, mass: calculatedMass }
    }
    
    return null
  }, [molecularWeight, mass, volume, molarity])

  const clearAll = () => {
    setTargetPH("7.4")
    setTotalConcentration("100")
    setFinalVolume("1000")
    setSaltConcentration("150")
    setCompound("")
    setMolecularWeight("")
    setMass("")
    setMolarity("")
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.buffer-calculator.name", "Buffer Calculator")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.buffer-calculator.description", "Common buffer recipes, pH adjustment, ionic strength calculation, and molarity conversion")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="buffer" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="buffer" className="font-mono text-xs">
              <Beaker className="w-4 h-4 mr-1" />
              {t("tools.buffer-calculator.bufferRecipes", "Buffer Recipes")}
            </TabsTrigger>
            <TabsTrigger value="ph" className="font-mono text-xs">
              <Calculator className="w-4 h-4 mr-1" />
              {t("tools.buffer-calculator.phAdjustment", "pH Adjustment")}
            </TabsTrigger>
            <TabsTrigger value="ionic" className="font-mono text-xs">
              <Zap className="w-4 h-4 mr-1" />
              {t("tools.buffer-calculator.ionicStrength", "Ionic Strength")}
            </TabsTrigger>
            <TabsTrigger value="molarity" className="font-mono text-xs">
              <FlaskConical className="w-4 h-4 mr-1" />
              {t("tools.buffer-calculator.molarityConversion", "Molarity")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buffer" className="space-y-4">
            {/* 缓冲液配方 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Beaker className="w-4 h-4 mr-2" />
                  {t("tools.buffer-calculator.commonBuffers", "Common Buffer Systems")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono">{t("tools.buffer-calculator.bufferName", "Buffer")}</TableHead>
                        <TableHead className="font-mono">pKa</TableHead>
                        <TableHead className="font-mono">{t("tools.buffer-calculator.phRange", "pH Range")}</TableHead>
                        <TableHead className="font-mono">{t("tools.buffer-calculator.applications", "Applications")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {BUFFER_SYSTEMS.map((buffer) => (
                        <TableRow key={buffer.name}>
                          <TableCell className="font-mono font-bold">{buffer.name}</TableCell>
                          <TableCell className="font-mono">{buffer.pKa}</TableCell>
                          <TableCell className="font-mono">
                            <Badge variant="outline">
                              {buffer.phRange[0]} - {buffer.phRange[1]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{buffer.applications.join(', ')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ph" className="space-y-4">
            {/* pH调节计算 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  {t("tools.buffer-calculator.bufferCalculation", "Buffer Calculation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.bufferSystem", "Buffer System")}</Label>
                      <Select value={selectedBuffer} onValueChange={setSelectedBuffer}>
                        <SelectTrigger className="font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUFFER_SYSTEMS.map(buffer => (
                            <SelectItem key={buffer.name} value={buffer.name} className="font-mono">
                              {buffer.name} (pKa {buffer.pKa})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.targetPH", "Target pH")}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={targetPH}
                        onChange={(e) => setTargetPH(e.target.value)}
                        className="font-mono"
                        placeholder="7.4"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.totalConcentration", "Total Concentration (mM)")}</Label>
                      <Input
                        type="number"
                        value={totalConcentration}
                        onChange={(e) => setTotalConcentration(e.target.value)}
                        className="font-mono"
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.finalVolume", "Final Volume (mL)")}</Label>
                      <Input
                        type="number"
                        value={finalVolume}
                        onChange={(e) => setFinalVolume(e.target.value)}
                        className="font-mono"
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  {bufferRecipe && currentBuffer && (
                    <div className="space-y-3">
                      <h4 className="font-mono font-medium">{t("tools.buffer-calculator.recipe", "Recipe")}</h4>
                      <div className="space-y-3 bg-muted/20 p-4 rounded-lg">
                        <div className="space-y-2 text-sm font-mono">
                          <div className="flex justify-between">
                            <span>{currentBuffer.acidForm}:</span>
                            <span>{bufferRecipe.acidMass.toFixed(1)} mg</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{currentBuffer.baseForm}:</span>
                            <span>{bufferRecipe.baseMass.toFixed(1)} mg</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>{t("tools.buffer-calculator.ratio", "Base/Acid Ratio")}:</span>
                            <span>{bufferRecipe.ratio.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <Alert>
                          <AlertDescription className="font-mono text-xs">
                            {t("tools.buffer-calculator.instructions", "Dissolve compounds in ~80% of final volume, adjust pH if needed, then dilute to final volume.")}
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ionic" className="space-y-4">
            {/* 离子强度计算 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {t("tools.buffer-calculator.ionicStrengthCalc", "Ionic Strength Calculation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.salt", "Salt")}</Label>
                      <Select value={selectedSalt} onValueChange={setSelectedSalt}>
                        <SelectTrigger className="font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SALTS.map(salt => (
                            <SelectItem key={salt.formula} value={salt.formula} className="font-mono">
                              {salt.name} ({salt.formula})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.concentration", "Concentration (mM)")}</Label>
                      <Input
                        type="number"
                        value={saltConcentration}
                        onChange={(e) => setSaltConcentration(e.target.value)}
                        className="font-mono"
                        placeholder="150"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-mono font-medium">{t("tools.buffer-calculator.results", "Results")}</h4>
                    <div className="space-y-2 bg-muted/20 p-4 rounded-lg">
                      <div className="flex justify-between text-sm font-mono">
                        <span>{t("tools.buffer-calculator.ionicStrength", "Ionic Strength")}:</span>
                        <span className="font-bold">{ionicStrength.toFixed(1)} mM</span>
                      </div>
                      
                      {currentSalt && (
                        <div className="space-y-1 text-xs font-mono text-muted-foreground border-t pt-2">
                          <div>{t("tools.buffer-calculator.dissociation", "Dissociation")}:</div>
                          {currentSalt.dissociation.map((ion, index) => (
                            <div key={index} className="ml-2">
                              {ion.count > 1 ? `${ion.count} ` : ''}{ion.ion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="molarity" className="space-y-4">
            {/* 摩尔浓度换算 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  {t("tools.buffer-calculator.molarityCalculation", "Molarity Calculation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.compound", "Compound")}</Label>
                      <Input
                        value={compound}
                        onChange={(e) => setCompound(e.target.value)}
                        className="font-mono"
                        placeholder="NaCl, Tris, etc."
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.molecularWeight", "Molecular Weight (g/mol)")}</Label>
                      <Input
                        type="number"
                        value={molecularWeight}
                        onChange={(e) => setMolecularWeight(e.target.value)}
                        className="font-mono"
                        placeholder="58.44"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.mass", "Mass (mg)")}</Label>
                      <Input
                        type="number"
                        value={mass}
                        onChange={(e) => setMass(e.target.value)}
                        className="font-mono"
                        placeholder="584.4"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.volume", "Volume (mL)")}</Label>
                      <Input
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        className="font-mono"
                        placeholder="1000"
                      />
                    </div>

                    <div>
                      <Label className="font-mono">{t("tools.buffer-calculator.molarity", "Molarity (M)")}</Label>
                      <Input
                        type="number"
                        value={molarity}
                        onChange={(e) => setMolarity(e.target.value)}
                        className="font-mono"
                        placeholder="0.1"
                      />
                    </div>
                  </div>

                  {molarityConversion && (
                    <div className="space-y-3">
                      <h4 className="font-mono font-medium">{t("tools.buffer-calculator.calculation", "Calculation")}</h4>
                      <div className="space-y-2 bg-muted/20 p-4 rounded-lg">
                        {molarityConversion.type === 'from_mass' && 'molarity' in molarityConversion ? (
                          <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                              <span>{t("tools.buffer-calculator.calculatedMolarity", "Calculated Molarity")}:</span>
                              <span className="font-bold">{molarityConversion.molarity.toFixed(4)} M</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t("tools.buffer-calculator.millimolar", "Millimolar")}:</span>
                              <span>{(molarityConversion.molarity * 1000).toFixed(1)} mM</span>
                            </div>
                          </div>
                        ) : molarityConversion.type === 'from_molarity' && 'mass' in molarityConversion ? (
                          <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                              <span>{t("tools.buffer-calculator.requiredMass", "Required Mass")}:</span>
                              <span className="font-bold">{molarityConversion.mass.toFixed(1)} mg</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t("tools.buffer-calculator.grams", "Grams")}:</span>
                              <span>{(molarityConversion.mass / 1000).toFixed(4)} g</span>
                            </div>
                          </div>
                        ) : null}
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
          <Beaker className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t("tools.buffer-calculator.note", "Henderson-Hasselbalch equation: pH = pKa + log([A-]/[HA]). Ionic strength: I = 0.5 × Σ(ci × zi²). Always verify pH with a pH meter.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default BufferCalculator
