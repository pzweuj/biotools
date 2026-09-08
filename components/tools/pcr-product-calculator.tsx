"use client"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Copy, Check, AlertTriangle, CheckCircle, XCircle, Target, Dna, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import {
  calculatePcrProducts,
  normalizeSequence,
  parseFasta as parseSharedFasta,
  copyText,
  type PcrTemplate as Template,
  type PcrPrimerPair as PrimerPair,
  type PcrResult as PCRResult,
} from "@/lib/bio"

export function PCRProductCalculator() {
  const { t } = useI18n()
  const [templates, setTemplates] = useState("")
  const [primerPairs, setPrimerPairs] = useState<PrimerPair[]>([
    {
      id: '1',
      forwardName: 'F1',
      forwardSequence: '',
      reverseName: 'R1',
      reverseSequence: ''
    }
  ])
  const [results, setResults] = useState<PCRResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  // 解析FASTA格式
  const parseFasta = (text: string): Template[] => {
    return parseSharedFasta(text).map((record, index) => {
      const diagnostics = normalizeSequence(record.sequence, "iupac-dna")
      if (diagnostics.issues.length > 0) {
        const issue = diagnostics.issues[0]
        throw new TypeError(`${record.id || `Template ${index + 1}`}: invalid character "${issue.character}" at sequence position ${issue.position}`)
      }
      return { name: record.id || record.description || `Template ${index + 1}`, sequence: diagnostics.sequence, length: diagnostics.sequence.length }
    }).filter((template) => template.length > 0)
  }

  // 添加新的引物对
  const addPrimerPair = () => {
    const newId = String(primerPairs.length + 1)
    setPrimerPairs([...primerPairs, {
      id: newId,
      forwardName: `F${newId}`,
      forwardSequence: '',
      reverseName: `R${newId}`,
      reverseSequence: ''
    }])
  }

  // 删除引物对
  const removePrimerPair = (id: string) => {
    if (primerPairs.length > 1) {
      const newPairs = primerPairs.filter(pair => pair.id !== id)
      // 重新编号
      const renumberedPairs = newPairs.map((pair, index) => ({
        ...pair,
        id: String(index + 1),
        forwardName: `F${index + 1}`,
        reverseName: `R${index + 1}`
      }))
      setPrimerPairs(renumberedPairs)
    }
  }

  // 更新引物对
  const updatePrimerPair = (id: string, field: keyof PrimerPair, value: string) => {
    setPrimerPairs(primerPairs.map(pair => 
      pair.id === id ? { ...pair, [field]: value } : pair
    ))
    setResults([])
    setInputError(null)
  }

  // 分析PCR产物
  const analyzePCR = async () => {
    if (!templates.trim()) return

    // 检查是否有有效的引物对
    const validPairs = primerPairs.filter(pair => 
      pair.forwardSequence.trim() && pair.reverseSequence.trim()
    )
    
    if (validPairs.length === 0) return

    const invalidPrimer = validPairs.flatMap((pair) => [pair.forwardSequence, pair.reverseSequence]).find((primer) => !/^[ACGT]+$/i.test(primer.replace(/\s+/g, "")))
    if (invalidPrimer) {
      setInputError("Primers may contain only A, C, G and T")
      setResults([])
      return
    }

    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    let templateList: Template[]
    try {
      templateList = parseFasta(templates)
    } catch (error) {
      setInputError(error instanceof Error ? error.message : "Invalid template sequence")
      setResults([])
      setIsAnalyzing(false)
      return
    }
    setInputError(null)

    if (templateList.length === 0) {
      setIsAnalyzing(false)
      return
    }

    const newResults: PCRResult[] = []

    // 分析每个模板与所有有效的引物对
    templateList.forEach(template => {
      validPairs.forEach(primerPair => {
        const result = calculatePcrProducts(template, primerPair)
        newResults.push(result)
      })
    })

    // 按特异性和产物大小排序
    newResults.sort((a, b) => {
      const specificityOrder = { high: 4, medium: 3, low: 2, none: 1 }
      if (specificityOrder[a.specificity] !== specificityOrder[b.specificity]) {
        return specificityOrder[b.specificity] - specificityOrder[a.specificity]
      }
      if (a.products.length > 0 && b.products.length > 0) {
        return a.products[0].size - b.products[0].size
      }
      return 0
    })

    setResults(newResults)
    setIsAnalyzing(false)
  }

  const clearResults = () => {
    setTemplates("")
    setPrimerPairs([{
      id: '1',
      forwardName: 'F1',
      forwardSequence: '',
      reverseName: 'R1',
      reverseSequence: ''
    }])
    setResults([])
    setInputError(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await copyText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getSpecificityIcon = (specificity: string) => {
    switch (specificity) {
      case 'high': return <Target className="w-4 h-4 text-green-500" />
      case 'medium': return <CheckCircle className="w-4 h-4 text-yellow-500" />
      case 'low': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'none': return <XCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const getSpecificityColor = (specificity: string) => {
    switch (specificity) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'none': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return ''
    }
  }

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>
          {t("tools.pcr-product-calculator.name", "PCR Product Size Calculator")}
        </ToolPageTitle>
        <ToolPageDescription>
          {t("tools.pcr-product-calculator.description", "Calculate primer positions and amplification product sizes from FASTA templates and primer pairs with specificity checking")}
        </ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        {/* 模板序列输入 */}
        <div className="space-y-2">
          <Label htmlFor="templates" className="">
            {t("tools.pcr-product-calculator.templateLabel", "Template Sequences (FASTA)")}
          </Label>
          <Textarea
            id="templates"
            placeholder={t("tools.pcr-product-calculator.templatePlaceholder", "Enter template sequences in FASTA format\nExample:\n>Template 1\nATCGATCGATCGATCGATCG\n>Template 2\nGCTAGCTAGCTAGCTAGCTA")}
            value={templates}
            onChange={(e) => { setTemplates(e.target.value); setResults([]); setInputError(null) }}
            className="terminal-input min-h-[120px] font-mono"
            rows={6}
          />
          {inputError && <Alert variant="destructive"><AlertDescription>{inputError}</AlertDescription></Alert>}
        </div>

        {/* 引物对输入 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="">
              {t("tools.pcr-product-calculator.primerPairs", "Primer Pairs")}
            </Label>
            <Button
              onClick={addPrimerPair}
              variant="outline"
              size="sm"
              className=""
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("tools.pcr-product-calculator.addPair", "Add Pair")}
            </Button>
          </div>

          {primerPairs.map((pair, index) => (
            <Card key={pair.id} className="border-2 border-dashed border-border/50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm font-medium">
                      {t("tools.pcr-product-calculator.pairNumber", "Primer Pair")} {index + 1}
                    </div>
                    {primerPairs.length > 1 && (
                      <Button
                        onClick={() => removePrimerPair(pair.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder={`F${index + 1} - ${t("tools.pcr-product-calculator.forwardPrimer", "Forward Primer")}: ATCGATCGATCG`}
                      value={pair.forwardSequence}
                      onChange={(e) => updatePrimerPair(pair.id, 'forwardSequence', e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                    <Input
                      placeholder={`R${index + 1} - ${t("tools.pcr-product-calculator.reversePrimer", "Reverse Primer")}: GCTAGCTAGCTA`}
                      value={pair.reverseSequence}
                      onChange={(e) => updatePrimerPair(pair.id, 'reverseSequence', e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          {t("tools.pcr-product-calculator.formatHint", "💡 Templates must be in FASTA format. Maximum 2 mismatches allowed for primer binding.")}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={analyzePCR} 
            className="flex-1 "
            disabled={isAnalyzing || !templates.trim()}
          >
            {isAnalyzing ? t("common.loading") : t("tools.pcr-product-calculator.calculate", "Calculate PCR Products")}
          </Button>
          <Button 
            onClick={clearResults} 
            variant="outline" 
            className=""
          >
            {t("common.clear")}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-mono text-muted-foreground">
                {t("tools.pcr-product-calculator.results", "PCR Analysis Results")} ({results.length} {t("tools.pcr-product-calculator.combinations", "primer combinations")})
              </div>
              <div className="flex gap-2 text-xs font-mono">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-green-500" />
                  <span>{t("tools.pcr-product-calculator.highSpecificity", "High")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-yellow-500" />
                  <span>{t("tools.pcr-product-calculator.mediumSpecificity", "Medium")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                  <span>{t("tools.pcr-product-calculator.lowSpecificity", "Low")}</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="text-xs">
                  {t("tools.pcr-product-calculator.overview", "Overview")}
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs">
                  {t("tools.pcr-product-calculator.details", "Details")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono font-bold w-16">{t("tools.pcr-product-calculator.specificity", "Specificity")}</TableHead>
                        <TableHead className="font-mono font-bold">{t("tools.pcr-product-calculator.template", "Template")}</TableHead>
                        <TableHead className="font-mono font-bold">{t("tools.pcr-product-calculator.primerPair", "Primer Pair")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-24">{t("tools.pcr-product-calculator.productSize", "Product Size")}</TableHead>
                        <TableHead className="font-mono font-bold text-center w-20">{t("tools.pcr-product-calculator.products", "Products")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getSpecificityIcon(result.specificity)}
                              <Badge variant="outline" className={`font-mono text-xs ${getSpecificityColor(result.specificity)}`}>
                                {t(`tools.pcr-product-calculator.${result.specificity}Specificity`, result.specificity)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            <div className="font-medium">{result.templateName}</div>
                          </TableCell>
                          <TableCell className="font-mono">
                            <div className="space-y-1">
                              <div className="text-sm">{result.forwardPrimerName} × {result.reversePrimerName}</div>
                              <div className="text-xs text-muted-foreground">
                                F: {result.forwardPrimer.substring(0, 15)}{result.forwardPrimer.length > 15 ? '...' : ''}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                R: {result.reversePrimer.substring(0, 15)}{result.reversePrimer.length > 15 ? '...' : ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {result.products.length > 0 ? (
                              <Badge variant="outline" className="font-mono">
                                {result.products[0].size} bp
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="font-mono text-muted-foreground">
                                No product
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {result.products.length}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getSpecificityIcon(result.specificity)}
                          {result.templateName} - {result.forwardPrimerName} × {result.reversePrimerName}
                        </CardTitle>
                        <Badge className={`font-mono text-xs ${getSpecificityColor(result.specificity)}`}>
                          {t(`tools.pcr-product-calculator.${result.specificity}Specificity`, result.specificity)}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs ">
                        {t("tools.pcr-product-calculator.forwardMatches", "Forward matches")}: {result.forwardMatches.length} | 
                        {t("tools.pcr-product-calculator.reverseMatches", "Reverse matches")}: {result.reverseMatches.length} | 
                        {t("tools.pcr-product-calculator.products", "Products")}: {result.products.length}
                        {result.skippedUnknown > 0 && ` | ${result.skippedUnknown} ${t("tools.pcr-product-calculator.ambiguousSkipped", "ambiguous binding regions skipped")}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.products.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-sm font-mono font-medium">
                            {t("tools.pcr-product-calculator.pcrProducts", "PCR Products")}:
                          </div>
                          {result.products.map((product, index) => (
                            <div key={index} className="bg-muted/30 rounded p-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="font-mono text-sm font-medium">
                                  {t("tools.pcr-product-calculator.product", "Product")} {index + 1}: {product.size} bp
                                </div>
                                <Badge variant="outline" className={`font-mono text-xs ${
                                  product.specificity === 'specific' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                }`}>
                                  {product.specificity}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                <div>
                                  <div className="text-muted-foreground">Forward primer:</div>
                                  <div>Position: {product.forwardMatch.position}</div>
                                  <div>Mismatches: {product.forwardMatch.mismatches}</div>
                                  <div className="break-all">Match: {product.forwardMatch.matchedSequence}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Reverse primer:</div>
                                  <div>Position: {product.reverseMatch.position}</div>
                                  <div>Mismatches: {product.reverseMatch.mismatches}</div>
                                  <div className="break-all">Match: {product.reverseMatch.matchedSequence}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground font-mono text-sm py-4">
                          {t("tools.pcr-product-calculator.noProducts", "No PCR products found with current primer pair")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {results.length > 0 && (
          <Alert>
            <Dna className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t("tools.pcr-product-calculator.tip", "High specificity indicates unique products with perfect primer matches. Low specificity suggests multiple products or primer mismatches.")}
            </AlertDescription>
          </Alert>
        )}
      </ToolPageContent>
    </ToolPage>
  )
}
