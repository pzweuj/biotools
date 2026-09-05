"use client"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"

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

interface Component {
  name: string
  stockConc: number
  finalConc: number
  unit: string
}

const PRESET_CONFIGS: Record<string, Component[]> = {
  standard: [
    { name: "10× PCR Buffer", stockConc: 10, finalConc: 1, unit: "×" },
    { name: "dNTPs (10mM each)", stockConc: 10, finalConc: 0.2, unit: "mM" },
    { name: "Forward Primer (10μM)", stockConc: 10, finalConc: 0.5, unit: "μM" },
    { name: "Reverse Primer (10μM)", stockConc: 10, finalConc: 0.5, unit: "μM" },
    { name: "Taq Polymerase (5U/μL)", stockConc: 5, finalConc: 0.025, unit: "U/μL" },
  ],
  qpcr: [
    { name: "2× qPCR Master Mix", stockConc: 2, finalConc: 1, unit: "×" },
    { name: "Forward Primer (10μM)", stockConc: 10, finalConc: 0.3, unit: "μM" },
    { name: "Reverse Primer (10μM)", stockConc: 10, finalConc: 0.3, unit: "μM" },
    { name: "Probe (10μM)", stockConc: 10, finalConc: 0.2, unit: "μM" },
  ],
}

export function PcrMasterMixCalculator() {
  const { t } = useI18n()
  
  const [preset, setPreset] = useState("standard")
  const [numReactions, setNumReactions] = useState("8")
  const [reactionVolume, setReactionVolume] = useState("25")
  const [extraPercent, setExtraPercent] = useState("10")
  const [templateVolume, setTemplateVolume] = useState("1")
  
  // 计算结果
  const results = useMemo(() => {
    const reactions = parseFloat(numReactions) || 0
    const volume = parseFloat(reactionVolume) || 0
    const extra = parseFloat(extraPercent) || 0
    const template = parseFloat(templateVolume) || 0
    
    if (reactions <= 0 || volume <= 0) return null
    
    const totalReactions = Math.ceil(reactions * (1 + extra / 100))
    const config = PRESET_CONFIGS[preset]
    
    // 计算每个组分的体积
    const components = config.map(comp => {
      // 使用 C1V1 = C2V2 公式
      const volumePerRxn = (comp.finalConc * volume) / comp.stockConc
      const totalVolume = volumePerRxn * totalReactions
      
      return {
        ...comp,
        volumePerRxn,
        totalVolume
      }
    })
    
    // 计算水的体积
    const usedVolume = components.reduce((sum, c) => sum + c.volumePerRxn, 0) + template
    const waterPerRxn = volume - usedVolume
    const totalWater = waterPerRxn * totalReactions
    
    return {
      components,
      waterPerRxn,
      totalWater,
      totalReactions,
      extraReactions: totalReactions - reactions,
      templateVolume: template
    }
  }, [preset, numReactions, reactionVolume, extraPercent, templateVolume])
  
  const clearAll = () => {
    setNumReactions("8")
    setReactionVolume("25")
    setExtraPercent("10")
    setTemplateVolume("1")
  }

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>
          <Beaker className="w-5 h-5" />
          {t("tools.pcr-master-mix.name", "PCR Master Mix Calculator")}
        </ToolPageTitle>
        <ToolPageDescription>
          {t("tools.pcr-master-mix.description", "Calculate volumes for PCR master mix preparation - supports standard PCR, qPCR, and custom protocols")}
        </ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        {/* 使用说明 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="font-bold mb-2">{t("tools.pcr-master-mix.howToUse", "How to use")}:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t("tools.pcr-master-mix.step1", "Select a preset protocol or customize components")}</li>
              <li>{t("tools.pcr-master-mix.step2", "Enter number of reactions and reaction volume")}</li>
              <li>{t("tools.pcr-master-mix.step3", "The calculator will show volumes for each component")}</li>
              <li>{t("tools.pcr-master-mix.step4", "Mix all master mix components (except template), then aliquot and add template individually")}</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* 参数设置 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              {t("tools.pcr-master-mix.basicSettings", "Basic Settings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="">{t("tools.pcr-master-mix.preset", "Preset Protocol")}</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="">
                    {t("tools.pcr-master-mix.standardPCR", "Standard PCR")} (25μL)
                  </SelectItem>
                  <SelectItem value="qpcr" className="">
                    {t("tools.pcr-master-mix.qPCR", "qPCR/Real-Time PCR")} (20μL)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num-reactions" className="">
                  {t("tools.pcr-master-mix.numberOfReactions", "Number of Reactions")}
                </Label>
                <Input
                  id="num-reactions"
                  type="number"
                  value={numReactions}
                  onChange={(e) => setNumReactions(e.target.value)}
                  className="terminal-input"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reaction-volume" className="">
                  {t("tools.pcr-master-mix.reactionVolume", "Reaction Volume (μL)")}
                </Label>
                <Input
                  id="reaction-volume"
                  type="number"
                  value={reactionVolume}
                  onChange={(e) => setReactionVolume(e.target.value)}
                  className="terminal-input"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="extra-percent" className="">
                  {t("tools.pcr-master-mix.extraVolume", "Extra Volume (%)")}
                </Label>
                <Input
                  id="extra-percent"
                  type="number"
                  value={extraPercent}
                  onChange={(e) => setExtraPercent(e.target.value)}
                  className="terminal-input"
                  min="0"
                  max="50"
                />
                <div className="text-xs text-muted-foreground font-mono">
                  {t("tools.pcr-master-mix.extraVolumeHint", "Recommended 10-20% to compensate for pipetting errors")}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-volume" className="">
                  {t("tools.pcr-master-mix.templateVolume", "Template Volume per Rxn (μL)")}
                </Label>
                <Input
                  id="template-volume"
                  type="number"
                  value={templateVolume}
                  onChange={(e) => setTemplateVolume(e.target.value)}
                  className="terminal-input"
                  min="0"
                  step="0.1"
                />
                <div className="text-xs text-muted-foreground font-mono">
                  {t("tools.pcr-master-mix.templateHint", "Template is added individually, not in master mix")}
                </div>
              </div>
            </div>

            <Button onClick={clearAll} variant="outline" className="w-full">
              {t("common.clear", "Clear")}
            </Button>
          </CardContent>
        </Card>

        {/* 结果展示 */}
        {results && (
          <Card className="border-2 border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm ">
                {t("tools.pcr-master-mix.masterMixRecipe", "Master Mix Recipe")}
              </CardTitle>
              <div className="text-xs text-muted-foreground font-mono mt-1">
                {t("tools.pcr-master-mix.preparing", "Preparing for")}: {results.totalReactions} {t("tools.pcr-master-mix.reactions", "reactions")} 
                ({numReactions} + {results.extraReactions} {t("tools.pcr-master-mix.extra", "extra")})
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Master Mix组分表 */}
              <div>
                <div className="font-mono font-bold text-sm mb-2">
                  📋 {t("tools.pcr-master-mix.masterMixComponents", "Master Mix Components")} ({t("tools.pcr-master-mix.mixFirst", "mix these first")})
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono font-bold">
                          {t("tools.pcr-master-mix.component", "Component")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.pcr-master-mix.stockConc", "Stock")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.pcr-master-mix.finalConc", "Final")}
                        </TableHead>
                        <TableHead className="font-mono font-bold text-center">
                          {t("tools.pcr-master-mix.volumeToAdd", "Volume to Add")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.components.map((comp, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{comp.name}</TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {comp.stockConc} {comp.unit}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {comp.finalConc} {comp.unit}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default" className="font-mono font-bold text-base">
                              {comp.totalVolume.toFixed(2)} μL
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-blue-50 dark:bg-blue-950">
                        <TableCell className="font-mono font-bold">ddH₂O</TableCell>
                        <TableCell className="text-center text-muted-foreground">-</TableCell>
                        <TableCell className="text-center text-muted-foreground">-</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default" className="font-mono font-bold text-base">
                            {results.totalWater.toFixed(2)} μL
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-primary/20">
                        <TableCell className="font-mono font-bold" colSpan={3}>
                          {t("tools.pcr-master-mix.masterMixTotal", "Master Mix Total")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="font-mono font-bold text-base">
                            {(results.components.reduce((sum, c) => sum + c.totalVolume, 0) + results.totalWater).toFixed(2)} μL
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 操作步骤 */}
              <Alert>
                <Beaker className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="font-bold mb-2">🧪 {t("tools.pcr-master-mix.procedure", "Procedure")}:</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>{t("tools.pcr-master-mix.procedureStep1", "Add all components from the table above to create master mix")}</li>
                    <li>{t("tools.pcr-master-mix.procedureStep2", "Mix well by gentle vortexing or pipetting")}</li>
                    <li>
                      {t("tools.pcr-master-mix.procedureStep3", "Aliquot")} <Badge variant="secondary" className="font-mono mx-1">
                        {(parseFloat(reactionVolume) - parseFloat(templateVolume)).toFixed(1)} μL
                      </Badge> {t("tools.pcr-master-mix.procedureStep3b", "master mix into each tube")}
                    </li>
                    <li>
                      {t("tools.pcr-master-mix.procedureStep4", "Add")} <Badge variant="secondary" className="font-mono mx-1">
                        {templateVolume} μL
                      </Badge> {t("tools.pcr-master-mix.procedureStep4b", "template DNA to each tube individually")}
                    </li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* 快速参考 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    {t("tools.pcr-master-mix.perTube", "Per Tube")}
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {reactionVolume} μL
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    ({(parseFloat(reactionVolume) - parseFloat(templateVolume)).toFixed(1)} μL mix + {templateVolume} μL template)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    {t("tools.pcr-master-mix.totalReactions", "Total Reactions")}
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {results.totalReactions}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    ({numReactions} + {results.extraReactions} extra)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    {t("tools.pcr-master-mix.masterMixTotal", "Master Mix Total")}
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {(results.components.reduce((sum, c) => sum + c.totalVolume, 0) + results.totalWater).toFixed(1)} μL
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </ToolPageContent>
    </ToolPage>
  )
}

export default PcrMasterMixCalculator
