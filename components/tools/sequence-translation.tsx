"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n"

// Genetic code tables (subset)
const GENETIC_CODES: Record<string, { name: string; table: Record<string, string> }> = {
  standard: {
    name: "Standard",
    table: {
      UUU: "F", UUC: "F", UUA: "L", UUG: "L",
      CUU: "L", CUC: "L", CUA: "L", CUG: "L",
      AUU: "I", AUC: "I", AUA: "I", AUG: "M",
      GUU: "V", GUC: "V", GUA: "V", GUG: "V",
      UCU: "S", UCC: "S", UCA: "S", UCG: "S",
      CCU: "P", CCC: "P", CCA: "P", CCG: "P",
      ACU: "T", ACC: "T", ACA: "T", ACG: "T",
      GCU: "A", GCC: "A", GCA: "A", GCG: "A",
      UAU: "Y", UAC: "Y", UAA: "*", UAG: "*",
      CAU: "H", CAC: "H", CAA: "Q", CAG: "Q",
      AAU: "N", AAC: "N", AAA: "K", AAG: "K",
      GAU: "D", GAC: "D", GAA: "E", GAG: "E",
      UGU: "C", UGC: "C", UGA: "*", UGG: "W",
      CGU: "R", CGC: "R", CGA: "R", CGG: "R",
      AGU: "S", AGC: "S", AGA: "R", AGG: "R",
      GGU: "G", GGC: "G", GGA: "G", GGG: "G",
    },
  },
  vertebrate_mito: {
    name: "Vertebrate mitochondrial",
    table: {
      UUU: "F", UUC: "F", UUA: "L", UUG: "L",
      CUU: "L", CUC: "L", CUA: "L", CUG: "L",
      AUU: "I", AUC: "I", AUA: "M", AUG: "M",
      GUU: "V", GUC: "V", GUA: "V", GUG: "V",
      UCU: "S", UCC: "S", UCA: "S", UCG: "S",
      CCU: "P", CCC: "P", CCA: "P", CCG: "P",
      ACU: "T", ACC: "T", ACA: "T", ACG: "T",
      GCU: "A", GCC: "A", GCA: "A", GCG: "A",
      UAU: "Y", UAC: "Y", UAA: "*", UAG: "*",
      CAU: "H", CAC: "H", CAA: "Q", CAG: "Q",
      AAU: "N", AAC: "N", AAA: "K", AAG: "K",
      GAU: "D", GAC: "D", GAA: "E", GAG: "E",
      UGU: "C", UGC: "C", UGA: "W", UGG: "W",
      CGU: "R", CGC: "R", CGA: "R", CGG: "R",
      AGU: "S", AGC: "S", AGA: "*", AGG: "*",
      GGU: "G", GGC: "G", GGA: "G", GGG: "G",
    },
  },
}

const DNA_COMPLEMENT: Record<string, string> = {
  A: "T", T: "A", G: "C", C: "G",
  a: "t", t: "a", g: "c", c: "g",
  R: "Y", Y: "R", S: "S", W: "W", K: "M", M: "K",
  r: "y", y: "r", s: "s", w: "w", k: "m", m: "k",
  B: "V", V: "B", D: "H", H: "D",
  b: "v", v: "b", d: "h", h: "d",
  N: "N", n: "n", "-": "-", ".": ".", " ": " ", "\t": "\t", "\n": "\n", "\r": "\r",
}

const RNA_COMPLEMENT: Record<string, string> = {
  A: "U", U: "A", G: "C", C: "G",
  a: "u", u: "a", g: "c", c: "g",
}

function reverseString(s: string) {
  return s.split("").reverse().join("")
}

function reverseComplement(seq: string, type: "DNA" | "RNA") {
  const map = type === "DNA" ? DNA_COMPLEMENT : RNA_COMPLEMENT
  return reverseString(seq.split("").map((b) => map[b as keyof typeof map] ?? b).join(""))
}

