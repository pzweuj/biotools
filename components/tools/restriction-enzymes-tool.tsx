"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Beaker, Scissors } from "lucide-react"
import { useI18n } from "@/lib/i18n"

// Minimal client-side enzyme database (extendable)
// pattern uses IUPAC codes; we compile to regex for search on both strands
const ENZYMES: Array<{ 
  name: string
  site: string // recognition pattern e.g. GAATTC
  cuts: { top: number, bottom: number } // cut position relative to site start (0-based)
  overhang: "5'" | "3'" | "blunt"
}> = [
  { name: "EcoRI", site: "GAATTC", cuts: { top: 1, bottom: 5 }, overhang: "5'" },
  { name: "BamHI", site: "GGATCC", cuts: { top: 1, bottom: 5 }, overhang: "5'" },
  { name: "XhoI", site: "CTCGAG", cuts: { top: 1, bottom: 5 }, overhang: "5'" },
  { name: "HindIII", site: "AAGCTT", cuts: { top: 1, bottom: 5 }, overhang: "5'" },
  { name: "PstI", site: "CTGCAG", cuts: { top: 5, bottom: 1 }, overhang: "3'" },
  { name: "SmaI", site: "CCCGGG", cuts: { top: 3, bottom: 3 }, overhang: "blunt" },
]

const IUPAC: Record<string, string> = {
  A: "A", C: "C", G: "G", T: "T",
  R: "AG", Y: "CT", S: "GC", W: "AT", K: "GT", M: "AC",
  B: "CGT", D: "AGT", H: "ACT", V: "ACG", N: "ACGT",
}

function rc(seq: string): string {
  const map: any = { A: "T", T: "A", G: "C", C: "G", a: "t", t: "a", g: "c", c: "g" }
  return seq.split("").reverse().map((c) => map[c] || c).join("")
}

function compilePattern(site: string): RegExp {
  // convert IUPAC string to regex character classes
  const pattern = site.toUpperCase().split("").map((c) => {
    const set = IUPAC[c]
    return set && set.length > 1 ? `[${set}]` : c
  }).join("")
  return new RegExp(pattern, "g")
}

type CutSite = {
  enzyme: string
  start: number // match start on forward strand
  end: number
  topCut: number // genomic index of top cut
  bottomCut: number // genomic index of bottom cut
  strand: "+" | "-"
  overhang: "5'" | "3'" | "blunt"
}

type Fragment = { start: number; end: number; length: number }

