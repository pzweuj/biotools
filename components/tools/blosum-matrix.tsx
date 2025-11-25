"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useI18n } from "@/lib/i18n"

const aminoAcids = [
  { code: "A", three: "Ala", zh: "丙氨酸", en: "Alanine" },
  { code: "R", three: "Arg", zh: "精氨酸", en: "Arginine" },
  { code: "N", three: "Asn", zh: "天冬酰胺", en: "Asparagine" },
  { code: "D", three: "Asp", zh: "天冬氨酸", en: "Aspartic acid" },
  { code: "C", three: "Cys", zh: "半胱氨酸", en: "Cysteine" },
  { code: "Q", three: "Gln", zh: "谷氨酰胺", en: "Glutamine" },
  { code: "E", three: "Glu", zh: "谷氨酸", en: "Glutamic acid" },
  { code: "G", three: "Gly", zh: "甘氨酸", en: "Glycine" },
  { code: "H", three: "His", zh: "组氨酸", en: "Histidine" },
  { code: "I", three: "Ile", zh: "异亮氨酸", en: "Isoleucine" },
  { code: "L", three: "Leu", zh: "亮氨酸", en: "Leucine" },
  { code: "K", three: "Lys", zh: "赖氨酸", en: "Lysine" },
  { code: "M", three: "Met", zh: "蛋氨酸", en: "Methionine" },
  { code: "F", three: "Phe", zh: "苯丙氨酸", en: "Phenylalanine" },
  { code: "P", three: "Pro", zh: "脯氨酸", en: "Proline" },
  { code: "S", three: "Ser", zh: "丝氨酸", en: "Serine" },
  { code: "T", three: "Thr", zh: "苏氨酸", en: "Threonine" },
  { code: "W", three: "Trp", zh: "色氨酸", en: "Tryptophan" },
  { code: "Y", three: "Tyr", zh: "酪氨酸", en: "Tyrosine" },
  { code: "V", three: "Val", zh: "缬氨酸", en: "Valine" },
]

const blosum62Values: number[][] = [
  [4, -1, -2, -2, 0, -1, -1, 0, -2, -1, -1, -1, -1, -2, -1, 1, 0, -3, -2, 0],
  [-1, 5, 0, -2, -3, 1, 0, -2, 0, -3, -2, 2, -1, -3, -2, -1, -1, -3, -2, -3],
  [-2, 0, 6, 1, -3, 0, 0, 0, 1, -3, -3, 0, -2, -3, -2, 1, 0, -4, -2, -3],
  [-2, -2, 1, 6, -3, 0, 2, -1, -1, -3, -4, -1, -3, -3, -1, 0, -1, -4, -3, -3],
  [0, -3, -3, -3, 9, -3, -4, -3, -3, -1, -1, -3, -1, -2, -3, -1, -1, -2, -2, -1],
  [-1, 1, 0, 0, -3, 5, 2, -2, 0, -3, -2, 1, 0, -3, -1, 0, -1, -2, -1, -2],
  [-1, 0, 0, 2, -4, 2, 5, -2, 0, -3, -3, 1, -2, -3, -1, 0, -1, -3, -2, -2],
  [0, -2, 0, -1, -3, -2, -2, 6, -2, -4, -4, -2, -3, -3, -2, 0, -2, -2, -3, -3],
  [-2, 0, 1, -1, -3, 0, 0, -2, 8, -3, -3, -1, -2, -1, -2, -1, -2, -2, 2, -3],
  [-1, -3, -3, -3, -1, -3, -3, -4, -3, 4, 2, -3, 1, 0, -3, -2, -1, -3, -1, 3],
  [-1, -2, -3, -4, -1, -2, -3, -4, -3, 2, 4, -2, 2, 0, -3, -2, -1, -2, -1, 1],
  [-1, 2, 0, -1, -3, 1, 1, -2, -1, -3, -2, 5, -1, -3, -1, 0, -1, -3, -2, -2],
  [-1, -1, -2, -3, -1, 0, -2, -3, -2, 1, 2, -1, 5, 0, -2, -1, -1, -1, -1, 1],
  [-2, -3, -3, -3, -2, -3, -3, -3, -1, 0, 0, -3, 0, 6, -4, -2, -2, 1, 3, -1],
  [-1, -2, -2, -1, -3, -1, -1, -2, -2, -3, -3, -1, -2, -4, 7, -1, -1, -4, -3, -2],
  [1, -1, 1, 0, -1, 0, 0, 0, -1, -2, -2, 0, -1, -2, -1, 4, 1, -3, -2, -2],
  [0, -1, 0, -1, -1, -1, -1, -2, -2, -1, -1, -1, -1, -2, -1, 1, 5, -2, -2, 0],
  [-3, -3, -4, -4, -2, -2, -3, -2, -2, -3, -2, -3, -1, 1, -4, -3, -2, 11, 2, -3],
  [-2, -2, -2, -3, -2, -1, -2, -3, 2, -1, -1, -2, -1, 3, -3, -2, -2, 2, 7, -1],
  [0, -3, -3, -3, -1, -2, -2, -3, -3, 3, 1, -2, 1, -1, -2, -2, 0, -3, -1, 4],
]