function transcribeDNAtoRNA(seq: string) {
  // Keep delimiters; replacement only for bases
  return seq.replace(/[AaTtUu]/g, (m) => {
    if (m === "A") return "A"
    if (m === "a") return "a"
    if (m === "T") return "U"
    if (m === "t") return "u"
    if (m === "U") return "U" // pass-through if user pasted RNA by mistake
    if (m === "u") return "u"
    return m
  }).replace(/[GgCc]/g, (m) => m)
    .replace(/T/g, "U").replace(/t/g, "u").replace(/\s+/g, (m) => m)
    .replace(/[^ACGUacguNnRYSWKMBDHV\-\.\s,;]+/g, (m) => m) // keep unknowns as-is
    .replace(/\r/g, "\r")
}

function cleanRNA(seq: string) {
  return seq.toUpperCase().replace(/[^ACGU]/g, "")
}

function translateRNA(rna: string, codeKey: string, frame: 1 | 2 | 3, stopMode: "asterisk" | "stop" | "truncate") {
  const table = GENETIC_CODES[codeKey]?.table || GENETIC_CODES.standard.table
  const cleaned = cleanRNA(rna)
  const start = frame - 1
  let protein: string[] = []
  for (let i = start; i + 3 <= cleaned.length; i += 3) {
    const codon = cleaned.slice(i, i + 3) as keyof typeof table
    const aa = table[codon] ?? "X"
    if (aa === "*") {
      if (stopMode === "truncate") break
      protein.push(stopMode === "stop" ? "Stop" : "*")
    } else {
      protein.push(aa)
    }
  }
  return protein.join("")
}

function detectDelimiters(text: string) {
  const delimiters = ["\t", "\n", "\r\n", ",", ";", " "]
  return delimiters.filter((d) => text.includes(d))
}

function processWithDelimiters(sequence: string, operation: (seq: string) => string, preserve: boolean) {
  if (!preserve) return operation(sequence)
  const detected = detectDelimiters(sequence)
  if (detected.length === 0) return operation(sequence)
  const parts = sequence.split(/(\t|\n|\r\n|,|;| +)/)
  return parts.map((part) => (/^(\t|\n|\r\n|,|;| +)$/.test(part) ? part : (part.trim() ? operation(part) : part))).join("")
}

