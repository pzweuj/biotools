"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, Beaker, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface DilutionStep {
  stepNumber: number
  concentration: number
  dilutionFactor: number
  sampleVolume: number
  diluentVolume: number
  finalVolume: number
}

export function SerialDilutionCalculator() {
  const { t } = useI18n()
  
  const [startingConc, setStartingConc] = useState("1000")
  const [concUnit, setConcUnit] = useState("μg/mL")
  const [dilutionType, setDilutionType] = useState("fold") // fold or ratio
  const [dilutionFactor, setDilutionFactor] = useState("2") // For 1:2, 1:5, 1:10, etc
  const [numberOfSteps, setNumberOfSteps] = useState("6")
  const [finalVolume, setFinalVolume] = useState("100")
  const [volumeUnit, setVolumeUnit] = useState("μL")
  
  // 计算稀释步骤
  const dilutionSteps = useMemo((): DilutionStep[] => {
    const startConc = parseFloat(startingConc)
    const factor = parseFloat(dilutionFactor)
    const steps = parseInt(numberOfSteps)
    const volume = parseFloat(finalVolume)
    
    if (isNaN(startConc) || isNaN(factor) || isNaN(steps) || isNaN(volume)) {
      return []
    }
    
    if (factor <= 1 || steps <= 0 || volume <= 0) {
      return []
    }
    
    const results: DilutionStep[] = []
    
    for (let i = 0; i < steps; i++) {
      const currentConc = startConc / Math.pow(factor, i + 1)
      const sampleVol = volume / factor
      const diluentVol = volume - sampleVol
      
      results.push({
        stepNumber: i + 1,
        concentration: currentConc,
        dilutionFactor: factor,
        sampleVolume: sampleVol,
        diluentVolume: diluentVol,
        finalVolume: volume
      })
    }
    
    return results
  }, [startingConc, dilutionFactor, numberOfSteps, finalVolume])
  
  const clearAll = () => {
    setStartingConc("1000")
    setDilutionFactor("2")
    setNumberOfSteps("6")
    setFinalVolume("100")
  }
  
  // 预设稀释比例
  const commonDilutions = [
    { label: "1:2 (2-fold)", value: "2" },
    { label: "1:5 (5-fold)", value: "5" },
    { label: "1:10 (10-fold)", value: "10" },
    { label: "1:100 (100-fold)", value: "100" },
  ]

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground flex items-center gap-2">
          <Beaker className="w-5 h-5" />
          {t("tools.serial-dilution.name", "Serial Dilution Calculator")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.serial-dilution.description", "Calculate volumes for serial dilution series - commonly used in ELISA, cell culture, and dose-response experiments")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 参数输入 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              {t("tools.serial-dilution.parameters", "Dilution Parameters")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 起始浓度 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starting-conc" className="font-mono">
                  {t("tools.serial-dilution.startingConc", "Starting Concentration")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="starting-conc"
                    type="number"
                    value={startingConc}
                    onChange={(e) => setStartingConc(e.target.value)}
                    className="terminal-input flex-1"
                    placeholder="1000"
                  />
                  <Select value={concUnit} onValueChange={setConcUnit}>
                    <SelectTrigger className="font-mono w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M" className="font-mono">M</SelectItem>
                      <SelectItem value="mM" className="font-mono">mM</SelectItem>
                      <SelectItem value="μM" className="font-mono">μM</SelectItem>
                      <SelectItem value="nM" className="font-mono">nM</SelectItem>
                      <SelectItem value="g/L" className="font-mono">g/L</SelectItem>
                      <SelectItem value="mg/mL" className="font-mono">mg/mL</SelectItem>
                      <SelectItem value="μg/mL" className="font-mono">μg/mL</SelectItem>
                      <SelectItem value="ng/mL" className="font-mono">ng/mL</SelectItem>
                      <SelectItem value="%" className="font-mono">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 稀释倍数 */}
              <div className="space-y-2">
                <Label htmlFor="dilution-factor" className="font-mono">
                  {t("tools.serial-dilution.dilutionFactor", "Dilution Factor (fold)")}
                </Label>
                <Input
                  id="dilution-factor"
                  type="number"
                  value={dilutionFactor}
                  onChange={(e) => setDilutionFactor(e.target.value)}
                  className="terminal-input"
                  placeholder="2"
                  min="1.1"
                  step="0.1"
                />
                <div className="flex gap-1 mt-2 flex-wrap">
                  {commonDilutions.map((preset) => (
                    <Button
                      key={preset.value}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs h-7"
                      onClick={() => setDilutionFactor(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* 步数和终体积 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num-steps" className="font-mono">
                  {t("tools.serial-dilution.numberOfSteps", "Number of Steps")}
                </Label>
                <Input
                  id="num-steps"
                  type="number"
                  value={numberOfSteps}
                  onChange={(e) => setNumberOfSteps(e.target.value)}
                  className="terminal-input"
                  placeholder="6"
                  min="1"
                  max="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="final-volume" className="font-mono">
                  {t("tools.serial-dilution.finalVolume", "Final Volume per Step")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="final-volume"
                    type="number"
                    value={finalVolume}
                    onChange={(e) => setFinalVolume(e.target.value)}
                    className="terminal-input flex-1"
                    placeholder="100"
                  />
                  <Select value={volumeUnit} onValueChange={setVolumeUnit}>
                    <SelectTrigger className="font-mono w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L" className="font-mono">L</SelectItem>
                      <SelectItem value="mL" className="font-mono">mL</SelectItem>
                      <SelectItem value="μL" className="font-mono">μL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button onClick={clearAll} variant="outline" className="font-mono w-full">
              {t("common.clear", "Clear")}
            </Button>
          </CardContent>
        </Card>

        {/* 结果展示 */}
        {dilutionSteps.length > 0 && (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                {t("tools.serial-dilution.protocol", "Protocol")}: 
                {t("tools.serial-dilution.protocolDesc", " For each step, transfer the specified sample volume to a new tube and add diluent to reach the final volume. Mix thoroughly before the next transfer.")}
              </AlertDescription>
            </Alert>

            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono">
                  {t("tools.serial-dilution.results", "Dilution Series Results")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.serial-dilution.step", "Step")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.serial-dilution.concentration", "Concentration")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.serial-dilution.sampleVolume", "Sample Volume")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.serial-dilution.diluentVolume", "Diluent Volume")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.serial-dilution.finalVolumeHeader", "Final Volume")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.serial-dilution.dilutionRatio", "Dilution")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/30">
                        <TableCell className="text-center font-mono font-bold">
                          Stock
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {parseFloat(startingConc).toExponential(2)} {concUnit}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground" colSpan={4}>
                          {t("tools.serial-dilution.source", "Starting material")}
                        </TableCell>
                      </TableRow>
                      {dilutionSteps.map((step) => (
                        <TableRow key={step.stepNumber}>
                          <TableCell className="text-center font-mono font-bold">
                            {step.stepNumber}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {step.concentration < 0.01 
                              ? step.concentration.toExponential(2) 
                              : step.concentration.toFixed(2)} {concUnit}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            <Badge variant="outline" className="font-mono">
                              {step.sampleVolume.toFixed(2)} {volumeUnit}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            <Badge variant="secondary" className="font-mono">
                              {step.diluentVolume.toFixed(2)} {volumeUnit}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {step.finalVolume.toFixed(2)} {volumeUnit}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="font-mono">
                              1:{step.dilutionFactor}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 汇总信息 */}
                <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span>{t("tools.serial-dilution.totalSteps", "Total Steps")}:</span>
                    <span className="font-bold">{dilutionSteps.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("tools.serial-dilution.concentrationRange", "Concentration Range")}:</span>
                    <span className="font-bold">
                      {parseFloat(startingConc).toFixed(2)} {concUnit} → {" "}
                      {dilutionSteps[dilutionSteps.length - 1].concentration < 0.01
                        ? dilutionSteps[dilutionSteps.length - 1].concentration.toExponential(2)
                        : dilutionSteps[dilutionSteps.length - 1].concentration.toFixed(2)} {concUnit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("tools.serial-dilution.overallDilution", "Overall Dilution")}:</span>
                    <span className="font-bold">
                      1:{Math.pow(parseFloat(dilutionFactor), dilutionSteps.length).toFixed(0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SerialDilutionCalculator
