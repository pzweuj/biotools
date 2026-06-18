// 工具元数据 — 纯数据，不引用任何工具组件实现
// 这是 sidebar / sitemap / 首页索引的唯一信息源。
// 工具组件实现在 tools.loaders.ts 中按 id 懒加载。

import type { ToolMetaCategory } from "@/types/tool"
import { DnaIcon } from "@/components/icons/dna-icon"
import { CalculatorIcon } from "@/components/icons/calculator-icon"
import { TableIcon } from "@/components/icons/table-icon"
import { StatsIcon } from "@/components/icons/stats-icon"
import { ManeLocaIcon } from "@/components/icons/maneloca-icon"
import { DeepHpoIcon } from "@/components/icons/deephpo-icon"
import { WarfarinIcon } from "@/components/icons/warfarin-icon"
import { IndexCheckerIcon } from "@/components/icons/index-checker-icon"
import { AaConverterIcon } from "@/components/icons/aa-converter-icon"
import { MutalyzerIcon } from "@/components/icons/mutalyzer-icon"
import { SpliceAIIcon } from "@/components/icons/spliceai-icon"
import { TransVarIcon } from "@/components/icons/transvar-icon"
import { SequencingDepthIcon } from "@/components/icons/sequencing-depth-icon"
import { CodonOptimizerIcon } from "@/components/icons/codon-optimizer-icon"
import { SgRNAIcon } from "@/components/icons/sgrna-icon"
import { TmbCalculatorIcon } from "@/components/icons/tmb-calculator-icon"
import { SerialDilutionIcon } from "@/components/icons/serial-dilution-icon"
import { PcrIcon } from "@/components/icons/pcr-icon"
import { CurveIcon } from "@/components/icons/curve-icon"
import { GcSkewIcon } from "@/components/icons/gc-skew-icon"

