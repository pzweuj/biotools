"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, Beaker, Dna } from "lucide-react"
import { useI18n } from "@/lib/i18n"

// 分子量常数 (g/mol)
const MOLECULAR_WEIGHTS = {
  dna: { A: 331.2, T: 322.2, G: 347.2, C: 307.2, N: 327.0 },
  rna: { A: 347.2, U: 324.2, G: 363.2, C: 323.2, N: 339.5 },
  protein: {
    A: 89.1, R: 174.2, N: 132.1, D: 133.1, C: 121.2, E: 147.1, Q: 146.2, G: 75.1,
    H: 155.2, I: 131.2, L: 131.2, K: 146.2, M: 149.2, F: 165.2, P: 115.1,
    S: 105.1, T: 119.1, W: 204.2, Y: 181.2, V: 117.1, X: 137.0
  },
  modified: {
    'm6A': 361.2, 'm5C': 337.2, 'pseudoU': 324.2, 'inosine': 348.2,
    'FAM': 472.4, 'TAMRA': 430.5, 'ROX': 580.7, 'Cy3': 767.9, 'Cy5': 792.0
  }
}

interface MWResult {
  sequence: string
  name: string
  length: number
  molecularWeight: number
  type: 'dna' | 'rna' | 'protein'
  composition: { [key: string]: number }
}

