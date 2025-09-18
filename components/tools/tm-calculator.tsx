"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n"

export function TmCalculator() {
  const { t } = useI18n()
  const [sequence, setSequence] = useState("")
  const [saltConc, setSaltConc] = useState("50")
  const [method, setMethod] = useState("wallace")
  const [result, setResult] = useState<number | null>(null)

  const calculateTm = () => {
    if (!sequence) return

    const cleanSeq = sequence.toUpperCase().replace(/[^ATCG]/g, "")
    const length = cleanSeq.length

    if (length === 0) return

    let tm = 0
    const salt = Number.parseFloat(saltConc)

    if (method === "wallace") {
      // Wallace rule: Tm = 2(A+T) + 4(G+C)
      const at = (cleanSeq.match(/[AT]/g) || []).length
      const gc = (cleanSeq.match(/[GC]/g) || []).length
      tm = 2 * at + 4 * gc
    } else if (method === "nearest-neighbor") {
      // Simplified nearest-neighbor approximation
      const gc = (cleanSeq.match(/[GC]/g) || []).length
      const gcContent = gc / length
      tm = 81.5 + 16.6 * Math.log10(salt / 1000) + 0.41 * gcContent * 100 - 675 / length
    }

    setResult(Math.round(tm * 10) / 10)
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">{t("tools.tm-calculator.name")}</CardTitle>
        <CardDescription className="font-mono">{t("tools.tm-calculator.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="primer-sequence" className="font-mono">
            {t("tools.tm-calculator.sequenceLabel")}
          </Label>
          <Input
            id="primer-sequence"
            placeholder={t("tools.tm-calculator.sequencePlaceholder")}
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            className="terminal-input"
          />
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
                <SelectItem value="nearest-neighbor">{t("tools.tm-calculator.nearestNeighbor")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={calculateTm} className="w-full font-mono">
          {t("tools.tm-calculator.calculate")}
        </Button>

        {result !== null && (
          <div className="terminal-output p-4 rounded-md">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1 font-mono">{t("tools.tm-calculator.result")}</div>
              <div className="text-2xl font-bold text-primary font-mono">{result}°C</div>
              <div className="text-xs text-muted-foreground mt-2 font-mono">
                {t("tools.tm-calculator.length")}: {sequence.replace(/[^ATCG]/gi, "").length} bp
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