export const TOOL_CATEGORIES: ToolMetaCategory[] = [
  {
    id: "sequence-analysis",
    nameKey: "categories.sequence-analysis",
    tools: [
      { id: "sequence-stats", nameKey: "tools.sequence-stats.name", descriptionKey: "tools.sequence-stats.description", category: "sequence-analysis", icon: StatsIcon },
      { id: "base-complement", nameKey: "tools.base-complement.name", descriptionKey: "tools.base-complement.description", category: "sequence-analysis", icon: DnaIcon },
      { id: "sequence-translation-orf", nameKey: "tools.sequence-translation-orf.name", descriptionKey: "tools.sequence-translation-orf.description", category: "sequence-analysis", icon: DnaIcon },
      { id: "codon-optimizer", nameKey: "tools.codon-optimizer.name", descriptionKey: "tools.codon-optimizer.description", category: "sequence-analysis", icon: CodonOptimizerIcon },
      { id: "gc-skew-analyzer", nameKey: "tools.gc-skew.name", descriptionKey: "tools.gc-skew.description", category: "sequence-analysis", icon: GcSkewIcon },
    ],
  },
  {
    id: "molecular-biology",
    nameKey: "categories.molecular-biology",
    tools: [
      { id: "molecular-weight-calculator", nameKey: "tools.molecular-weight-calculator.name", descriptionKey: "tools.molecular-weight-calculator.description", category: "molecular-biology", icon: CalculatorIcon },
      { id: "restriction-enzymes", nameKey: "tools.restriction-enzymes.name", descriptionKey: "tools.restriction-enzymes.description", category: "molecular-biology", icon: DnaIcon },
      { id: "protein-analysis", nameKey: "tools.protein-analysis.name", descriptionKey: "tools.protein-analysis.description", category: "molecular-biology", icon: CalculatorIcon },
      { id: "aa-converter", nameKey: "tools.aa-converter.name", descriptionKey: "tools.aa-converter.description", category: "molecular-biology", icon: AaConverterIcon },
      { id: "sgrna-designer", nameKey: "tools.sgrna-designer.name", descriptionKey: "tools.sgrna-designer.description", category: "molecular-biology", icon: SgRNAIcon },
    ],
  },
  {
    id: "primer-design",
    nameKey: "categories.primer-design",
    tools: [
      { id: "tm-calculator", nameKey: "tools.tm-calculator.name", descriptionKey: "tools.tm-calculator.description", category: "primer-design", icon: CalculatorIcon },
      { id: "primer-dimer-detector", nameKey: "tools.primer-dimer-detector.name", descriptionKey: "tools.primer-dimer-detector.description", category: "primer-design", icon: DnaIcon },
      { id: "pcr-product-calculator", nameKey: "tools.pcr-product-calculator.name", descriptionKey: "tools.pcr-product-calculator.description", category: "primer-design", icon: CalculatorIcon },
      { id: "pcr-master-mix-calculator", nameKey: "tools.pcr-master-mix.name", descriptionKey: "tools.pcr-master-mix.description", category: "primer-design", icon: PcrIcon },
    ],
  },
  {
    id: "data-processing",
    nameKey: "categories.data-processing",
    tools: [
      { id: "index-checker", nameKey: "tools.index-checker.name", descriptionKey: "tools.index-checker.description", category: "data-processing", icon: IndexCheckerIcon },
      { id: "sequence-format-converter", nameKey: "tools.sequence-format-converter.name", descriptionKey: "tools.sequence-format-converter.description", category: "data-processing", icon: DnaIcon },
      { id: "qpcr-data-analyzer", nameKey: "tools.qpcr-data-analyzer.name", descriptionKey: "tools.qpcr-data-analyzer.description", category: "data-processing", icon: CalculatorIcon },
      { id: "qpcr-fluorescence-channel-tool", nameKey: "tools.qpcr-fluorescence.name", descriptionKey: "tools.qpcr-fluorescence.description", category: "data-processing", icon: DnaIcon },
      { id: "gel-electrophoresis-analyzer", nameKey: "tools.gel-electrophoresis.name", descriptionKey: "tools.gel-electrophoresis.description", category: "data-processing", icon: CalculatorIcon },
      { id: "sequencing-depth-calculator", nameKey: "tools.sequencing-depth.name", descriptionKey: "tools.sequencing-depth.description", category: "data-processing", icon: SequencingDepthIcon },
      { id: "tmb-calculator", nameKey: "tools.tmbCalculator.name", descriptionKey: "tools.tmbCalculator.description", category: "data-processing", icon: TmbCalculatorIcon },
      { id: "standard-curve-fitting", nameKey: "tools.standard-curve.name", descriptionKey: "tools.standard-curve.description", category: "data-processing", icon: CurveIcon },
    ],
  },
  {
    id: "laboratory-calculations",
    nameKey: "categories.laboratory-calculations",
    tools: [
      { id: "buffer-calculator", nameKey: "tools.buffer-calculator.name", descriptionKey: "tools.buffer-calculator.description", category: "laboratory-calculations", icon: CalculatorIcon },
      { id: "cell-culture-calculator", nameKey: "tools.cell-culture-calculator.name", descriptionKey: "tools.cell-culture-calculator.description", category: "laboratory-calculations", icon: CalculatorIcon },
      { id: "protein-purification-calculator", nameKey: "tools.protein-purification.name", descriptionKey: "tools.protein-purification.description", category: "laboratory-calculations", icon: CalculatorIcon },
      { id: "serial-dilution-calculator", nameKey: "tools.serial-dilution.name", descriptionKey: "tools.serial-dilution.description", category: "laboratory-calculations", icon: SerialDilutionIcon },
    ],
  },
  {
    id: "reference-tables",
    nameKey: "categories.reference-tables",
    tools: [
      { id: "amino-acid-table", nameKey: "tools.amino-acid-table.name", descriptionKey: "tools.amino-acid-table.description", category: "reference-tables", icon: TableIcon },
      { id: "amino-acid-matrix", nameKey: "tools.amino-acid-matrix.name", descriptionKey: "tools.amino-acid-matrix.description", category: "reference-tables", icon: TableIcon },
    ],
  },
  {
    id: "external-tools",
    nameKey: "categories.external-tools",
    tools: [
      { id: "maneloca", nameKey: "tools.maneloca.name", descriptionKey: "tools.maneloca.description", category: "external-tools", icon: ManeLocaIcon, external: true },
      { id: "deephpo", nameKey: "tools.deephpo.name", descriptionKey: "tools.deephpo.description", category: "external-tools", icon: DeepHpoIcon, external: true },
      { id: "warfarin", nameKey: "tools.warfarin.name", descriptionKey: "tools.warfarin.description", category: "external-tools", icon: WarfarinIcon, external: true },
      { id: "mutalyzer", nameKey: "tools.mutalyzer.name", descriptionKey: "tools.mutalyzer.description", category: "external-tools", icon: MutalyzerIcon, external: true },
      { id: "spliceai", nameKey: "tools.spliceai.name", descriptionKey: "tools.spliceai.description", category: "external-tools", icon: SpliceAIIcon, external: true },
      { id: "transvar", nameKey: "tools.transvar.name", descriptionKey: "tools.transvar.description", category: "external-tools", icon: TransVarIcon, external: true },
    ],
  },
]

/** 扁平化所有工具元数据（不含组件） */
export const ALL_TOOL_META = TOOL_CATEGORIES.flatMap((c) => c.tools)

/** 所有工具 id（sitemap / generateStaticParams 使用） */
export const TOOL_IDS = ALL_TOOL_META.map((t) => t.id)
