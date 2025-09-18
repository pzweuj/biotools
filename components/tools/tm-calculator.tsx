"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

interface PrimerResult {
  sequence: string
  cleanSequence: string
  tm: number
  length: number
  gcContent: number
}

export function TmCalculator() {
  const { t } = useI18n()
  const [sequences, setSequences] = useState("")
  const [saltConc, setSaltConc] = useState("50")
  const [method, setMethod] = useState("wallace")
  const [results, setResults] = useState<PrimerResult[]>([])

  const calculateSingleTm = (cleanSeq: string, salt: number): number => {
    const length = cleanSeq.length
    const at = (cleanSeq.match(/[AT]/g) || []).length
    const gc = (cleanSeq.match(/[GC]/g) || []).length
    const gcContent = gc / length
    let tm = 0

    switch (method) {
      case "wallace":
        // Wallace rule: Tm = 2(A+T) + 4(G+C)
        tm = 2 * at + 4 * gc
        break

      case "basic-gc":
        // Basic GC method for sequences < 14 bp: Tm = 2(A+T) + 4(G+C)
        // For sequences >= 14 bp: Tm = 64.9 + 41*(GC% - 16.4)/length
        if (length < 14) {
          tm = 2 * at + 4 * gc
        } else {
          tm = 64.9 + 41 * (gcContent * 100 - 16.4) / length
        }
        break

      case "salt-adjusted":
        // Salt-adjusted method (simplified nearest-neighbor)
        tm = 81.5 + 16.6 * Math.log10(salt / 1000) + 0.41 * gcContent * 100 - 675 / length
        break

      case "santa-lucia":
        // SantaLucia nearest-neighbor method (simplified version)
        // This is a simplified implementation of the SantaLucia algorithm
        // Full implementation would require dinucleotide thermodynamic parameters
        const baselineTm = 81.5 + 16.6 * Math.log10(salt / 1000) + 0.41 * gcContent * 100 - 675 / length
        
        // Apply corrections for sequence composition
        let correction = 0
        
        // GC clamp bonus (if sequence ends with G or C)
        if (cleanSeq.endsWith('G') || cleanSeq.endsWith('C')) {
          correction += 0.5
        }
        if (cleanSeq.startsWith('G') || cleanSeq.startsWith('C')) {
          correction += 0.5
        }
        
        // Length correction for very short primers
        if (length < 20) {
          correction -= (20 - length) * 0.3
        }
        
        // AT-rich sequence penalty
        if (gcContent < 0.3) {
          correction -= 2
        }
        
        tm = baselineTm + correction
        break

      case "nearest-neighbor":
        // Original nearest-neighbor approximation (kept for compatibility)
        tm = 81.5 + 16.6 * Math.log10(salt / 1000) + 0.41 * gcContent * 100 - 675 / length
        break

      default:
        tm = 2 * at + 4 * gc
    }

    return Math.round(tm * 10) / 10
  }

  const calculateTm = () => {
    if (!sequences.trim()) return

    const salt = Number.parseFloat(saltConc)
    const sequenceLines = sequences
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const newResults: PrimerResult[] = []

    sequenceLines.forEach((originalSeq) => {
      const cleanSeq = originalSeq.toUpperCase().replace(/[^ATCG]/g, "")
      
      if (cleanSeq.length === 0) return

      const gc = (cleanSeq.match(/[GC]/g) || []).length
      const gcContent = Math.round((gc / cleanSeq.length) * 100)
      const tm = calculateSingleTm(cleanSeq, salt)

      newResults.push({
        sequence: originalSeq,
        cleanSequence: cleanSeq,
        tm,
        length: cleanSeq.length,
        gcContent
      })
    })

    setResults(newResults)
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">{t("tools.tm-calculator.name")}</CardTitle>
        <CardDescription className="font-mono">{t("tools.tm-calculator.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="primer-sequences" className="font-mono">
            {t("tools.tm-calculator.sequenceLabel")}
          </Label>
          <Textarea
            id="primer-sequences"
            placeholder={t("tools.tm-calculator.sequencePlaceholder")}
            value={sequences}
            onChange={(e) => setSequences(e.target.value)}
            className="terminal-input min-h-[120px] font-mono"
            rows={5}
          />
          <div className="text-xs text-muted-foreground font-mono">
            {t("tools.tm-calculator.multipleSequencesHint")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salt-concentration" className="font-mono">
              {t("tools.tm-calculator.saltLabel")}
            </Label>
            <Input
              id="salt-concentration"
              type="number"
              value={saltConc}
              onChange={(e) => setSaltConc(e.target.value)}
              placeholder="50"
              className="terminal-input"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono">{t("tools.tm-calculator.methodLabel")}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="terminal-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wallace">{t("tools.tm-calculator.wallace")}</SelectItem>
                <SelectItem value="basic-gc">{t("tools.tm-calculator.basicGc")}</SelectItem>
                <SelectItem value="salt-adjusted">{t("tools.tm-calculator.saltAdjusted")}</SelectItem>
                <SelectItem value="santa-lucia">{t("tools.tm-calculator.santaLucia")}</SelectItem>
                <SelectItem value="nearest-neighbor">{t("tools.tm-calculator.nearestNeighbor")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground font-mono">
              {t(`tools.tm-calculator.${method}Description`)}
            </div>
          </div>
        </div>

        <Button onClick={calculateTm} className="w-full font-mono">
          {t("tools.tm-calculator.calculate")}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm font-mono text-muted-foreground">
                {t("tools.tm-calculator.results")} ({results.length} {t("tools.tm-calculator.primers")})
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {t("tools.tm-calculator.algorithm")}: {t(`tools.tm-calculator.${method.replace('-', '')}`)}
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono font-bold">
                      {t("tools.tm-calculator.sequence")}
                    </TableHead>
                    <TableHead className="font-mono font-bold text-center w-20">
                      {t("tools.tm-calculator.length")}
                    </TableHead>
                    <TableHead className="font-mono font-bold text-center w-24">
                      {t("tools.tm-calculator.gcContent")}
                    </TableHead>
                    <TableHead className="font-mono font-bold text-center w-24">
                      {t("tools.tm-calculator.tmValue")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((primer, index) => (
                    <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono">
                        <div className="break-all text-sm">
                          {primer.sequence}
                        </div>
                        {primer.sequence !== primer.cleanSequence && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {t("tools.tm-calculator.cleaned")}: {primer.cleanSequence}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {primer.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={`font-mono ${
                            primer.gcContent >= 40 && primer.gcContent <= 60 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                              : ""
                          }`}
                        >
                          {primer.gcContent}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="default" 
                          className="font-mono font-bold text-lg"
                        >
                          {primer.tm}°C
                        </Badge>
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
  )
}
