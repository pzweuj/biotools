"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"

export function BaseComplement() {
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const getComplement = (sequence: string) => {
    const complementMap: { [key: string]: string } = {
      A: "T",
      T: "A",
      G: "C",
      C: "G",
      a: "t",
      t: "a",
      g: "c",
      c: "g",
    }
    return sequence
      .split("")
      .map((base) => complementMap[base] || base)
      .join("")
  }

  const getReverseComplement = (sequence: string) => {
    return getComplement(sequence).split("").reverse().join("")
  }

  const handleComplement = () => {
    setOutput(getComplement(input))
  }

  const handleReverseComplement = () => {
    setOutput(getReverseComplement(input))
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">{t("tools.base-complement.name")}</CardTitle>
        <CardDescription className="font-mono">{t("tools.base-complement.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sequence-input" className="font-mono">
            {t("tools.base-complement.inputLabel")}
          </Label>
          <Textarea
            id="sequence-input"
            placeholder={t("tools.base-complement.inputPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            className="terminal-input"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleComplement} variant="default" className="font-mono">
            {t("tools.base-complement.complement")}
          </Button>
          <Button onClick={handleReverseComplement} variant="secondary" className="font-mono">
            {t("tools.base-complement.reverseComplement")}
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label className="font-mono">{t("tools.base-complement.result")}</Label>
            <div className="terminal-output p-4 rounded-md">
              <div className="mb-2 font-mono text-sm">
                <span className="text-muted-foreground">{t("tools.base-complement.original")}:</span>
                <span className="ml-2">{input}</span>
              </div>
              <div className="font-mono text-sm">
                <span className="text-muted-foreground">{t("tools.base-complement.output")}:</span>
                <span className="ml-2 text-primary font-bold">{output}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
