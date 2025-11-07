"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Calculator } from "lucide-react"
import { useI18n } from "@/lib/i18n"

// 氨基酸pKa值 (用于pI计算)
const AA_PKA: Record<string, { pKa?: number; charge: number }> = {
  A: { charge: 0 }, R: { pKa: 12.48, charge: 1 }, N: { charge: 0 }, D: { pKa: 3.65, charge: -1 },
  C: { pKa: 8.18, charge: 0 }, Q: { charge: 0 }, E: { pKa: 4.25, charge: -1 }, G: { charge: 0 },
  H: { pKa: 6.00, charge: 1 }, I: { charge: 0 }, L: { charge: 0 }, K: { pKa: 10.53, charge: 1 },
  M: { charge: 0 }, F: { charge: 0 }, P: { charge: 0 }, S: { charge: 0 }, T: { charge: 0 },
  W: { charge: 0 }, Y: { pKa: 10.07, charge: 0 }, V: { charge: 0 }
}

// Kyte-Doolittle疏水性标度
const HYDROPHOBICITY: Record<string, number> = {
  A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4,
  H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8,
  T: -0.7, W: -0.9, Y: -1.3, V: 4.2
}

// 氨基酸分子量表 (Da)
const AMINO_ACID_WEIGHTS: Record<string, number> = {
  A: 89.09, R: 174.20, N: 132.12, D: 133.10, C: 121.15,
  E: 147.13, Q: 146.15, G: 75.07, H: 155.16, I: 131.17,
  L: 131.17, K: 146.19, M: 149.21, F: 165.19, P: 115.13,
  S: 105.09, T: 119.12, W: 204.23, Y: 181.19, V: 117.15
}

// 氨基酸分类
const AA_CATEGORIES = {
  hydrophobic: ['A', 'V', 'I', 'L', 'M', 'F', 'Y', 'W'],
  polar: ['S', 'T', 'N', 'Q'],
  charged: ['D', 'E', 'K', 'R', 'H'],
  special: ['C', 'G', 'P']
}

