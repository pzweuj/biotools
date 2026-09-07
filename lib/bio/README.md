# lib/bio — 共享生信工具函数

集中放置序列、字母表、Tm、密码子等纯函数实现。**所有函数均为无副作用、可在 Web Worker 中复用**。

## 设计原则
1. 单次扫描（单 pass）优先于多次正则 — 长序列性能差异可达 10×
2. 所有 API 接受 `string` 输入，返回纯结果（不做 setState）
3. 不依赖 React、不依赖 DOM，可被 worker / Node 测试直接 import
4. 模糊（IUPAC 简并）字符的处理在 alphabet.ts 中集中维护

## 模块
| 文件 | 内容 |
|---|---|
| `alphabet.ts` | DNA/RNA 互补表（含 IUPAC）、氨基酸单字母↔三字母 |
| `sequence.ts` | `cleanSequence` / `complement` / `reverseComplement` / `countBases` / `gcContent` / `atContent` / `shannonEntropy` / `parseFasta` / `toFasta` |
| `coordinates.ts` | `findAllMatches` / `locateForwardPrimer` / `locateReversePrimer` / `locatePrimer` / `computeAmplicon`（引物结合区 -> 基因组坐标，1-based inclusive） |
| `tm.ts` | `tmWallace` / `tmBasicGc` / `tmSaltAdjusted` |
| `tm-nearest-neighbor.ts` | SantaLucia/Allawi DNA/DNA nearest-neighbor Tm (`DNA_NN3`) |
| `codons.ts` | `STANDARD_CODE` / `VERT_MITO_CODE` / `translateDna` |
| `index.ts` | 集中 re-export |

## 近邻热力学模型

`tmNearestNeighbor` 使用 Biopython `Bio.SeqUtils.MeltingTemp.DNA_NN3`（Allawi & SantaLucia 1997）参数表：相邻碱基的 ΔH/ΔS、末端初始化和自互补对称性修正均按该实现计算。盐修正采用 SantaLucia 1998 的熵修正，并使用 von Ahsen 等效单价盐近似处理 Mg²⁺ 与 dNTP：

`Na_eq = (Na⁺ + K⁺) + 120 × √max(Mg²⁺ − dNTP总浓度, 0)`（各浓度为 mM）。

公共接口的 Ct 是两条互补链的总浓度（nM）；非自互补序列使用 Ct/4，自互补序列使用 Ct。默认值为 Ct=250 nM、Na⁺+K⁺=50 mM、Mg²⁺=1.5 mM、dNTP=0.8 mM。该模型用于估算 DNA/DNA 熔解温度，不能替代针对具体聚合酶和缓冲液优化的 PCR 退火温度。

`lib/bio/__tests__/tm.test.ts` 中的数值参考由 Biopython 1.84 `Tm_NN(..., nn_table=DNA_NN3, saltcorr=5)` 生成；非自互补样本按 `dnac1=dnac2=Ct/2`，自互补样本按 `dnac1=Ct, selfcomp=True`，并使用与界面相同的 Na、Mg²⁺、dNTP 和 Ct 条件。

## 后续 TODO
- `alignment.ts` — Smith-Waterman + k-mer 索引
- `enzymes.ts` — 限制酶 Aho-Corasick 自动机扫描
- `restriction.ts` — REBASE 子集
- 后续可把工具组件中的算法迁移到这里以减少代码重复
