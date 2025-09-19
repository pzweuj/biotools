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
