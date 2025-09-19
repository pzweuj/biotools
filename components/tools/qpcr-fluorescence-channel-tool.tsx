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
import { Checkbox } from "@/components/ui/checkbox"
import { Lightbulb, Search, Zap, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type Fluorophore = {
  name: string
  excitation: number
  emission: number
  brightness: 'high' | 'medium' | 'low'
  stability: 'excellent' | 'good' | 'fair'
  cost: 'low' | 'medium' | 'high'
  applications: string[]
  color: string // 发射颜色的CSS颜色值
  notes?: string
}

type QpcrInstrument = {
  name: string
  channels: {
    name: string
    excitation: number
    emission: number
    filter: string
  }[]
}

type SelectedChannel = {
  id: string
  target: string
  fluorophore: string
  channel: string
}

// 荧光基团数据库
const FLUOROPHORES: Fluorophore[] = [
  { name: "FAM", excitation: 494, emission: 518, brightness: "high", stability: "good", cost: "low", applications: ["qPCR", "Sequencing", "Genotyping"], color: "#00FF00" },
  { name: "SYBR Green I", excitation: 494, emission: 521, brightness: "high", stability: "good", cost: "low", applications: ["qPCR", "DNA quantification"], color: "#00FF00" },
  { name: "VIC", excitation: 538, emission: 554, brightness: "high", stability: "excellent", cost: "medium", applications: ["qPCR", "Genotyping"], color: "#ADFF2F" },
  { name: "HEX", excitation: 535, emission: 556, brightness: "medium", stability: "good", cost: "low", applications: ["qPCR", "Multiplex PCR"], color: "#ADFF2F" },
  { name: "TET", excitation: 521, emission: 536, brightness: "medium", stability: "fair", cost: "medium", applications: ["qPCR", "Sequencing"], color: "#00FF00" },
  { name: "ROX", excitation: 580, emission: 623, brightness: "high", stability: "excellent", cost: "medium", applications: ["qPCR", "Reference dye"], color: "#FF4500" },
  { name: "Texas Red", excitation: 596, emission: 615, brightness: "high", stability: "good", cost: "high", applications: ["qPCR", "Imaging"], color: "#FF0000" },
  { name: "Cy3", excitation: 550, emission: 570, brightness: "high", stability: "good", cost: "medium", applications: ["qPCR", "Microarray"], color: "#FFA500" },
  { name: "Cy5", excitation: 649, emission: 670, brightness: "high", stability: "excellent", cost: "medium", applications: ["qPCR", "Multiplex"], color: "#FF1493" },
  { name: "TAMRA", excitation: 565, emission: 580, brightness: "medium", stability: "good", cost: "medium", applications: ["qPCR", "Sequencing"], color: "#FFA500" },
  { name: "JOE", excitation: 520, emission: 548, brightness: "medium", stability: "good", cost: "medium", applications: ["qPCR", "Genotyping"], color: "#ADFF2F" },
  { name: "NED", excitation: 546, emission: 575, brightness: "medium", stability: "good", cost: "medium", applications: ["qPCR", "Multiplex PCR"], color: "#FFFF00" },
  { name: "Alexa Fluor 488", excitation: 495, emission: 519, brightness: "high", stability: "excellent", cost: "high", applications: ["qPCR", "Flow cytometry"], color: "#00FF00" },
  { name: "Alexa Fluor 546", excitation: 556, emission: 573, brightness: "high", stability: "excellent", cost: "high", applications: ["qPCR", "Imaging"], color: "#FFA500" },
  { name: "Alexa Fluor 647", excitation: 650, emission: 668, brightness: "high", stability: "excellent", cost: "high", applications: ["qPCR", "Flow cytometry"], color: "#FF1493" }
]

// qPCR仪器数据库
const INSTRUMENTS: QpcrInstrument[] = [
  {
    name: "Applied Biosystems 7500",
    channels: [
      { name: "Channel 1", excitation: 485, emission: 518, filter: "FAM/SYBR" },
      { name: "Channel 2", excitation: 538, emission: 554, filter: "VIC/JOE" },
      { name: "Channel 3", excitation: 580, emission: 623, filter: "ROX/Texas Red" },
      { name: "Channel 4", excitation: 649, emission: 665, filter: "Cy5" }
    ]
  },
  {
    name: "Bio-Rad CFX96",
    channels: [
      { name: "FAM", excitation: 485, emission: 518, filter: "FAM/SYBR" },
      { name: "HEX", excitation: 535, emission: 556, filter: "HEX/VIC" },
      { name: "Texas Red", excitation: 596, emission: 615, filter: "Texas Red/ROX" },
      { name: "Cy5", excitation: 649, emission: 670, filter: "Cy5" }
    ]
  },
  {
    name: "Roche LightCycler 480",
    channels: [
      { name: "Channel 1", excitation: 465, emission: 510, filter: "FAM/SYBR" },
      { name: "Channel 2", excitation: 533, emission: 580, filter: "VIC/HEX" },
      { name: "Channel 3", excitation: 618, emission: 660, filter: "ROX/Texas Red" },
      { name: "Channel 4", excitation: 705, emission: 770, filter: "Cy5.5" }
    ]
  },
  {
    name: "Thermo Fisher QuantStudio",
    channels: [
      { name: "Blue", excitation: 485, emission: 518, filter: "FAM/SYBR" },
      { name: "Green", excitation: 535, emission: 556, filter: "VIC/HEX" },
      { name: "Yellow", excitation: 580, emission: 623, filter: "ROX/NED" },
      { name: "Red", excitation: 649, emission: 670, filter: "Cy5/ABY" }
    ]
  }
]

export function QpcrFluorescenceChannelTool() {
  const { t } = useI18n()
  const [selectedInstrument, setSelectedInstrument] = useState("Applied Biosystems 7500")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBrightness, setFilterBrightness] = useState<string>("all")
  const [filterCost, setFilterCost] = useState<string>("all")
  const [selectedChannels, setSelectedChannels] = useState<SelectedChannel[]>([])
  const [multiplexTargets, setMultiplexTargets] = useState<string[]>(["Target1"])

  // 过滤荧光基团
  const filteredFluorophores = useMemo(() => {
    return FLUOROPHORES.filter(fluor => {
      const matchesSearch = fluor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fluor.applications.some(app => app.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesBrightness = filterBrightness === "all" || fluor.brightness === filterBrightness
      const matchesCost = filterCost === "all" || fluor.cost === filterCost
      return matchesSearch && matchesBrightness && matchesCost
    })
  }, [searchTerm, filterBrightness, filterCost])

  // 获取当前仪器信息
  const currentInstrument = INSTRUMENTS.find(inst => inst.name === selectedInstrument)

  // 检查荧光基团与通道的兼容性
  const checkCompatibility = (fluorophore: Fluorophore, channel: any) => {
    const excitationDiff = Math.abs(fluorophore.excitation - channel.excitation)
    const emissionDiff = Math.abs(fluorophore.emission - channel.emission)
    
    if (excitationDiff <= 15 && emissionDiff <= 15) return "excellent"
    if (excitationDiff <= 25 && emissionDiff <= 25) return "good"
    if (excitationDiff <= 40 && emissionDiff <= 40) return "fair"
    return "poor"
  }

  // 获取推荐的荧光基团
  const getRecommendedFluorophores = (channel: any) => {
    return FLUOROPHORES
      .map(fluor => ({
        ...fluor,
        compatibility: checkCompatibility(fluor, channel)
      }))
      .filter(fluor => fluor.compatibility !== "poor")
      .sort((a, b) => {
        const compatibilityOrder = { excellent: 0, good: 1, fair: 2 }
        return compatibilityOrder[a.compatibility as keyof typeof compatibilityOrder] - 
               compatibilityOrder[b.compatibility as keyof typeof compatibilityOrder]
      })
  }

  // 添加多重PCR目标
  const addMultiplexTarget = () => {
    setMultiplexTargets([...multiplexTargets, `Target${multiplexTargets.length + 1}`])
  }

  // 移除多重PCR目标
  const removeMultiplexTarget = (index: number) => {
    if (multiplexTargets.length > 1) {
      setMultiplexTargets(multiplexTargets.filter((_, i) => i !== index))
    }
  }

  // 自动分配通道
  const autoAssignChannels = () => {
    if (!currentInstrument) return

    const assignments: SelectedChannel[] = []
    const availableChannels = [...currentInstrument.channels]

    multiplexTargets.forEach((target, index) => {
      if (availableChannels.length > 0) {
        const channel = availableChannels.shift()!
        const recommendedFluors = getRecommendedFluorophores(channel)
        const bestFluor = recommendedFluors[0]

        if (bestFluor) {
          assignments.push({
            id: `${index}`,
            target,
            fluorophore: bestFluor.name,
            channel: channel.name
          })
        }
      }
    })

    setSelectedChannels(assignments)
  }

  // 检查通道冲突
  const checkChannelConflicts = () => {
    const conflicts: string[] = []
    const usedChannels = new Set<string>()

    selectedChannels.forEach(selection => {
      if (usedChannels.has(selection.channel)) {
        conflicts.push(`${t("tools.qpcr-fluorescence.channelConflict", "Channel conflict")}: ${selection.channel}`)
      }
      usedChannels.add(selection.channel)
    })

    return conflicts
  }

  const conflicts = checkChannelConflicts()

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.qpcr-fluorescence.name", "qPCR Fluorescence Channel Tool")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.qpcr-fluorescence.description", "Fluorophore database, channel design, and multiplex PCR optimization")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database" className="font-mono text-xs">
              <Search className="w-4 h-4 mr-1" />
              {t("tools.qpcr-fluorescence.database", "Fluorophore DB")}
            </TabsTrigger>
            <TabsTrigger value="channels" className="font-mono text-xs">
              <Zap className="w-4 h-4 mr-1" />
              {t("tools.qpcr-fluorescence.channels", "Channel Design")}
            </TabsTrigger>
            <TabsTrigger value="multiplex" className="font-mono text-xs">
              <Lightbulb className="w-4 h-4 mr-1" />
              {t("tools.qpcr-fluorescence.multiplex", "Multiplex PCR")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            {/* 荧光基团数据库 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  {t("tools.qpcr-fluorescence.fluorophoreDatabase", "Fluorophore Database")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="font-mono">{t("tools.qpcr-fluorescence.search", "Search")}</Label>
                    <Input
                      placeholder={t("tools.qpcr-fluorescence.searchPlaceholder", "Name or application...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label className="font-mono">{t("tools.qpcr-fluorescence.brightness", "Brightness")}</Label>
                    <Select value={filterBrightness} onValueChange={setFilterBrightness}>
                      <SelectTrigger className="font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-mono">{t("tools.qpcr-fluorescence.all", "All")}</SelectItem>
                        <SelectItem value="high" className="font-mono">{t("tools.qpcr-fluorescence.high", "High")}</SelectItem>
                        <SelectItem value="medium" className="font-mono">{t("tools.qpcr-fluorescence.medium", "Medium")}</SelectItem>
                        <SelectItem value="low" className="font-mono">{t("tools.qpcr-fluorescence.low", "Low")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-mono">{t("tools.qpcr-fluorescence.cost", "Cost")}</Label>
                    <Select value={filterCost} onValueChange={setFilterCost}>
                      <SelectTrigger className="font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-mono">{t("tools.qpcr-fluorescence.all", "All")}</SelectItem>
                        <SelectItem value="low" className="font-mono">{t("tools.qpcr-fluorescence.low", "Low")}</SelectItem>
                        <SelectItem value="medium" className="font-mono">{t("tools.qpcr-fluorescence.medium", "Medium")}</SelectItem>
                        <SelectItem value="high" className="font-mono">{t("tools.qpcr-fluorescence.high", "High")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono">{t("tools.qpcr-fluorescence.name", "Name")}</TableHead>
                        <TableHead className="font-mono">{t("tools.qpcr-fluorescence.excitation", "Ex (nm)")}</TableHead>
                        <TableHead className="font-mono">{t("tools.qpcr-fluorescence.emission", "Em (nm)")}</TableHead>
                        <TableHead className="font-mono">{t("tools.qpcr-fluorescence.brightness", "Brightness")}</TableHead>
                        <TableHead className="font-mono">{t("tools.qpcr-fluorescence.stability", "Stability")}</TableHead>
                        <TableHead className="font-mono">{t("tools.qpcr-fluorescence.cost", "Cost")}</TableHead>
                        <TableHead className="font-mono">{t("tools.qpcr-fluorescence.applications", "Applications")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFluorophores.map((fluor) => (
                        <TableRow key={fluor.name}>
                          <TableCell className="font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: fluor.color }}
                                title={`${t("tools.qpcr-fluorescence.emissionColor", "Emission color")}: ${fluor.emission}nm`}
                              />
                              {fluor.name}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{fluor.excitation}</TableCell>
                          <TableCell className="font-mono">{fluor.emission}</TableCell>
                          <TableCell>
                            <Badge variant={fluor.brightness === 'high' ? 'default' : fluor.brightness === 'medium' ? 'secondary' : 'outline'}>
                              {t(`tools.qpcr-fluorescence.${fluor.brightness}`, fluor.brightness)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={fluor.stability === 'excellent' ? 'default' : 'secondary'}>
                              {t(`tools.qpcr-fluorescence.${fluor.stability}`, fluor.stability)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={fluor.cost === 'low' ? 'default' : fluor.cost === 'medium' ? 'secondary' : 'destructive'}>
                              {t(`tools.qpcr-fluorescence.${fluor.cost}`, fluor.cost)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{fluor.applications.join(', ')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            {/* 通道设计 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {t("tools.qpcr-fluorescence.channelDesign", "Channel Design")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono">{t("tools.qpcr-fluorescence.instrument", "qPCR Instrument")}</Label>
                  <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                    <SelectTrigger className="font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTRUMENTS.map(inst => (
                        <SelectItem key={inst.name} value={inst.name} className="font-mono">
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentInstrument && (
                  <div className="space-y-4">
                    <h4 className="font-mono font-medium">{t("tools.qpcr-fluorescence.availableChannels", "Available Channels")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentInstrument.channels.map((channel, index) => (
                        <Card key={index} className="border">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-mono">{channel.name}</CardTitle>
                            <CardDescription className="text-xs font-mono">
                              Ex: {channel.excitation}nm, Em: {channel.emission}nm
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-xs font-mono text-muted-foreground">
                                {t("tools.qpcr-fluorescence.recommendedFluorophores", "Recommended")}:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {getRecommendedFluorophores(channel).slice(0, 3).map(fluor => (
                                  <Badge key={fluor.name} variant="outline" className="text-xs flex items-center gap-1">
                                    <div 
                                      className="w-2 h-2 rounded-full border border-gray-400"
                                      style={{ backgroundColor: fluor.color }}
                                    />
                                    {fluor.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="multiplex" className="space-y-4">
            {/* 多重PCR设计 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {t("tools.qpcr-fluorescence.multiplexDesign", "Multiplex PCR Design")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-mono">{t("tools.qpcr-fluorescence.targets", "PCR Targets")}</Label>
                    <Button onClick={addMultiplexTarget} size="sm" className="font-mono">
                      <Plus className="w-4 h-4 mr-1" />
                      {t("tools.qpcr-fluorescence.addTarget", "Add Target")}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {multiplexTargets.map((target, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={target}
                          onChange={(e) => {
                            const newTargets = [...multiplexTargets]
                            newTargets[index] = e.target.value
                            setMultiplexTargets(newTargets)
                          }}
                          className="font-mono"
                          placeholder={`Target ${index + 1}`}
                        />
                        {multiplexTargets.length > 1 && (
                          <Button
                            onClick={() => removeMultiplexTarget(index)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button onClick={autoAssignChannels} className="w-full font-mono">
                    {t("tools.qpcr-fluorescence.autoAssign", "Auto Assign Channels")}
                  </Button>
                </div>

                {selectedChannels.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-mono font-medium">{t("tools.qpcr-fluorescence.channelAssignments", "Channel Assignments")}</h4>
                    
                    {conflicts.length > 0 && (
                      <Alert>
                        <AlertDescription className="font-mono text-sm text-red-600">
                          {conflicts.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-mono">{t("tools.qpcr-fluorescence.target", "Target")}</TableHead>
                            <TableHead className="font-mono">{t("tools.qpcr-fluorescence.fluorophore", "Fluorophore")}</TableHead>
                            <TableHead className="font-mono">{t("tools.qpcr-fluorescence.channel", "Channel")}</TableHead>
                            <TableHead className="font-mono">{t("tools.qpcr-fluorescence.compatibility", "Compatibility")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedChannels.map((selection) => {
                            const fluor = FLUOROPHORES.find(f => f.name === selection.fluorophore)
                            const channel = currentInstrument?.channels.find(c => c.name === selection.channel)
                            const compatibility = fluor && channel ? checkCompatibility(fluor, channel) : 'poor'
                            
                            return (
                              <TableRow key={selection.id}>
                                <TableCell className="font-mono font-bold">{selection.target}</TableCell>
                                <TableCell className="font-mono">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ backgroundColor: fluor?.color || '#gray' }}
                                    />
                                    {selection.fluorophore}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono">{selection.channel}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    compatibility === 'excellent' ? 'default' :
                                    compatibility === 'good' ? 'secondary' :
                                    compatibility === 'fair' ? 'outline' : 'destructive'
                                  }>
                                    {t(`tools.qpcr-fluorescence.${compatibility}`, compatibility)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t("tools.qpcr-fluorescence.note", "Choose fluorophores with minimal spectral overlap. Consider instrument-specific filter sets and cross-talk between channels.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default QpcrFluorescenceChannelTool
