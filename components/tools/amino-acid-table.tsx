"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

  const filteredAminoAcids = aminoAcids.filter(
    (aa) =>
      aa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aa.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aa.threeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aa.oneCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aa.codon.some((codon) => codon.toLowerCase().includes(searchTerm.toLowerCase())),
  )

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

        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {filteredAminoAcids.map((aa, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors geek-card"
            >
              <div className="flex-1">
                <div className="font-medium font-mono">{locale === "zh" ? aa.name : aa.nameEn}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {t("tools.amino-acid-table.oneCode")}: <span className="font-bold">{aa.oneCode}</span>
                  {" • "}
                  {t("tools.amino-acid-table.threeCode")}: <span className="font-bold">{aa.threeCode}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {aa.codon.map((codon, codonIndex) => (
                  <Badge key={codonIndex} variant="secondary" className="font-mono text-xs">
                    {codon}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
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