const matrices = [
  {
    id: "BLOSUM62",
    values: blosum62Values,
  },
]

const buildMatrixMap = (values: number[][]) => {
  const map: Record<string, Record<string, number>> = {}
  aminoAcids.forEach((rowAA, rowIndex) => {
    map[rowAA.code] = {}
    aminoAcids.forEach((colAA, colIndex) => {
      map[rowAA.code][colAA.code] = values[rowIndex][colIndex]
    })
  })
  return map
}

const formatScore = (score: number) => (score > 0 ? `+${score}` : score.toString())

export function BlosumMatrix() {
  const { t, locale } = useI18n()
  const [selectedMatrixId, setSelectedMatrixId] = useState(matrices[0].id)
  const [rowResidue, setRowResidue] = useState("A")
  const [colResidue, setColResidue] = useState("A")

  const currentMatrix = useMemo(() => matrices.find((m) => m.id === selectedMatrixId) ?? matrices[0], [selectedMatrixId])
  const matrixMap = useMemo(() => buildMatrixMap(currentMatrix.values), [currentMatrix])
  const selectedScore = matrixMap[rowResidue]?.[colResidue] ?? 0

  const getCellTone = (score: number, isSelected: boolean, isColumnActive: boolean, isIdentity: boolean) => {
    if (isSelected) return "bg-primary/10 text-primary-foreground font-bold"
    if (isColumnActive) return "bg-primary/5"
    if (isIdentity) return "bg-muted/60"
    if (score > 0) return "text-emerald-600 dark:text-emerald-300"
    if (score < 0) return "text-rose-600 dark:text-rose-300"
    return "text-muted-foreground"
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.blosum-matrix.name")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.blosum-matrix.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="font-mono">{t("tools.blosum-matrix.matrixLabel")}</Label>
            <Select value={selectedMatrixId} onValueChange={setSelectedMatrixId}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {matrices.map((matrix) => (
                  <SelectItem key={matrix.id} value={matrix.id} className="font-mono">
                    {matrix.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              {t("tools.blosum-matrix.note62")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="space-y-2">
              <Label className="font-mono">{t("tools.blosum-matrix.rowLabel")}</Label>
              <Select value={rowResidue} onValueChange={setRowResidue}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aminoAcids.map((aa) => (
                    <SelectItem key={aa.code} value={aa.code} className="font-mono">
                      {aa.code} · {locale === "zh" ? aa.zh : aa.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono">{t("tools.blosum-matrix.colLabel")}</Label>
              <Select value={colResidue} onValueChange={setColResidue}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aminoAcids.map((aa) => (
                    <SelectItem key={aa.code} value={aa.code} className="font-mono">
                      {aa.code} · {locale === "zh" ? aa.zh : aa.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/40 flex flex-col gap-2 justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-mono">
                {t("tools.blosum-matrix.selectedPair")}
              </span>
              <Badge variant="secondary" className="font-mono">
                {rowResidue} -> {colResidue}
              </Badge>
            </div>
            <div className="text-3xl font-bold font-mono">
              {formatScore(selectedScore)}
            </div>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              {t("tools.blosum-matrix.hint")}
            </p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="font-mono font-bold w-36">
                    {t("tools.blosum-matrix.headerLabel")}
                  </TableHead>
                  {aminoAcids.map((aa) => (
                    <TableHead key={aa.code} className="font-mono text-center text-xs w-12">
                      {aa.code}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {aminoAcids.map((rowAA, rowIndex) => (
                  <TableRow
                    key={rowAA.code}
                    className={`${rowAA.code === rowResidue ? "bg-muted/60" : ""}`}
                  >
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{rowAA.code}</span>
                        <span className="text-xs text-muted-foreground">
                          {locale === "zh" ? rowAA.zh : rowAA.en}
                        </span>
                      </div>
                    </TableCell>
                    {aminoAcids.map((colAA, colIndex) => {
                      const score = currentMatrix.values[rowIndex][colIndex]
                      const isSelected = rowAA.code === rowResidue && colAA.code === colResidue
                      const isColumnActive = colAA.code === colResidue
                      const isIdentity = rowAA.code === colAA.code
                      const toneClass = getCellTone(score, isSelected, isColumnActive, isIdentity)

                      return (
                        <TableCell
                          key={colAA.code}
                          className={`text-center font-mono text-sm cursor-pointer ${toneClass} transition-colors`}
                          onClick={() => {
                            setRowResidue(rowAA.code)
                            setColResidue(colAA.code)
                          }}
                        >
                          <span className={isSelected ? "font-bold" : ""}>{formatScore(score)}</span>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {t("tools.blosum-matrix.legend.identity")}
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">{t("tools.blosum-matrix.identityText")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {t("tools.blosum-matrix.legend.positive")}
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">{t("tools.blosum-matrix.positiveText")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {t("tools.blosum-matrix.legend.negative")}
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">{t("tools.blosum-matrix.negativeText")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
