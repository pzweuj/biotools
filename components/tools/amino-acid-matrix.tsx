"use client"

import { useMemo, useRef, useState } from "react"
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

// Grantham (1974) pre-computed distance matrix
// Reference: Grantham R. Amino Acid Difference Formula to Help Explain Protein Evolution, Science 1974
// Amino acid order: A, R, N, D, C, Q, E, G, H, I, L, K, M, F, P, S, T, W, Y, V
const granthamValues: number[][] = [
  [0, 112, 111, 126, 195, 91, 107, 60, 86, 94, 96, 106, 84, 113, 27, 99, 58, 148, 112, 64],
  [112, 0, 86, 96, 180, 43, 54, 125, 29, 97, 102, 26, 91, 97, 103, 110, 71, 101, 77, 96],
  [111, 86, 0, 23, 139, 46, 42, 80, 68, 149, 153, 94, 142, 158, 91, 46, 65, 174, 143, 133],
  [126, 96, 23, 0, 154, 61, 45, 94, 81, 168, 172, 101, 160, 177, 108, 65, 85, 181, 160, 152],
  [195, 180, 139, 154, 0, 154, 170, 159, 174, 198, 198, 202, 196, 205, 169, 112, 149, 215, 194, 192],
  [91, 43, 46, 61, 154, 0, 29, 87, 24, 109, 113, 53, 101, 116, 76, 68, 42, 130, 99, 96],
  [107, 54, 42, 45, 170, 29, 0, 98, 40, 134, 138, 56, 126, 140, 93, 80, 65, 152, 122, 121],
  [60, 125, 80, 94, 159, 87, 98, 0, 98, 135, 138, 127, 127, 153, 42, 56, 59, 184, 147, 109],
  [86, 29, 68, 81, 174, 24, 40, 98, 0, 94, 99, 32, 87, 100, 77, 89, 47, 115, 83, 84],
  [94, 97, 149, 168, 198, 109, 134, 135, 94, 0, 5, 102, 10, 21, 95, 142, 89, 61, 33, 29],
  [96, 102, 153, 172, 198, 113, 138, 138, 99, 5, 0, 107, 15, 22, 98, 145, 92, 61, 36, 32],
  [106, 26, 94, 101, 202, 53, 56, 127, 32, 102, 107, 0, 95, 102, 103, 121, 78, 110, 85, 97],
  [84, 91, 142, 160, 196, 101, 126, 127, 87, 10, 15, 95, 0, 28, 87, 135, 81, 67, 36, 21],
  [113, 97, 158, 177, 205, 116, 140, 153, 100, 21, 22, 102, 28, 0, 114, 155, 103, 40, 22, 50],
  [27, 103, 91, 108, 169, 76, 93, 42, 77, 95, 98, 103, 87, 114, 0, 74, 38, 147, 110, 68],
  [99, 110, 46, 65, 112, 68, 80, 56, 89, 142, 145, 121, 135, 155, 74, 0, 58, 177, 144, 124],
  [58, 71, 65, 85, 149, 42, 65, 59, 47, 89, 92, 78, 81, 103, 38, 58, 0, 128, 92, 69],
  [148, 101, 174, 181, 215, 130, 152, 184, 115, 61, 61, 110, 67, 40, 147, 177, 128, 0, 37, 88],
  [112, 77, 143, 160, 194, 99, 122, 147, 83, 33, 36, 85, 36, 22, 110, 144, 92, 37, 0, 55],
  [64, 96, 133, 152, 192, 96, 121, 109, 84, 29, 32, 97, 21, 50, 68, 124, 69, 88, 55, 0],
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
    isDistance: false,
  },
  {
    id: "Grantham",
    values: granthamValues,
    isDistance: true,
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

const formatScore = (score: number, isDistance: boolean) => {
  if (isDistance) return score.toFixed(1)
  return score > 0 ? `+${score}` : score.toString()
}

export function AminoAcidMatrix() {
  const { t, locale } = useI18n()
  const [selectedMatrixId, setSelectedMatrixId] = useState(matrices[0].id)
  const [rowResidue, setRowResidue] = useState("A")
  const [colResidue, setColResidue] = useState("A")

  const currentMatrix = useMemo(() => matrices.find((m) => m.id === selectedMatrixId) ?? matrices[0], [selectedMatrixId])
  const matrixMap = useMemo(() => buildMatrixMap(currentMatrix.values), [currentMatrix])
  const selectedScore = matrixMap[rowResidue]?.[colResidue] ?? 0
  const isDistanceMode = currentMatrix.isDistance
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to selected column when rowResidue or colResidue changes
  const scrollToSelectedColumn = () => {
    const container = tableContainerRef.current
    if (!container) return

    // Find the header cell for the selected column
    const colHeadElement = container.querySelector(`th[data-col="${colResidue}"]`) as HTMLElement | null

    if (colHeadElement) {
      // Use offsetLeft for reliable positioning relative to scroll container
      const scrollLeft = colHeadElement.offsetLeft - container.clientWidth / 2 + colHeadElement.offsetWidth / 2

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      })
    }
  }

  const handleCellClick = (rowAA: string, colAA: string) => {
    setRowResidue(rowAA)
    setColResidue(colAA)
    // Scroll to column after state updates
    setTimeout(scrollToSelectedColumn, 10)
  }

  const getCellTone = (score: number, isSelected: boolean, isColumnActive: boolean, isIdentity: boolean) => {
    if (isSelected) return "bg-primary/10 text-primary-foreground font-bold"
    if (isColumnActive) return "bg-primary/5"
    if (isIdentity) return "bg-muted/60"
    if (isDistanceMode) {
      // For distance matrix: higher value = more different = warmer color
      if (score === 0) return "text-muted-foreground"
      if (score < 50) return "text-amber-600 dark:text-amber-400"
      if (score < 100) return "text-orange-600 dark:text-orange-400"
      return "text-rose-600 dark:text-rose-400"
    }
    if (score > 0) return "text-emerald-600 dark:text-emerald-300"
    if (score < 0) return "text-rose-600 dark:text-rose-300"
    return "text-muted-foreground"
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {isDistanceMode ? t("tools.amino-acid-matrix.nameDistance") : t("tools.amino-acid-matrix.name")}
        </CardTitle>
        <CardDescription className="font-mono">
          {isDistanceMode ? t("tools.amino-acid-matrix.descriptionDistance") : t("tools.amino-acid-matrix.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="font-mono">{t("tools.amino-acid-matrix.matrixLabel")}</Label>
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
              {isDistanceMode ? t("tools.amino-acid-matrix.noteGrantham") : t("tools.amino-acid-matrix.note62")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="space-y-2">
              <Label className="font-mono">{t("tools.amino-acid-matrix.rowLabel")}</Label>
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
              <Label className="font-mono">{t("tools.amino-acid-matrix.colLabel")}</Label>
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
                {t("tools.amino-acid-matrix.selectedPair")}
              </span>
              <Badge variant="secondary" className="font-mono">
                {rowResidue}{" -> "}{colResidue}
              </Badge>
            </div>
            <div className="text-3xl font-bold font-mono">
              {formatScore(selectedScore, isDistanceMode)}
            </div>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              {isDistanceMode ? t("tools.amino-acid-matrix.hintDistance") : t("tools.amino-acid-matrix.hint")}
            </p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto" ref={tableContainerRef}>
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="font-mono font-bold w-36">
                    {t("tools.amino-acid-matrix.headerLabel")}
                  </TableHead>
                  {aminoAcids.map((aa) => (
                    <TableHead
                      key={aa.code}
                      data-col={aa.code}
                      className="font-mono text-center text-xs w-12"
                    >
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
                          data-col={colAA.code}
                          className={`text-center font-mono text-sm cursor-pointer ${toneClass} transition-colors`}
                          onClick={() => handleCellClick(rowAA.code, colAA.code)}
                        >
                          <span className={isSelected ? "font-bold" : ""}>{formatScore(score, isDistanceMode)}</span>
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
          {isDistanceMode ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {t("tools.amino-acid-matrix.legend.identity")}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{t("tools.amino-acid-matrix.identityText")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {t("tools.amino-acid-matrix.legend.moderate")}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{t("tools.amino-acid-matrix.moderateText")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {t("tools.amino-acid-matrix.legend.extreme")}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{t("tools.amino-acid-matrix.extremeText")}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {t("tools.amino-acid-matrix.legend.identity")}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{t("tools.amino-acid-matrix.identityText")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {t("tools.amino-acid-matrix.legend.positive")}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{t("tools.amino-acid-matrix.positiveText")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {t("tools.amino-acid-matrix.legend.negative")}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{t("tools.amino-acid-matrix.negativeText")}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
