"use client"

import { useState } from "react"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/lib/i18n"
import {
  parseIndexInput,
  resolveIndexMode,
  validateIndexEntries,
  type IndexMode,
  type IndexValidationResult,
} from "@/lib/bio"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

const MAX_INDICES = 200
type SelectedMode = "auto" | IndexMode

export function IndexChecker() {
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [result, setResult] = useState<IndexValidationResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [mode, setMode] = useState<SelectedMode>("auto")
  const [maxMismatches, setMaxMismatches] = useState("1")
  const [parseError, setParseError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!input.trim()) return
    setIsChecking(true)
    await new Promise((resolve) => setTimeout(resolve, 50))
    try {
      const resolvedMode = mode === "auto" ? resolveIndexMode(input) : mode
      const entries = parseIndexInput(input, resolvedMode)
      if (entries.length > MAX_INDICES) throw new RangeError(`Too many indexes (maximum ${MAX_INDICES})`)
      const parsedMismatches = Number(maxMismatches)
      const mismatchLimit = maxMismatches.trim() === "" ? 1 : parsedMismatches
      const validation = validateIndexEntries(entries, resolvedMode, mismatchLimit)
      setResult(validation)
      setParseError(null)
    } catch (error) {
      setResult(null)
      setParseError(error instanceof Error ? error.message : "Invalid index input")
    }
    setIsChecking(false)
  }

  const clear = () => {
    setInput("")
    setResult(null)
    setParseError(null)
  }

  const issueTitle = (type: IndexValidationResult["issues"][number]["type"]): string => {
    if (type === "duplicate") return t("tools.index-checker.duplicateIndex")
    if (type === "reverse-complement") return t("tools.index-checker.reverseComplementMatch")
    if (type === "reverse") return t("tools.index-checker.reverseMatch")
    return t("tools.index-checker.similarIndex")
  }

  return (
    <ToolPage>
      <ToolPageHeader>
        <ToolPageTitle>{t("tools.index-checker.name")}</ToolPageTitle>
        <ToolPageDescription>{t("tools.index-checker.description")}</ToolPageDescription>
      </ToolPageHeader>
      <ToolPageContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="index-mode">{t("tools.index-checker.modeLabel", "Index mode")}</Label>
            <select id="index-mode" value={mode} onChange={(event) => { setMode(event.target.value as SelectedMode); setResult(null); setParseError(null) }} className="h-10 w-full rounded-md border bg-background px-3 font-mono text-sm">
              <option value="auto">{t("tools.index-checker.autoMode", "Auto (dual when two columns are present)")}</option>
              <option value="single">{t("tools.index-checker.singleMode", "Single index")}</option>
              <option value="combinatorial">{t("tools.index-checker.combinatorialMode", "Combinatorial dual index")}</option>
              <option value="udi">{t("tools.index-checker.udiMode", "UDI (unique dual index)")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="index-mismatches">{t("tools.index-checker.mismatchLabel", "Allowed mismatches per side (0–2)")}</Label>
            <input id="index-mismatches" type="number" min="0" max="2" value={maxMismatches} onChange={(event) => { setMaxMismatches(event.target.value); setResult(null); setParseError(null) }} className="h-10 w-full rounded-md border bg-background px-3 font-mono text-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="index-input">{t("tools.index-checker.inputLabel")}</Label>
          <Textarea id="index-input" placeholder={t("tools.index-checker.inputPlaceholder")} value={input} onChange={(event) => { setInput(event.target.value); setResult(null); setParseError(null) }} className="font-mono text-sm min-h-[200px]" />
          <p className="text-sm text-muted-foreground">{t("tools.index-checker.formatHint")}</p>
          {parseError && <Alert variant="destructive"><AlertDescription>{parseError}</AlertDescription></Alert>}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCheck} disabled={isChecking || !input.trim()} className="flex-1">
            {isChecking ? t("common.loading") : t("tools.index-checker.checkIndices")}
          </Button>
          <Button onClick={clear} variant="outline">{t("common.clear", "Clear")}</Button>
        </div>

        {result && (
          <CardResult result={result} issueTitle={issueTitle} t={t} />
        )}
      </ToolPageContent>
    </ToolPage>
  )
}
function CardResult({ result, issueTitle, t }: {
  result: IndexValidationResult
  issueTitle: (type: IndexValidationResult["issues"][number]["type"]) => string
  t: (key: string, fallback?: string) => string
}) {
  const severityIcon = (severity: "error" | "warning") => severity === "error"
    ? <XCircle className="h-4 w-4 text-red-500" />
    : <AlertCircle className="h-4 w-4 text-yellow-500" />
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{t("tools.index-checker.results")}</div>
        <div className="flex items-center gap-2">
          {result.isValid ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
          <span className={result.isValid ? "text-sm font-medium text-green-600" : "text-sm font-medium text-red-600"}>{result.isValid ? t("tools.index-checker.allValid") : t("tools.index-checker.issuesFound")}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t("tools.index-checker.mode", "Mode")}: {result.mode} · {t("tools.index-checker.allowedMismatches", "Allowed mismatches")}: {result.allowedMismatches} · {t("tools.index-checker.totalChecked")}: {result.totalChecked}</p>
      <Tabs defaultValue="issues" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="issues">{t("tools.index-checker.issuesTab")}</TabsTrigger>
          <TabsTrigger value="data">{t("tools.index-checker.dataTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="issues" className="space-y-3">
          {result.issues.length === 0 ? <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>{t("tools.index-checker.noIssues")}</AlertDescription></Alert> : result.issues.map((issue, index) => (
            <Alert key={index} variant={issue.severity === "error" ? "destructive" : "default"}>
              <div className="flex items-center gap-3 flex-wrap">
                {severityIcon(issue.severity)}
                <span className="font-medium">{issueTitle(issue.type)}</span>
                <Badge variant={issue.severity === "error" ? "destructive" : "outline"}>{issue.severity}</Badge>
                <span className="text-sm text-muted-foreground">{issue.description}</span>
                <span className="text-sm">{t("tools.index-checker.affectedRows")}: {issue.indices.map((row) => result.entries[row]?.name ?? `row ${row + 1}`).join(", ")}</span>
                {issue.sequences.map((sequence, sequenceIndex) => <span key={sequenceIndex} className="px-2 py-1 bg-muted rounded border font-mono text-sm">{sequence}</span>)}
              </div>
            </Alert>
          ))}
        </TabsContent>
        <TabsContent value="data">
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>{t("tools.index-checker.row")}</TableHead><TableHead>{t("tools.index-checker.sampleName")}</TableHead><TableHead>{t("tools.index-checker.index1")}</TableHead><TableHead>{t("tools.index-checker.index2")}</TableHead><TableHead>{t("tools.index-checker.length")}</TableHead></TableRow></TableHeader>
              <TableBody>{result.entries.map((entry) => <TableRow key={entry.row}><TableCell>{entry.row}</TableCell><TableCell>{entry.name}</TableCell><TableCell className="font-mono">{entry.index1}</TableCell><TableCell className="font-mono">{entry.index2 ?? "-"}</TableCell><TableCell>{entry.index1.length}{entry.index2 ? ` + ${entry.index2.length}` : ""}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