export function MolecularWeightCalculator() {
  const { t } = useI18n()
  const [sequences, setSequences] = useState("")
  const [sequenceType, setSequenceType] = useState<'dna' | 'rna' | 'protein'>('dna')
  const [mwResults, setMwResults] = useState<MWResult[]>([])

  // 浓度转换状态
  const [mass, setMass] = useState("")
  const [volume, setVolume] = useState("")
  const [molecularWeight, setMolecularWeight] = useState("")
  const [massUnit, setMassUnit] = useState("ng")
  const [volumeUnit, setVolumeUnit] = useState("μL")
  const [concentrationResult, setConcentrationResult] = useState<any>(null)

  // 稀释计算状态
  const [c1, setC1] = useState("")
  const [v1, setV1] = useState("")
  const [c2, setC2] = useState("")
  const [v2, setV2] = useState("")
  const [dilutionResult, setDilutionResult] = useState<any>(null)

  const convertMassToGrams = (value: number, unit: string): number => {
    const conversions = { 'g': 1, 'mg': 1e-3, 'μg': 1e-6, 'ng': 1e-9, 'pg': 1e-12 }
    return value * (conversions[unit as keyof typeof conversions] || 1)
  }

  const convertVolumeToLiters = (value: number, unit: string): number => {
    const conversions = { 'L': 1, 'mL': 1e-3, 'μL': 1e-6, 'nL': 1e-9 }
    return value * (conversions[unit as keyof typeof conversions] || 1)
  }

  const calculateMolecularWeight = (sequence: string, type: 'dna' | 'rna' | 'protein') => {
    const cleanSeq = sequence.toUpperCase().replace(/[^A-Z]/g, '')
    const weights = MOLECULAR_WEIGHTS[type]
    const composition: { [key: string]: number } = {}
    let totalWeight = 0

    for (const char of cleanSeq) {
      if (weights[char as keyof typeof weights]) {
        composition[char] = (composition[char] || 0) + 1
        totalWeight += weights[char as keyof typeof weights]
      }
    }

    if (type === 'dna' || type === 'rna') {
      const length = cleanSeq.length
      if (length > 1) totalWeight -= (length - 1) * 18.015
    }

    if (type === 'protein') {
      const length = cleanSeq.length
      if (length > 1) totalWeight -= (length - 1) * 18.015
    }

    return { mw: totalWeight, composition }
  }

  const parseSequences = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const sequences: { name: string; sequence: string }[] = []
    let currentName = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('>')) {
        currentName = line.substring(1).trim() || `Sequence ${sequences.length + 1}`
      } else {
        const name = currentName || `Sequence ${sequences.length + 1}`
        const cleanSeq = line.replace(/[^A-Za-z]/g, '')
        if (cleanSeq.length > 0) {
          sequences.push({ name, sequence: cleanSeq })
        }
        currentName = ''
      }
    }
    return sequences
  }

  const calculateMW = () => {
    if (!sequences.trim()) return
    const sequenceList = parseSequences(sequences)
    const results: MWResult[] = []

    sequenceList.forEach(seq => {
      const { mw, composition } = calculateMolecularWeight(seq.sequence, sequenceType)
      results.push({
        sequence: seq.sequence,
        name: seq.name,
        length: seq.sequence.length,
        molecularWeight: mw,
        type: sequenceType,
        composition
      })
    })
    setMwResults(results)
  }

  const calculateConcentration = () => {
    const massVal = parseFloat(mass)
    const volumeVal = parseFloat(volume)
    const mwVal = parseFloat(molecularWeight)

    if (isNaN(massVal) || isNaN(volumeVal) || isNaN(mwVal)) return

    const massInGrams = convertMassToGrams(massVal, massUnit)
    const volumeInLiters = convertVolumeToLiters(volumeVal, volumeUnit)
    
    const moles = massInGrams / mwVal
    const calculatedMolarity = moles / volumeInLiters
    const concentration = massInGrams / volumeInLiters * 1000

    const avogadro = 6.022e23
    const copies = moles * avogadro

    setConcentrationResult({
      mass: massVal,
      volume: volumeVal,
      concentration,
      molarity: calculatedMolarity,
      copies: sequenceType !== 'protein' ? copies : undefined
    })
  }

  // 检查稀释计算字段状态
  const getDilutionFieldStates = () => {
    const fields = [
      { value: c1, name: 'c1' },
      { value: v1, name: 'v1' },
      { value: c2, name: 'c2' },
      { value: v2, name: 'v2' }
    ]
    
    const filledFields = fields.filter(field => field.value.trim() !== '' && !isNaN(parseFloat(field.value)))
    const emptyFields = fields.filter(field => field.value.trim() === '' || isNaN(parseFloat(field.value)))
    
    return {
      filledCount: filledFields.length,
      emptyCount: emptyFields.length,
      filledFields,
      emptyFields,
      shouldDisable: filledFields.length >= 3,
      canCalculate: filledFields.length === 3 && emptyFields.length === 1
    }
  }

  // 自动稀释计算
  const autoCalculateDilution = () => {
    const c1Val = parseFloat(c1)
    const v1Val = parseFloat(v1)
    const c2Val = parseFloat(c2)
    const v2Val = parseFloat(v2)

    let result: any = null

    if (!isNaN(c1Val) && !isNaN(v1Val) && !isNaN(c2Val) && (isNaN(v2Val) || v2 === '')) {
      const calculatedV2 = (c1Val * v1Val) / c2Val
      result = { c1: c1Val, v1: v1Val, c2: c2Val, v2: calculatedV2, dilutionFactor: c1Val / c2Val }
    } else if (!isNaN(c1Val) && !isNaN(v1Val) && (isNaN(c2Val) || c2 === '') && !isNaN(v2Val)) {
      const calculatedC2 = (c1Val * v1Val) / v2Val
      result = { c1: c1Val, v1: v1Val, c2: calculatedC2, v2: v2Val, dilutionFactor: c1Val / calculatedC2 }
    } else if (!isNaN(c1Val) && (isNaN(v1Val) || v1 === '') && !isNaN(c2Val) && !isNaN(v2Val)) {
      const calculatedV1 = (c2Val * v2Val) / c1Val
      result = { c1: c1Val, v1: calculatedV1, c2: c2Val, v2: v2Val, dilutionFactor: c1Val / c2Val }
    } else if ((isNaN(c1Val) || c1 === '') && !isNaN(v1Val) && !isNaN(c2Val) && !isNaN(v2Val)) {
      const calculatedC1 = (c2Val * v2Val) / v1Val
      result = { c1: calculatedC1, v1: v1Val, c2: c2Val, v2: v2Val, dilutionFactor: calculatedC1 / c2Val }
    }

    setDilutionResult(result)
  }

  // 监听稀释字段变化，自动计算
  useEffect(() => {
    const fieldStates = getDilutionFieldStates()
    if (fieldStates.canCalculate) {
      autoCalculateDilution()
    } else {
      setDilutionResult(null)
    }
  }, [c1, v1, c2, v2])

  const clearAll = () => {
    setSequences("")
    setMwResults([])
    setMass("")
    setVolume("")
    setMolecularWeight("")
    setConcentrationResult(null)
    setC1("")
    setV1("")
    setC2("")
    setV2("")
    setDilutionResult(null)
  }

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K'
    if (num < 0.01 && num > 0) return num.toExponential(2)
    return num.toFixed(decimals)
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.molecular-weight-calculator.name", "Molecular Weight Calculator")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.molecular-weight-calculator.description", "Calculate molecular weights for DNA/RNA/proteins, concentration conversion, dilution calculator")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 分子量计算器 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Dna className="w-4 h-4 mr-2" />
              {t("tools.molecular-weight-calculator.molecularWeight", "Molecular Weight Calculator")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sequences" className="font-mono">
                  {t("tools.molecular-weight-calculator.sequenceLabel", "Input Sequences")}
                </Label>
                <div className="flex items-center gap-2">
                  <Label className="font-mono text-xs">{t("tools.molecular-weight-calculator.sequenceType", "Type")}:</Label>
                  <Select value={sequenceType} onValueChange={(value) => setSequenceType(value as any)}>
                    <SelectTrigger className="font-mono w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dna" className="font-mono">DNA</SelectItem>
                      <SelectItem value="rna" className="font-mono">RNA</SelectItem>
                      <SelectItem value="protein" className="font-mono">{t("tools.molecular-weight-calculator.protein", "Protein")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Textarea
                id="sequences"
                placeholder={t("tools.molecular-weight-calculator.sequencePlaceholder", "Enter sequences in FASTA format or plain text\nExample:\n>Sequence 1\nATCGATCGATCG\n>Sequence 2\nGCTAGCTAGCTA")}
                value={sequences}
                onChange={(e) => setSequences(e.target.value)}
                className="terminal-input min-h-[120px] font-mono"
                rows={6}
              />

              <div className="flex gap-2">
                <Button onClick={calculateMW} className="flex-1 font-mono" disabled={!sequences.trim()}>
                  {t("tools.molecular-weight-calculator.calculate", "Calculate MW")}
                </Button>
                <Button onClick={clearAll} variant="outline" className="font-mono">
                  {t("common.clear")}
                </Button>
              </div>
            </div>

            {mwResults.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-mono text-muted-foreground">
                  {t("tools.molecular-weight-calculator.results", "Results")} ({mwResults.length} sequences)
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono font-bold">Name</TableHead>
                        <TableHead className="font-mono font-bold text-center w-20">Length</TableHead>
                        <TableHead className="font-mono font-bold text-center w-32">MW (g/mol)</TableHead>
                        <TableHead className="font-mono font-bold text-center w-20">Type</TableHead>
                        <TableHead className="font-mono font-bold">Composition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mwResults.map((result, index) => (
                        <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono">
                            <div className="font-medium">{result.name}</div>
                            <div className="text-xs text-muted-foreground break-all">
                              {result.sequence.length > 30 
                                ? `${result.sequence.substring(0, 30)}...` 
                                : result.sequence}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{result.length}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {formatNumber(result.molecularWeight)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`font-mono ${
                              result.type === 'dna' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              result.type === 'rna' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}>
                              {result.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {Object.entries(result.composition)
                              .filter(([, count]) => count > 0)
                              .map(([base, count]) => `${base}:${count}`)
                              .join(', ')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 浓度转换器 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              {t("tools.molecular-weight-calculator.concentrationCalc", "Concentration Calculator")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-2xl mx-auto">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="font-mono text-xs">{t("tools.molecular-weight-calculator.mass", "Mass")}</Label>
                    <Input placeholder="100" value={mass} onChange={(e) => setMass(e.target.value)} className="font-mono" />
                  </div>
                  <div>
                    <Label className="font-mono text-xs">{t("tools.molecular-weight-calculator.unit", "Unit")}</Label>
                    <Select value={massUnit} onValueChange={setMassUnit}>
                      <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g" className="font-mono">g</SelectItem>
                        <SelectItem value="mg" className="font-mono">mg</SelectItem>
                        <SelectItem value="μg" className="font-mono">μg</SelectItem>
                        <SelectItem value="ng" className="font-mono">ng</SelectItem>
                        <SelectItem value="pg" className="font-mono">pg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="font-mono text-xs">{t("tools.molecular-weight-calculator.volume", "Volume")}</Label>
                    <Input placeholder="10" value={volume} onChange={(e) => setVolume(e.target.value)} className="font-mono" />
                  </div>
                  <div>
                    <Label className="font-mono text-xs">{t("tools.molecular-weight-calculator.unit", "Unit")}</Label>
                    <Select value={volumeUnit} onValueChange={setVolumeUnit}>
                      <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L" className="font-mono">L</SelectItem>
                        <SelectItem value="mL" className="font-mono">mL</SelectItem>
                        <SelectItem value="μL" className="font-mono">μL</SelectItem>
                        <SelectItem value="nL" className="font-mono">nL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="font-mono text-xs">{t("tools.molecular-weight-calculator.molecularWeightLabel", "MW (g/mol)")}</Label>
                  <Input placeholder="10000" value={molecularWeight} onChange={(e) => setMolecularWeight(e.target.value)} className="font-mono" />
                </div>

                <Button onClick={calculateConcentration} className="w-full font-mono">
                  {t("tools.molecular-weight-calculator.calculate", "Calculate")}
                </Button>

                {concentrationResult && (
                  <div className="space-y-3 mt-6">
                    <div className="text-sm font-mono font-medium text-center">{t("tools.molecular-weight-calculator.results", "Results")}</div>
                    <div className="space-y-2 text-sm font-mono bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span>{t("tools.molecular-weight-calculator.concentrationResult", "Concentration")}:</span>
                        <span>{formatNumber(concentrationResult.concentration)} mg/mL</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("tools.molecular-weight-calculator.molarity", "Molarity")}:</span>
                        <span>{formatNumber(concentrationResult.molarity)} M</span>
                      </div>
                      {concentrationResult.copies && (
                        <div className="flex justify-between">
                          <span>{t("tools.molecular-weight-calculator.copies", "Copies")}:</span>
                          <span>{formatNumber(concentrationResult.copies, 2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 稀释计算器 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Beaker className="w-4 h-4 mr-2" />
              {t("tools.molecular-weight-calculator.dilutionCalc", "Dilution Calculator")}
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              {t("tools.molecular-weight-calculator.dilutionHint", "C₁V₁ = C₂V₂ - Leave one field empty to calculate it")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-2xl mx-auto">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-mono text-xs">C₁ ({t("tools.molecular-weight-calculator.initialConc", "Initial Conc.")})</Label>
                    <Input 
                      placeholder="100" 
                      value={c1} 
                      onChange={(e) => setC1(e.target.value)} 
                      className="font-mono"
                      disabled={getDilutionFieldStates().shouldDisable && c1.trim() === ''}
                    />
                  </div>
                  <div>
                    <Label className="font-mono text-xs">V₁ ({t("tools.molecular-weight-calculator.initialVol", "Initial Vol.")})</Label>
                    <Input 
                      placeholder="10" 
                      value={v1} 
                      onChange={(e) => setV1(e.target.value)} 
                      className="font-mono"
                      disabled={getDilutionFieldStates().shouldDisable && v1.trim() === ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-mono text-xs">C₂ ({t("tools.molecular-weight-calculator.finalConc", "Final Conc.")})</Label>
                    <Input 
                      placeholder="10" 
                      value={c2} 
                      onChange={(e) => setC2(e.target.value)} 
                      className="font-mono"
                      disabled={getDilutionFieldStates().shouldDisable && c2.trim() === ''}
                    />
                  </div>
                  <div>
                    <Label className="font-mono text-xs">V₂ ({t("tools.molecular-weight-calculator.finalVol", "Final Vol.")})</Label>
                    <Input 
                      placeholder="100" 
                      value={v2} 
                      onChange={(e) => setV2(e.target.value)} 
                      className="font-mono"
                      disabled={getDilutionFieldStates().shouldDisable && v2.trim() === ''}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground font-mono text-center">
                  {getDilutionFieldStates().filledCount}/4 {t("tools.molecular-weight-calculator.fieldsCompleted", "fields completed")} - 
                  {getDilutionFieldStates().canCalculate ? 
                    ` ${t("tools.molecular-weight-calculator.autoCalculating", "Auto calculating...")}` : 
                    ` ${t("tools.molecular-weight-calculator.fillThreeFields", "Fill any 3 fields to calculate the 4th")}`
                  }
                </div>

                {dilutionResult && (
                  <div className="space-y-3 mt-6">
                    <div className="text-sm font-mono font-medium text-center">{t("tools.molecular-weight-calculator.results", "Results")}</div>
                    <div className="space-y-2 text-sm font-mono bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between"><span>C₁:</span><span>{formatNumber(dilutionResult.c1)}</span></div>
                      <div className="flex justify-between"><span>V₁:</span><span>{formatNumber(dilutionResult.v1)}</span></div>
                      <div className="flex justify-between"><span>C₂:</span><span>{formatNumber(dilutionResult.c2)}</span></div>
                      <div className="flex justify-between"><span>V₂:</span><span>{formatNumber(dilutionResult.v2)}</span></div>
                      <div className="flex justify-between border-t pt-2">
                        <span>{t("tools.molecular-weight-calculator.dilutionFactor", "Dilution Factor")}:</span>
                        <span>{formatNumber(dilutionResult.dilutionFactor)}×</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Calculator className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t("tools.molecular-weight-calculator.tip", "Molecular weights include phosphate groups for DNA/RNA. Protein calculations account for peptide bond formation.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
