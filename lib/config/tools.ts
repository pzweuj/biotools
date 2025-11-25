import type { ToolCategory } from "@/types/tool"
import { DnaIcon } from "@/components/icons/dna-icon"
import { CalculatorIcon } from "@/components/icons/calculator-icon"
import { TableIcon } from "@/components/icons/table-icon"
import { StatsIcon } from "@/components/icons/stats-icon"
import { OrfIcon } from "@/components/icons/orf-icon"
import { ManeLocaIcon } from "@/components/icons/maneloca-icon"
import { DeepHpoIcon } from "@/components/icons/deephpo-icon"
import { WarfarinIcon } from "@/components/icons/warfarin-icon"
import { IndexCheckerIcon } from "@/components/icons/index-checker-icon"
import { AaConverterIcon } from "@/components/icons/aa-converter-icon"
import { MutalyzerIcon } from "@/components/icons/mutalyzer-icon"
import { SequencingDepthIcon } from "@/components/icons/sequencing-depth-icon"
import { CodonOptimizerIcon } from "@/components/icons/codon-optimizer-icon"
import { SgRNAIcon } from "@/components/icons/sgrna-icon"
import { TmbCalculatorIcon } from "@/components/icons/tmb-calculator-icon"
import { BaseComplement } from "@/components/tools/base-complement"
import { TmCalculator } from "@/components/tools/tm-calculator"
import { AminoAcidTable } from "@/components/tools/amino-acid-table"
import { BlosumMatrix } from "@/components/tools/blosum-matrix"
import { SequenceStats } from "@/components/tools/sequence-stats"
import { SequenceTranslationOrf } from "@/components/tools/sequence-translation-orf"
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
import { ProteinPurificationCalculator } from "@/components/tools/protein-purification-calculator"
import { ManeLoca } from "@/components/tools/maneloca"
import { DeepHpo } from "@/components/tools/deephpo"
import { WarfarinCalculator } from "@/components/tools/warfarin-calculator"
import { IndexChecker } from "@/components/tools/index-checker"
import { AaConverter } from "@/components/tools/aa-converter"
import { Mutalyzer } from "@/components/tools/mutalyzer"
import { SequencingDepthCalculator } from "@/components/tools/sequencing-depth-calculator"
import { CodonOptimizer } from "@/components/tools/codon-optimizer"
import { SgRNADesigner } from "@/components/tools/sgrna-designer"
import { TmbCalculator } from "@/components/tools/tmb-calculator"
import { SerialDilutionCalculator } from "@/components/tools/serial-dilution-calculator"
import { SerialDilutionIcon } from "@/components/icons/serial-dilution-icon"
import { PcrMasterMixCalculator } from "@/components/tools/pcr-master-mix-calculator"
import { PcrIcon } from "@/components/icons/pcr-icon"
import { StandardCurveFitting } from "@/components/tools/standard-curve-fitting"
import { CurveIcon } from "@/components/icons/curve-icon"
import { GcSkewAnalyzer } from "@/components/tools/gc-skew-analyzer"
import { GcSkewIcon } from "@/components/icons/gc-skew-icon"

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
        id: "base-complement",
        nameKey: "tools.base-complement.name",
        descriptionKey: "tools.base-complement.description",
        category: "sequence-analysis",
        icon: DnaIcon,
        component: BaseComplement,
      },
      {
        id: "sequence-translation-orf",
        nameKey: "tools.sequence-translation-orf.name",
        descriptionKey: "tools.sequence-translation-orf.description",
        category: "sequence-analysis",
        icon: DnaIcon,
        component: SequenceTranslationOrf,
      },
      {
        id: "codon-optimizer",
        nameKey: "tools.codon-optimizer.name",
        descriptionKey: "tools.codon-optimizer.description",
        category: "sequence-analysis",
        icon: CodonOptimizerIcon,
        component: CodonOptimizer,
      },
      {
        id: "gc-skew-analyzer",
        nameKey: "tools.gc-skew.name",
        descriptionKey: "tools.gc-skew.description",
        category: "sequence-analysis",
        icon: GcSkewIcon,
        component: GcSkewAnalyzer,
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
      {
        id: "aa-converter",
        nameKey: "tools.aa-converter.name",
        descriptionKey: "tools.aa-converter.description",
        category: "molecular-biology",
        icon: AaConverterIcon,
        component: AaConverter,
      },
      {
        id: "sgrna-designer",
        nameKey: "tools.sgrna-designer.name",
        descriptionKey: "tools.sgrna-designer.description",
        category: "molecular-biology",
        icon: SgRNAIcon,
        component: SgRNADesigner,
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
      {
        id: "pcr-master-mix-calculator",
        nameKey: "tools.pcr-master-mix.name",
        descriptionKey: "tools.pcr-master-mix.description",
        category: "primer-design",
        icon: PcrIcon,
        component: PcrMasterMixCalculator,
      },
    ],
  },
  {
    id: "data-processing",
    nameKey: "categories.data-processing",
    tools: [
      {
        id: "index-checker",
        nameKey: "tools.index-checker.name",
        descriptionKey: "tools.index-checker.description",
        category: "data-processing",
        icon: IndexCheckerIcon,
        component: IndexChecker,
      },
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
      {
        id: "sequencing-depth-calculator",
        nameKey: "tools.sequencing-depth.name",
        descriptionKey: "tools.sequencing-depth.description",
        category: "data-processing",
        icon: SequencingDepthIcon,
        component: SequencingDepthCalculator,
      },
      {
        id: "tmb-calculator",
        nameKey: "tools.tmbCalculator.name",
        descriptionKey: "tools.tmbCalculator.description",
        category: "data-processing",
        icon: TmbCalculatorIcon,
        component: TmbCalculator,
      },
      {
        id: "standard-curve-fitting",
        nameKey: "tools.standard-curve.name",
        descriptionKey: "tools.standard-curve.description",
        category: "data-processing",
        icon: CurveIcon,
        component: StandardCurveFitting,
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
      {
        id: "protein-purification-calculator",
        nameKey: "tools.protein-purification.name",
        descriptionKey: "tools.protein-purification.description",
        category: "laboratory-calculations",
        icon: CalculatorIcon,
        component: ProteinPurificationCalculator,
      },
      {
        id: "serial-dilution-calculator",
        nameKey: "tools.serial-dilution.name",
        descriptionKey: "tools.serial-dilution.description",
        category: "laboratory-calculations",
        icon: SerialDilutionIcon,
        component: SerialDilutionCalculator,
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
      {
        id: "blosum-matrix",
        nameKey: "tools.blosum-matrix.name",
        descriptionKey: "tools.blosum-matrix.description",
        category: "reference-tables",
        icon: TableIcon,
        component: BlosumMatrix,
      },
    ],
  },
  {
    id: "external-tools",
    nameKey: "categories.external-tools",
    tools: [
      {
        id: "maneloca",
        nameKey: "tools.maneloca.name",
        descriptionKey: "tools.maneloca.description",
        category: "external-tools",
        icon: ManeLocaIcon,
        component: ManeLoca,
      },
      {
        id: "deephpo",
        nameKey: "tools.deephpo.name",
        descriptionKey: "tools.deephpo.description",
        category: "external-tools",
        icon: DeepHpoIcon,
        component: DeepHpo,
      },
      {
        id: "warfarin",
        nameKey: "tools.warfarin.name",
        descriptionKey: "tools.warfarin.description",
        category: "external-tools",
        icon: WarfarinIcon,
        component: WarfarinCalculator,
      },
      {
        id: "mutalyzer",
        nameKey: "tools.mutalyzer.name",
        descriptionKey: "tools.mutalyzer.description",
        category: "external-tools",
        icon: MutalyzerIcon,
        component: Mutalyzer,
      },
    ],
  },
]