export function ProteinAnalysisTool() {
  const { t } = useI18n()
  const [sequence, setSequence] = useState("")

  const cleanSeq = useMemo(() => sequence.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, ""), [sequence])

  // 分子量计算
  const molecularWeight = useMemo(() => {
    if (!cleanSeq) return 0
    
    let weight = 18.015 // 水分子 (H2O)
    for (const aa of cleanSeq) {
      weight += AMINO_ACID_WEIGHTS[aa] || 0
    }
    
    // 减去肽键形成过程中失去的水分子
    if (cleanSeq.length > 1) {
      weight -= (cleanSeq.length - 1) * 18.015
    }
    
    return weight
  }, [cleanSeq])

  // 等电点计算
  const calculatePI = (seq: string): number => {
    if (!seq) return 0
    
    const calculateCharge = (pH: number): number => {
      let charge = 0
      
      // N端和C端
      charge += 1 / (1 + Math.pow(10, pH - 9.69)) // N端 pKa = 9.69
      charge -= 1 / (1 + Math.pow(10, 2.34 - pH)) // C端 pKa = 2.34
      
      // 侧链
      for (const aa of seq) {
        const data = AA_PKA[aa]
        if (data?.pKa) {
          if (data.charge > 0) {
            charge += data.charge / (1 + Math.pow(10, pH - data.pKa))
          } else {
            charge += data.charge / (1 + Math.pow(10, data.pKa - pH))
          }
        }
      }
      return charge
    }

    // 二分法求解pI
    let low = 0, high = 14
    while (high - low > 0.01) {
      const mid = (low + high) / 2
      const charge = calculateCharge(mid)
      if (charge > 0) {
        low = mid
      } else {
        high = mid
      }
    }
    return (low + high) / 2
  }

  // 疏水性分析
  const hydrophobicityAnalysis = useMemo(() => {
    if (!cleanSeq) return { average: 0, values: [] }
    
    const values = cleanSeq.split('').map(aa => HYDROPHOBICITY[aa] || 0)
    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    
    return { average, values }
  }, [cleanSeq])

  // 氨基酸组成分析
  const composition = useMemo(() => {
    if (!cleanSeq) return { counts: {}, categories: {}, total: 0 }
    
    const counts: Record<string, number> = {}
    for (const aa of cleanSeq) {
      counts[aa] = (counts[aa] || 0) + 1
    }
    
    const categories = {
      hydrophobic: AA_CATEGORIES.hydrophobic.reduce((sum, aa) => sum + (counts[aa] || 0), 0),
      polar: AA_CATEGORIES.polar.reduce((sum, aa) => sum + (counts[aa] || 0), 0),
      charged: AA_CATEGORIES.charged.reduce((sum, aa) => sum + (counts[aa] || 0), 0),
      special: AA_CATEGORIES.special.reduce((sum, aa) => sum + (counts[aa] || 0), 0)
    }
    
    return { counts, categories, total: cleanSeq.length }
  }, [cleanSeq])

  const pI = useMemo(() => calculatePI(cleanSeq), [cleanSeq])

  const clearAll = () => {
    setSequence("")
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.protein-analysis.name", "Protein Analysis Tool")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.protein-analysis.description", "Calculate molecular weight, isoelectric point (pI), hydrophobicity, and amino acid composition")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 序列输入 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              {t("tools.protein-analysis.input", "Protein Sequence Input")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="protein-seq" className="font-mono">
                {t("tools.protein-analysis.sequence", "Protein Sequence")}
              </Label>
              <Textarea
                id="protein-seq"
                placeholder={t("tools.protein-analysis.placeholder", "Enter protein sequence (single letter amino acid codes)\nExample: MKTAYIAKQRQISFVK")}
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                className="terminal-input min-h-[120px] font-mono"
                rows={6}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                <span>{cleanSeq.length} {t("tools.protein-analysis.residues", "residues")}</span>
                <Button onClick={clearAll} variant="outline" size="sm" className="font-mono">
                  {t("common.clear", "Clear")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {cleanSeq && (
          <>
            {/* 基本属性 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-dashed border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    {t("tools.protein-analysis.molecularWeight", "Molecular Weight")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-primary">
                      {molecularWeight.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {t("tools.protein-analysis.daltons", "Daltons (Da)")}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {(molecularWeight / 1000).toFixed(2)} kDa
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono flex items-center">
                    <Calculator className="w-4 h-4 mr-2" />
                    {t("tools.protein-analysis.isoelectric", "Isoelectric Point (pI)")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-primary">
                      {pI.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {t("tools.protein-analysis.piUnit", "pH units")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono">
                    {t("tools.protein-analysis.hydrophobicity", "Hydrophobicity")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-primary">
                      {hydrophobicityAnalysis.average.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {t("tools.protein-analysis.kyteDoolittle", "Kyte-Doolittle scale")}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {hydrophobicityAnalysis.average > 0 ? 
                        t("tools.protein-analysis.hydrophobic", "Hydrophobic") : 
                        t("tools.protein-analysis.hydrophilic", "Hydrophilic")
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 氨基酸组成 */}
            <Card className="border-2 border-dashed border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono">
                  {t("tools.protein-analysis.composition", "Amino Acid Composition")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 分类统计 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(composition.categories).map(([category, count]) => (
                    <div key={category} className="text-center">
                      <div className="text-lg font-mono font-bold">
                        {count} ({((count / composition.total) * 100).toFixed(1)}%)
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {t(`tools.protein-analysis.${category}`, category)}
                      </div>
                      <Progress 
                        value={(count / composition.total) * 100} 
                        className="h-2 mt-1"
                      />
                    </div>
                  ))}
                </div>

                {/* 详细组成表 */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-center">{t("tools.protein-analysis.aminoAcid", "AA")}</TableHead>
                        <TableHead className="font-mono text-center">{t("tools.protein-analysis.count", "Count")}</TableHead>
                        <TableHead className="font-mono text-center">{t("tools.protein-analysis.percentage", "%")}</TableHead>
                        <TableHead className="font-mono text-center">{t("tools.protein-analysis.hydrophobicityValue", "Hydrophobicity")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(composition.counts)
                        .sort(([,a], [,b]) => b - a)
                        .map(([aa, count]) => (
                          <TableRow key={aa}>
                            <TableCell className="font-mono text-center font-bold">{aa}</TableCell>
                            <TableCell className="font-mono text-center">{count}</TableCell>
                            <TableCell className="font-mono text-center">
                              {((count / composition.total) * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell className="font-mono text-center">
                              <Badge variant={HYDROPHOBICITY[aa] > 0 ? "default" : "secondary"}>
                                {HYDROPHOBICITY[aa].toFixed(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Calculator className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                {t("tools.protein-analysis.note", "Molecular weight calculated including peptide bonds. pI calculated using Henderson-Hasselbalch equation. Hydrophobicity based on Kyte-Doolittle scale.")}
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ProteinAnalysisTool
