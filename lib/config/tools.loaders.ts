// 工具组件懒加载器 — 每个工具单独 chunk，按需下载。
// next/dynamic 在 client component 中使用；首屏 bundle 不包含任何工具实现。

import dynamic from "next/dynamic"
import type { ComponentType } from "react"

const Loading = () => null // 由 ToolDisplay 包裹层负责显示骨架

const dyn = (loader: () => Promise<{ [k: string]: ComponentType }>, name: string) =>
  dynamic(() => loader().then((m) => ({ default: m[name] as ComponentType })), {
    ssr: false,
    loading: Loading,
  })

export const TOOL_LOADERS: Record<string, ComponentType> = {
  // sequence-analysis
  "sequence-stats": dyn(() => import("@/components/tools/sequence-stats"), "SequenceStats"),
  "base-complement": dyn(() => import("@/components/tools/base-complement"), "BaseComplement"),
  "sequence-translation-orf": dyn(() => import("@/components/tools/sequence-translation-orf"), "SequenceTranslationOrf"),
  "codon-optimizer": dyn(() => import("@/components/tools/codon-optimizer"), "CodonOptimizer"),
  "gc-skew-analyzer": dyn(() => import("@/components/tools/gc-skew-analyzer"), "GcSkewAnalyzer"),

  // molecular-biology
  "molecular-weight-calculator": dyn(() => import("@/components/tools/molecular-weight-calculator"), "MolecularWeightCalculator"),
  "restriction-enzymes": dyn(() => import("@/components/tools/restriction-enzymes-tool"), "RestrictionEnzymesTool"),
  "protein-analysis": dyn(() => import("@/components/tools/protein-analysis-tool"), "ProteinAnalysisTool"),
  "aa-converter": dyn(() => import("@/components/tools/aa-converter"), "AaConverter"),
  "sgrna-designer": dyn(() => import("@/components/tools/sgrna-designer"), "SgRNADesigner"),

  // primer-design
  "tm-calculator": dyn(() => import("@/components/tools/tm-calculator"), "TmCalculator"),
  "primer-dimer-detector": dyn(() => import("@/components/tools/primer-dimer-detector"), "PrimerDimerDetector"),
  "pcr-product-calculator": dyn(() => import("@/components/tools/pcr-product-calculator"), "PCRProductCalculator"),
  "pcr-master-mix-calculator": dyn(() => import("@/components/tools/pcr-master-mix-calculator"), "PcrMasterMixCalculator"),

  // data-processing
  "index-checker": dyn(() => import("@/components/tools/index-checker"), "IndexChecker"),
  "sequence-format-converter": dyn(() => import("@/components/tools/sequence-format-converter"), "SequenceFormatConverter"),
  "qpcr-data-analyzer": dyn(() => import("@/components/tools/qpcr-data-analyzer"), "QpcrDataAnalyzer"),
  "qpcr-fluorescence-channel-tool": dyn(() => import("@/components/tools/qpcr-fluorescence-channel-tool"), "QpcrFluorescenceChannelTool"),
  "gel-electrophoresis-analyzer": dyn(() => import("@/components/tools/gel-electrophoresis-analyzer"), "GelElectrophoresisAnalyzer"),
  "sequencing-depth-calculator": dyn(() => import("@/components/tools/sequencing-depth-calculator"), "SequencingDepthCalculator"),
  "tmb-calculator": dyn(() => import("@/components/tools/tmb-calculator"), "TmbCalculator"),
  "standard-curve-fitting": dyn(() => import("@/components/tools/standard-curve-fitting"), "StandardCurveFitting"),

  // laboratory-calculations
  "buffer-calculator": dyn(() => import("@/components/tools/buffer-calculator"), "BufferCalculator"),
  "cell-culture-calculator": dyn(() => import("@/components/tools/cell-culture-calculator"), "CellCultureCalculator"),
  "protein-purification-calculator": dyn(() => import("@/components/tools/protein-purification-calculator"), "ProteinPurificationCalculator"),
  "serial-dilution-calculator": dyn(() => import("@/components/tools/serial-dilution-calculator"), "SerialDilutionCalculator"),

  // reference-tables
  "amino-acid-table": dyn(() => import("@/components/tools/amino-acid-table"), "AminoAcidTable"),
  "amino-acid-matrix": dyn(() => import("@/components/tools/amino-acid-matrix"), "AminoAcidMatrix"),

  // external-tools
  "maneloca": dyn(() => import("@/components/tools/maneloca"), "ManeLoca"),
  "deephpo": dyn(() => import("@/components/tools/deephpo"), "DeepHpo"),
  "warfarin": dyn(() => import("@/components/tools/warfarin-calculator"), "WarfarinCalculator"),
  "mutalyzer": dyn(() => import("@/components/tools/mutalyzer"), "Mutalyzer"),
  "spliceai": dyn(() => import("@/components/tools/spliceai"), "SpliceAI"),
  "transvar": dyn(() => import("@/components/tools/transvar"), "TransVar"),
}