export function SequenceTranslation() {
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [preserveDelimiters, setPreserveDelimiters] = useState(true)
  const [copied, setCopied] = useState(false)

  const [inputType, setInputType] = useState<"DNA" | "RNA">("DNA")
  const [geneticCode, setGeneticCode] = useState<string>("standard")
  const [frame, setFrame] = useState<1 | 2 | 3>(1)
  const [stopMode, setStopMode] = useState<"asterisk" | "stop" | "truncate">("asterisk")

  const codeOptions = useMemo(() => Object.entries(GENETIC_CODES).map(([key, v]) => ({ key, name: v.name })), [])

  const handleTranscribe = () => {
    setOutput(processWithDelimiters(input, (seq) => {
      const cleaned = seq.replace(/[^ATUGCRYSWKMBDHVNatugcryswkmbdhvn\-\.\s,;]/g, (m) => m)
      return transcribeDNAtoRNA(cleaned)
    }, preserveDelimiters))
  }

  const handleTranslate = () => {
    setOutput(processWithDelimiters(input, (seq) => {
      const rna = inputType === "DNA" ? transcribeDNAtoRNA(seq) : seq
      return translateRNA(rna, geneticCode, frame, stopMode)
    }, preserveDelimiters))
  }

  const handleReverseComplement = () => {
    setOutput(processWithDelimiters(input, (seq) => reverseComplement(seq, inputType), preserveDelimiters))
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setCopied(false)
  }

  const copyToClipboard = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // noop
    }
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.sequence-translation.name", "Sequence Translation")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.sequence-translation.description", "DNA→RNA transcription, RNA→protein translation, genetic code selection, reverse complement")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="font-mono">{t("tools.sequence-translation.inputType", "Input Type")}</Label>
            <Select value={inputType} onValueChange={(v) => setInputType(v as any)}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DNA" className="font-mono">DNA</SelectItem>
                <SelectItem value="RNA" className="font-mono">RNA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-mono">{t("tools.sequence-translation.geneticCode", "Genetic Code")}</Label>
            <Select value={geneticCode} onValueChange={setGeneticCode}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {codeOptions.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key} className="font-mono">{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-mono">{t("tools.sequence-translation.frame", "Reading Frame")}</Label>
            <Select value={String(frame)} onValueChange={(v) => setFrame(Number(v) as 1 | 2 | 3)}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="font-mono">1</SelectItem>
                <SelectItem value="2" className="font-mono">2</SelectItem>
                <SelectItem value="3" className="font-mono">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="font-mono">{t("tools.sequence-translation.stopMode", "Stop Codon Mode")}</Label>
            <Select value={stopMode} onValueChange={(v) => setStopMode(v as any)}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asterisk" className="font-mono">*</SelectItem>
                <SelectItem value="stop" className="font-mono">Stop</SelectItem>
                <SelectItem value="truncate" className="font-mono">{t("tools.sequence-translation.truncate", "Truncate at first stop")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 md:col-span-2">
            <div className="flex items-start gap-3 rounded-md border border-border bg-card/40 px-3 py-3">
              <Checkbox
                id="preserve-delimiters"
                checked={preserveDelimiters}
                onCheckedChange={(checked) => setPreserveDelimiters(checked as boolean)}
                className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5"
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="preserve-delimiters" className="font-mono text-sm">
                  {t("tools.sequence-translation.preserveDelimiters", "Preserve delimiters (tabs, spaces, commas)")}
                </Label>
                <div className="text-xs text-muted-foreground font-mono">
                  {t("tools.sequence-translation.preserveHint", "Keep spaces/Tabs/commas so multiple sequences remain aligned when pasting from spreadsheets.")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sequence-input" className="font-mono">
            {t("tools.sequence-translation.inputLabel", "Input sequence (DNA/RNA)")}
          </Label>
          <Textarea
            id="sequence-input"
            placeholder={t("tools.sequence-translation.inputPlaceholder", "Paste DNA or RNA sequence. Delimiters like spaces, tabs, commas will be preserved if enabled.")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="terminal-input min-h-[120px] font-mono"
            rows={5}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleTranscribe} variant="outline" className="font-mono" disabled={inputType !== "DNA"}>
            {t("tools.sequence-translation.transcribe", "DNA → RNA")}
          </Button>
          <Button onClick={handleTranslate} variant="outline" className="font-mono">
            {t("tools.sequence-translation.translate", "RNA → Protein")}
          </Button>
          <Button onClick={handleReverseComplement} variant="outline" className="font-mono">
            {t("tools.sequence-translation.reverseComplement", "Reverse Complement")}
          </Button>
          <Button onClick={clearAll} variant="outline" className="font-mono">
            {t("common.clear")}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sequence-output" className="font-mono">
              {t("tools.sequence-translation.outputLabel", "Output")}
            </Label>
            {output && (
              <Button onClick={copyToClipboard} variant="ghost" size="sm" className="font-mono h-8 px-2" disabled={!output}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    {t("common.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    {t("common.copy")}
                  </>
                )}
              </Button>
            )}
          </div>
          <Textarea
            id="sequence-output"
            value={output}
            readOnly
            className="terminal-output min-h-[120px] font-mono bg-muted/50"
            rows={5}
            placeholder={t("tools.sequence-translation.outputPlaceholder", "Result will appear here")}
          />
        </div>

        {input && (
          <div className="text-sm text-muted-foreground font-mono space-y-1">
            <div>{t("tools.sequence-translation.inputLength", "Input length")}: {input.length}</div>
            {output && <div>{t("tools.sequence-translation.outputLength", "Output length")}: {output.length}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
