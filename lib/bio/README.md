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
| `sequence.ts` | `cleanSequence` / `complement` / `reverseComplement` / `countBases` / `gcContent` / `atContent` / `shannonEntropy` / `parseFasta` / `parseSingleSequenceInput` / `toFasta` |
| `coordinates.ts` | `findAllMatches` / `locateForwardPrimer` / `locateReversePrimer` / `locatePrimer` / `computeAmplicon`（引物结合区 -> 基因组坐标，1-based inclusive；报告含未知碱基而跳过的候选窗口） |
| `tm.ts` | `tmWallace` / `tmBasicGc` / `tmSaltAdjusted` |
| `tm-nearest-neighbor.ts` | SantaLucia/Allawi DNA/DNA nearest-neighbor Tm (`DNA_NN3`) |
| `codons.ts` | `STANDARD_CODE` / `VERT_MITO_CODE` / `translateDna` |
| `molecular-weight.ts` | Protein free-amino-acid and OH-terminated DNA/RNA mass conventions |
| `linear-regression.ts` | Centered OLS with finite-input, constant-X and constant-Y diagnostics |
| `primer-dimer.ts` | Exhaustive antiparallel Watson–Crick complementarity screen |
| `restriction.ts` | IUPAC recognition-site scan with 0-based inter-base cut coordinates |
| `qpcr.ts` | Technical-replicate aggregation and equal-weight control ΔΔCt baseline |
| `sgrna.ts` | One-base-at-a-time overlapping PAM scan on both strands |
| `index-validation.ts` | Single, combinatorial dual-index and UDI validation |
| `protein-analysis.ts` | Fixed-pKa bisection pI approximation |
| `media.ts` | Final-volume media component and base-medium calculation |
| `concentration.ts` | Unit-safe mass concentration, molarity and copy-number calculation |
| `calibration.ts` | Strict calibration parsing, centered regression fits, gel curves and forward prediction |
| `pcr.ts` | Primer binding scans and PCR product enumeration with unknown-window diagnostics |
| `index.ts` | 集中 re-export |

## 近邻热力学模型

`tmNearestNeighbor` 使用 Biopython `Bio.SeqUtils.MeltingTemp.DNA_NN3`（Allawi & SantaLucia 1997）参数表：相邻碱基的 ΔH/ΔS、末端初始化和自互补对称性修正均按该实现计算。盐修正采用 SantaLucia 1998 的熵修正，并使用 von Ahsen 等效单价盐近似处理 Mg²⁺ 与 dNTP：

`Na_eq = (Na⁺ + K⁺) + 120 × √max(Mg²⁺ − dNTP总浓度, 0)`（各浓度为 mM）。

公共接口的 Ct 是两条互补链的总浓度（nM）；非自互补序列使用 Ct/4，自互补序列使用 Ct。默认值为 Ct=250 nM、Na⁺+K⁺=50 mM、Mg²⁺=1.5 mM、dNTP=0.8 mM。该模型用于估算 DNA/DNA 熔解温度，不能替代针对具体聚合酶和缓冲液优化的 PCR 退火温度。

`lib/bio/__tests__/tm.test.ts` 中的数值参考由 Biopython 1.84 `Tm_NN(..., nn_table=DNA_NN3, saltcorr=5)` 生成；非自互补样本按 `dnac1=dnac2=Ct/2`，自互补样本按 `dnac1=Ct, selfcomp=True`，并使用与界面相同的 Na、Mg²⁺、dNTP 和 Ct 条件。

## 质量与输入口径

- 质量常数采用当前模块中的平均质量表（DNA/RNA 单磷酸表和游离氨基酸表，单位 Da）。表值固定于本版本（2026-09），参考 IUPAC 平均原子量和常用生物化学游离氨基酸/核苷酸平均质量表；表名明确区分 monophosphate、free-amino-acid 与 terminal-phosphate adjustment，避免将聚合物残基表混作单体表。变更应同时更新对应回归测试。
- 蛋白质质量使用游离氨基酸平均质量，按 `Σ质量 − (n−1)×18.01528 Da` 扣除肽键失水；仅忽略末尾 `*`，内部终止符和 `X` 不产生质量。
- DNA/RNA 质量使用核苷酸单磷酸平均质量，按每个连接扣水，并扣除一个末端磷酸相对 OH 的 `79.96633 Da`。结果口径是未修饰、线性、单链、5′OH/3′OH；含 `N` 或其他未知碱基时拒绝计算。
- 限制酶切口是 0-based 的碱基间坐标；环状扫描将模板按模重复以覆盖跨原点位点，并按物理切口去重。输入中的 IUPAC/未知字符不会被当作确定匹配。
- 引物二聚体只报告穷举相对位移后的配对数、较长链归一化比例、最长连续配对和两条链的 3′端连续配对。第二条引物先反转后按 Watson–Crick 配对；该结果是筛查信号，不是 ΔG 或风险等级。
- qPCR 先按“组别＋样本＋基因”平均技术重复孔，再按每个对照样本等权平均 ΔCt；`2^-ΔΔCt` 假定扩增效率相等且约为 100%。
- sgRNA 按每个碱基扫描两条链，保留重叠 PAM；反链结果的位置是正链上 spacer 左端的 1-based 坐标，含未知 PAM 或 spacer 的候选会跳过并计数提示。
- Index 自动模式在有第二列时采用组合式双 Index；组合模式只要求组合唯一，UDI 还要求两侧分别唯一。错配提示使用每侧汉明距离不超过 `2×允许错配数` 的条件，方向关系只发出警告。
- 培养基体积按最终总体积计算，组件体积之和超过最终体积时返回无效结果，并把基础培养基列为补足量。
- 回归函数使用中心化 OLS；非有限输入、点数不足和 X 不变时拒绝拟合，Y 不变时 `R²` 为未定义。
- 标准曲线和凝胶共用 `calibration.ts` 的严格数值解析与中心化 OLS；对数域输入不满足定义域、X 不变或反算斜率为零时不输出预测。指数/幂函数只做对数线性化后的正向 Y 预测。
- 质量浓度转换使用 `g/L = mg/mL` 的等价单位链；质量可为 0，体积和分子量必须为有限正数，核酸拷贝数使用 Avogadro 常数。
- 序列统计的 GC/AT 百分比以总序列长度为分母，Shannon 熵只用确定的 A/C/G/T 频率归一化，N 与其他 IUPAC 字符单独报告。
- pI 使用固定的 N/C 端和侧链 pKa 的 Henderson–Hasselbalch 二分近似，数值不代表所有 pKa 体系的精确结果。

## 后续 TODO
- `alignment.ts` — Smith-Waterman + k-mer 索引
- `enzymes.ts` — 更完整的 REBASE 子集
- 后续可把剩余工具组件中的算法迁移到这里以减少代码重复