export function RestrictionEnzymesTool() {
  const { t } = useI18n()
  const [sequence, setSequence] = useState("")
  const [isCircular, setIsCircular] = useState(true)
  const [selected, setSelected] = useState<string[]>(["EcoRI"]) // selected enzymes

  // cloning planner inputs
  const [vectorSeq, setVectorSeq] = useState("")
  const [insertSeq, setInsertSeq] = useState("")
  const [vectorEnz, setVectorEnz] = useState("EcoRI")
  const [insertEnz, setInsertEnz] = useState("EcoRI")

  const cleanSeq = useMemo(() => sequence.toUpperCase().replace(/[^ACGT]/g, ""), [sequence])

  const sites: CutSite[] = useMemo(() => {
    const res: CutSite[] = []
    if (!cleanSeq) return res
    ENZYMES.filter(e => selected.includes(e.name)).forEach((e) => {
      const re = compilePattern(e.site)
      // forward strand
      let m: RegExpExecArray | null
      while ((m = re.exec(cleanSeq)) !== null) {
        const start = m.index
        const end = start + e.site.length
        res.push({
          enzyme: e.name,
          start,
          end,
          topCut: start + e.cuts.top,
          bottomCut: start + e.cuts.bottom,
          strand: "+",
          overhang: e.overhang,
        })
        // avoid infinite loops for zero-length
        if (re.lastIndex === m.index) re.lastIndex++
      }
      // reverse complement strand: find on rc and map back
      const seqRC = rc(cleanSeq)
      const reRC = compilePattern(e.site)
      while ((m = reRC.exec(seqRC)) !== null) {
        const rcStart = m.index
        const rcEnd = rcStart + e.site.length
        // map RC indices back to forward coordinates
        const start = cleanSeq.length - rcEnd
        const end = cleanSeq.length - rcStart
        // cut offsets mirror on reverse
        const topCut = start + (e.site.length - 1 - e.cuts.bottom)
        const bottomCut = start + (e.site.length - 1 - e.cuts.top)
        res.push({ enzyme: e.name, start, end, topCut, bottomCut, strand: "-", overhang: e.overhang })
        if (reRC.lastIndex === m.index) reRC.lastIndex++
      }
    })
    // sort by position
    return res.sort((a, b) => a.topCut - b.topCut)
  }, [cleanSeq, selected])

  const fragments: Fragment[] = useMemo(() => {
    const cuts = sites.map(s => s.topCut).sort((a, b) => a - b)
    const L = cleanSeq.length
    if (L === 0) return []
    if (cuts.length === 0) return [{ start: 0, end: L, length: L }]
    const frags: Fragment[] = []
    if (isCircular) {
      for (let i = 0; i < cuts.length; i++) {
        const a = cuts[i]
        const b = cuts[(i + 1) % cuts.length]
        const len = (b - a + L) % L
        frags.push({ start: a, end: b, length: len || L })
      }
    } else {
      frags.push({ start: 0, end: cuts[0], length: cuts[0] })
      for (let i = 0; i < cuts.length - 1; i++) {
        frags.push({ start: cuts[i], end: cuts[i + 1], length: cuts[i + 1] - cuts[i] })
      }
      frags.push({ start: cuts[cuts.length - 1], end: L, length: L - cuts[cuts.length - 1] })
    }
    return frags.sort((a, b) => b.length - a.length)
  }, [sites, isCircular, cleanSeq])

  // Simple SVG circular map
  const MapSVG = () => {
    const L = cleanSeq.length
    if (!L) return null
    const R = 100
    const center = 120
    const stroke = 10
    const angle = (pos: number) => (pos / L) * 2 * Math.PI - Math.PI / 2
    const toXY = (pos: number) => {
      const a = angle(pos)
      return { x: center + R * Math.cos(a), y: center + R * Math.sin(a) }
    }
    return (
      <svg width={center * 2} height={center * 2} className="mx-auto">
        <circle cx={center} cy={center} r={R} fill="none" stroke="#bbb" strokeWidth={stroke} />
        {sites.map((s, idx) => {
          const p = toXY(s.topCut)
          return <g key={idx}>
            <line x1={p.x} y1={p.y} x2={center} y2={center} stroke="#ef4444" strokeWidth={1} />
            <text x={p.x} y={p.y} dx={4} dy={-4} fontSize={10} className="fill-foreground">{s.enzyme}</text>
          </g>
        })}
      </svg>
    )
  }

  // Basic cloning compatibility: compare overhang and sticky-end sequence
  function digestEnds(seq: string, enzName: string) {
    const e = ENZYMES.find(x => x.name === enzName)
    if (!e) return null
    const re = compilePattern(e.site)
    const m = re.exec(seq)
    if (!m) return null
    const start = m.index
    const topCut = start + e.cuts.top
    const bottomCut = start + e.cuts.bottom
    // derive overhang sequence for first match only (demo)
    if (e.overhang === "blunt") return { type: "blunt", seq5: "", seq3: "" }
    if (e.overhang === "5'") {
      const over = seq.substring(topCut, bottomCut)
      return { type: "5'", seq5: over, seq3: rc(over) }
    } else {
      const over = seq.substring(bottomCut, topCut)
      return { type: "3'", seq5: rc(over), seq3: over }
    }
  }

  function checkCloningCompatibility() {
    const v = vectorSeq.toUpperCase().replace(/[^ACGT]/g, "")
    const ins = insertSeq.toUpperCase().replace(/[^ACGT]/g, "")
    if (!v || !ins) return { ok: false, reason: t("tools.restriction-enzymes.tool.needSeq", "Provide sequences") }
    const vEnd = digestEnds(v, vectorEnz)
    const iEnd = digestEnds(ins, insertEnz)
    if (!vEnd || !iEnd) return { ok: false, reason: t("tools.restriction-enzymes.tool.noSite", "Site not found in sequence") }
    if (vEnd.type === "blunt" && iEnd.type === "blunt") return { ok: true, reason: t("tools.restriction-enzymes.tool.bluntOk", "Blunt ends ligate, lower efficiency") }
    if (vEnd.type !== iEnd.type) return { ok: false, reason: t("tools.restriction-enzymes.tool.typeMismatch", "Overhang type mismatch") }
    // require complementary overhangs
    if (vEnd.seq5 && iEnd.seq5 && vEnd.seq5 === rc(iEnd.seq5)) return { ok: true, reason: t("tools.restriction-enzymes.tool.stickyOk", "Sticky ends are compatible") }
    return { ok: false, reason: t("tools.restriction-enzymes.tool.seqMismatch", "Overhang sequences are not compatible") }
  }

  const cloneCheck = useMemo(checkCloningCompatibility, [vectorSeq, insertSeq, vectorEnz, insertEnz])

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.restriction-enzymes.name", "Restriction Enzyme Tool")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.restriction-enzymes.description", "Find common sites, render digestion map, multi-enzyme analysis, and basic cloning planning")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sequence and enzymes */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Scissors className="w-4 h-4 mr-2" />
              {t("tools.restriction-enzymes.analysis", "Restriction Analysis")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="font-mono">{t("tools.restriction-enzymes.sequence", "Input DNA Sequence")}</Label>
                <Textarea value={sequence} onChange={(e) => setSequence(e.target.value)} rows={6} className="terminal-input font-mono" placeholder="ATGC..." />
                <div className="text-xs text-muted-foreground font-mono mt-1">{cleanSeq.length} bp</div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.restriction-enzymes.enzymes", "Select Enzymes")}</Label>
                <div className="grid grid-cols-2 gap-2 p-2 rounded-md border">
                  {ENZYMES.map(e => (
                    <label key={e.name} className="flex items-center gap-2 font-mono text-sm">
                      <Checkbox checked={selected.includes(e.name)} onCheckedChange={(v) => {
                        setSelected(prev => v ? Array.from(new Set([...prev, e.name])) : prev.filter(x => x !== e.name))
                      }} />
                      {e.name}
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 font-mono text-sm">
                  <Checkbox checked={isCircular} onCheckedChange={(v) => setIsCircular(Boolean(v))} />
                  {t("tools.restriction-enzymes.circular", "Circular DNA")}
                </label>
              </div>
            </div>

            {/* Map and sites table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <MapSVG />
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono">{t("tools.restriction-enzymes.enzyme", "Enzyme")}</TableHead>
                      <TableHead className="font-mono text-center">{t("tools.restriction-enzymes.position", "Position")}</TableHead>
                      <TableHead className="font-mono text-center">{t("tools.restriction-enzymes.strand", "Strand")}</TableHead>
                      <TableHead className="font-mono text-center">{t("tools.restriction-enzymes.overhang", "Overhang")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((s, i) => (
                      <TableRow key={`${s.enzyme}-${s.topCut}-${i}`}>
                        <TableCell className="font-mono">{s.enzyme}</TableCell>
                        <TableCell className="font-mono text-center">{s.topCut + 1}</TableCell>
                        <TableCell className="font-mono text-center">{s.strand}</TableCell>
                        <TableCell className="font-mono text-center">{s.overhang}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Fragments */}
            <div className="space-y-2">
              <Label className="font-mono">{t("tools.restriction-enzymes.fragments", "Fragments")}</Label>
              <div className="flex flex-wrap gap-2">
                {fragments.map((f, idx) => (
                  <Badge key={idx} variant="outline" className="font-mono">{f.length} bp</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cloning planner */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Beaker className="w-4 h-4 mr-2" />
              {t("tools.restriction-enzymes.cloning", "Cloning Planner")}
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              {t("tools.restriction-enzymes.cloneHint", "Choose enzymes and check sticky/blunt-end compatibility")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.restriction-enzymes.vector", "Vector Sequence")}</Label>
                <Textarea rows={4} className="terminal-input font-mono" value={vectorSeq} onChange={(e) => setVectorSeq(e.target.value)} />
                <div className="flex items-center gap-2">
                  <Label className="font-mono text-xs">{t("tools.restriction-enzymes.enzyme", "Enzyme")}</Label>
                  <Select value={vectorEnz} onValueChange={setVectorEnz}>
                    <SelectTrigger className="font-mono w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENZYMES.map(e => <SelectItem key={e.name} value={e.name} className="font-mono">{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.restriction-enzymes.insert", "Insert Sequence")}</Label>
                <Textarea rows={4} className="terminal-input font-mono" value={insertSeq} onChange={(e) => setInsertSeq(e.target.value)} />
                <div className="flex items-center gap-2">
                  <Label className="font-mono text-xs">{t("tools.restriction-enzymes.enzyme", "Enzyme")}</Label>
                  <Select value={insertEnz} onValueChange={setInsertEnz}>
                    <SelectTrigger className="font-mono w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENZYMES.map(e => <SelectItem key={e.name} value={e.name} className="font-mono">{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Alert>
              <AlertDescription className="font-mono text-sm">
                {cloneCheck.ok ? t("tools.restriction-enzymes.compatible", "Compatible for ligation") : t("tools.restriction-enzymes.incompatible", "Not compatible")}
                {": "}{cloneCheck.reason}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

export default RestrictionEnzymesTool
