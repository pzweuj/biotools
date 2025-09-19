import type { ToolCategory } from "@/types/tool"
import { DnaIcon } from "@/components/icons/dna-icon"
import { CalculatorIcon } from "@/components/icons/calculator-icon"
import { TableIcon } from "@/components/icons/table-icon"
import { StatsIcon } from "@/components/icons/stats-icon"
import { OrfIcon } from "@/components/icons/orf-icon"
import { BaseComplement } from "@/components/tools/base-complement"
import { TmCalculator } from "@/components/tools/tm-calculator"
import { AminoAcidTable } from "@/components/tools/amino-acid-table"
import { SequenceStats } from "@/components/tools/sequence-stats"
import { OrfFinder } from "@/components/tools/orf-finder"
import { SequenceTranslation } from "@/components/tools/sequence-translation"
import { PrimerDimerDetector } from "@/components/tools/primer-dimer-detector"
import { PCRProductCalculator } from "@/components/tools/pcr-product-calculator"
import { MolecularWeightCalculator } from "@/components/tools/molecular-weight-calculator"
import { RestrictionEnzymesTool } from "@/components/tools/restriction-enzymes-tool"
import { ProteinAnalysisTool } from "@/components/tools/protein-analysis-tool"
import { SequenceFormatConverter } from "@/components/tools/sequence-format-converter"
import { QpcrDataAnalyzer } from "@/components/tools/qpcr-data-analyzer"
import { QpcrFluorescenceChannelTool } from "@/components/tools/qpcr-fluorescence-channel-tool"
import { GelElectrophoresisAnalyzer } from "@/components/tools/gel-electrophoresis-analyzer"
import { BufferCalculator } from "@/components/tools/buffer-calculator"
import { CellCultureCalculator } from "@/components/tools/cell-culture-calculator"

export const getToolCategories = (): ToolCategory[] => [
  {
    id: "sequence-analysis",
    nameKey: "categories.sequence-analysis",
    tools: [
      {
        id: "sequence-stats",
        nameKey: "tools.sequence-stats.name",
        descriptionKey: "tools.sequence-stats.description",
        category: "sequence-analysis",
        icon: StatsIcon,
        component: SequenceStats,
      },
      {
        id: "orf-finder",
        nameKey: "tools.orf-finder.name",
        descriptionKey: "tools.orf-finder.description",
        category: "sequence-analysis",
        icon: OrfIcon,
        component: OrfFinder,
      },
      {
        id: "base-complement",
        nameKey: "tools.base-complement.name",
        descriptionKey: "tools.base-complement.description",
        category: "sequence-analysis",
        icon: DnaIcon,
        component: BaseComplement,
      },
      {
        id: "sequence-translation",
        nameKey: "tools.sequence-translation.name",
        descriptionKey: "tools.sequence-translation.description",
        category: "sequence-analysis",
        icon: DnaIcon,
        component: SequenceTranslation,
      },
    ],
  },
  {
    id: "primer-design",
    nameKey: "categories.primer-design",
    tools: [
      {
        id: "tm-calculator",
        nameKey: "tools.tm-calculator.name",
        descriptionKey: "tools.tm-calculator.description",
        category: "primer-design",
        icon: CalculatorIcon,
        component: TmCalculator,
      },
      {
        id: "primer-dimer-detector",
        nameKey: "tools.primer-dimer-detector.name",
        descriptionKey: "tools.primer-dimer-detector.description",
        category: "primer-design",
        icon: DnaIcon,
        component: PrimerDimerDetector,
      },
      {
        id: "pcr-product-calculator",
        nameKey: "tools.pcr-product-calculator.name",
        descriptionKey: "tools.pcr-product-calculator.description",
        category: "primer-design",
        icon: CalculatorIcon,
        component: PCRProductCalculator,
      },
    ],
  },
  {
    id: "molecular-biology",
    nameKey: "categories.molecular-biology",
    tools: [
      {
        id: "molecular-weight-calculator",
        nameKey: "tools.molecular-weight-calculator.name",
        descriptionKey: "tools.molecular-weight-calculator.description",
        category: "molecular-biology",
        icon: CalculatorIcon,
        component: MolecularWeightCalculator,
      },
      {
        id: "restriction-enzymes",
        nameKey: "tools.restriction-enzymes.name",
        descriptionKey: "tools.restriction-enzymes.description",
        category: "molecular-biology",
        icon: DnaIcon,
        component: RestrictionEnzymesTool,
      },
      {
        id: "protein-analysis",
        nameKey: "tools.protein-analysis.name",
        descriptionKey: "tools.protein-analysis.description",
        category: "molecular-biology",
        icon: CalculatorIcon,
        component: ProteinAnalysisTool,
      },
    ],
  },
  {
    id: "data-processing",
    nameKey: "categories.data-processing",
    tools: [
      {
        id: "sequence-format-converter",
        nameKey: "tools.sequence-format-converter.name",
        descriptionKey: "tools.sequence-format-converter.description",
        category: "data-processing",
        icon: DnaIcon,
        component: SequenceFormatConverter,
      },
      {
        id: "qpcr-data-analyzer",
        nameKey: "tools.qpcr-data-analyzer.name",
        descriptionKey: "tools.qpcr-data-analyzer.description",
        category: "data-processing",
        icon: CalculatorIcon,
        component: QpcrDataAnalyzer,
      },
      {
        id: "qpcr-fluorescence-channel-tool",
        nameKey: "tools.qpcr-fluorescence.name",
        descriptionKey: "tools.qpcr-fluorescence.description",
        category: "data-processing",
        icon: DnaIcon,
        component: QpcrFluorescenceChannelTool,
      },
      {
        id: "gel-electrophoresis-analyzer",
        nameKey: "tools.gel-electrophoresis.name",
        descriptionKey: "tools.gel-electrophoresis.description",
        category: "data-processing",
        icon: CalculatorIcon,
        component: GelElectrophoresisAnalyzer,
      },
    ],
  },
  {
    id: "laboratory-calculations",
    nameKey: "categories.laboratory-calculations",
    tools: [
      {
        id: "buffer-calculator",
        nameKey: "tools.buffer-calculator.name",
        descriptionKey: "tools.buffer-calculator.description",
        category: "laboratory-calculations",
        icon: CalculatorIcon,
        component: BufferCalculator,
      },
      {
        id: "cell-culture-calculator",
        nameKey: "tools.cell-culture-calculator.name",
        descriptionKey: "tools.cell-culture-calculator.description",
        category: "laboratory-calculations",
        icon: CalculatorIcon,
        component: CellCultureCalculator,
      },
    ],
  },
  {
    id: "reference-tables",
    nameKey: "categories.reference-tables",
    tools: [
      {
        id: "amino-acid-table",
        nameKey: "tools.amino-acid-table.name",
        descriptionKey: "tools.amino-acid-table.description",
        category: "reference-tables",
        icon: TableIcon,
        component: AminoAcidTable,
      },
    ],
  },
]
