"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useI18n } from "@/lib/i18n"

const aminoAcids = [
  { name: "丙氨酸", nameEn: "Alanine", threeCode: "Ala", oneCode: "A", codon: ["GCU", "GCC", "GCA", "GCG"] },
  {
    name: "精氨酸",
    nameEn: "Arginine",
    threeCode: "Arg",
    oneCode: "R",
    codon: ["CGU", "CGC", "CGA", "CGG", "AGA", "AGG"],
  },
  { name: "天冬酰胺", nameEn: "Asparagine", threeCode: "Asn", oneCode: "N", codon: ["AAU", "AAC"] },
  { name: "天冬氨酸", nameEn: "Aspartic acid", threeCode: "Asp", oneCode: "D", codon: ["GAU", "GAC"] },
  { name: "半胱氨酸", nameEn: "Cysteine", threeCode: "Cys", oneCode: "C", codon: ["UGU", "UGC"] },
  { name: "谷氨酰胺", nameEn: "Glutamine", threeCode: "Gln", oneCode: "Q", codon: ["CAA", "CAG"] },
  { name: "谷氨酸", nameEn: "Glutamic acid", threeCode: "Glu", oneCode: "E", codon: ["GAA", "GAG"] },
  { name: "甘氨酸", nameEn: "Glycine", threeCode: "Gly", oneCode: "G", codon: ["GGU", "GGC", "GGA", "GGG"] },
  { name: "组氨酸", nameEn: "Histidine", threeCode: "His", oneCode: "H", codon: ["CAU", "CAC"] },
  { name: "异亮氨酸", nameEn: "Isoleucine", threeCode: "Ile", oneCode: "I", codon: ["AUU", "AUC", "AUA"] },
  {
    name: "亮氨酸",
    nameEn: "Leucine",
    threeCode: "Leu",
    oneCode: "L",
    codon: ["UUA", "UUG", "CUU", "CUC", "CUA", "CUG"],
  },
  { name: "赖氨酸", nameEn: "Lysine", threeCode: "Lys", oneCode: "K", codon: ["AAA", "AAG"] },
  { name: "蛋氨酸", nameEn: "Methionine", threeCode: "Met", oneCode: "M", codon: ["AUG"] },
  { name: "苯丙氨酸", nameEn: "Phenylalanine", threeCode: "Phe", oneCode: "F", codon: ["UUU", "UUC"] },
  { name: "脯氨酸", nameEn: "Proline", threeCode: "Pro", oneCode: "P", codon: ["CCU", "CCC", "CCA", "CCG"] },
  {
    name: "丝氨酸",
    nameEn: "Serine",
    threeCode: "Ser",
    oneCode: "S",
    codon: ["UCU", "UCC", "UCA", "UCG", "AGU", "AGC"],
  },
  { name: "苏氨酸", nameEn: "Threonine", threeCode: "Thr", oneCode: "T", codon: ["ACU", "ACC", "ACA", "ACG"] },
  { name: "色氨酸", nameEn: "Tryptophan", threeCode: "Trp", oneCode: "W", codon: ["UGG"] },
  { name: "酪氨酸", nameEn: "Tyrosine", threeCode: "Tyr", oneCode: "Y", codon: ["UAU", "UAC"] },
  { name: "缬氨酸", nameEn: "Valine", threeCode: "Val", oneCode: "V", codon: ["GUU", "GUC", "GUA", "GUG"] },
  { name: "终止密码子", nameEn: "Stop codon", threeCode: "Stop", oneCode: "*", codon: ["UAA", "UAG", "UGA"] },
]

export function AminoAcidTable() {
  const { t, locale } = useI18n()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCodon, setSelectedCodon] = useState<string | null>(null)

  const filteredAminoAcids = aminoAcids.filter(
    (aa) =>
      aa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aa.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aa.threeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aa.oneCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aa.codon.some((codon) => codon.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleCodonClick = (codon: string) => {
    setSelectedCodon(selectedCodon === codon ? null : codon)
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.amino-acid-table.name")}
        </CardTitle>
        <CardDescription className="font-mono">{t("tools.amino-acid-table.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search" className="font-mono">
            {t("common.search")}
          </Label>
          <Input
            id="search"
            placeholder={t("tools.amino-acid-table.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="terminal-input"
          />
        </div>

        {selectedCodon && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="font-mono text-sm">
              <span className="text-muted-foreground">{t("tools.amino-acid-table.selectedCodon")}:</span>{" "}
              <Badge variant="default" className="font-mono">
                {selectedCodon}
              </Badge>
            </div>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="font-mono font-bold">
                    {t("tools.amino-acid-table.aminoAcid")}
                  </TableHead>
                  <TableHead className="font-mono font-bold text-center w-20">
                    {t("tools.amino-acid-table.oneCode")}
                  </TableHead>
                  <TableHead className="font-mono font-bold text-center w-24">
                    {t("tools.amino-acid-table.threeCode")}
                  </TableHead>
                  <TableHead className="font-mono font-bold">
                    {t("tools.amino-acid-table.codons")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAminoAcids.map((aa, index) => (
                  <TableRow
                    key={index}
                    className={`hover:bg-muted/50 transition-colors ${
                      selectedCodon && aa.codon.includes(selectedCodon) ? "bg-primary/10" : ""
                    }`}
                  >
                    <TableCell className="font-mono">
                      <div className="font-medium">{locale === "zh" ? aa.name : aa.nameEn}</div>
                      {locale === "zh" && (
                        <div className="text-xs text-muted-foreground">{aa.nameEn}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`font-mono font-bold ${
                          selectedCodon && aa.codon.includes(selectedCodon) ? "bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        {aa.oneCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`font-mono ${
                          selectedCodon && aa.codon.includes(selectedCodon) ? "bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        {aa.threeCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {aa.codon.map((codon, codonIndex) => (
                          <Badge
                            key={codonIndex}
                            variant={selectedCodon === codon ? "default" : "secondary"}
                            className={`font-mono text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${
                              selectedCodon === codon ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => handleCodonClick(codon)}
                          >
                            {codon}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {filteredAminoAcids.length === 0 && (
          <div className="text-center py-8 text-muted-foreground font-mono">
            {t("tools.amino-acid-table.noResults")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
