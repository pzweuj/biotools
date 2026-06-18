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
| `tm.ts` | `tmWallace` / `tmBasicGc` / `tmSaltAdjusted` |
| `codons.ts` | `STANDARD_CODE` / `VERT_MITO_CODE` / `translateDna` |
| `index.ts` | 集中 re-export |

## 后续 TODO
- `tm-nearest-neighbor.ts` — 完整 SantaLucia 1998 实现（含端基/对称性修正）
- `alignment.ts` — Smith-Waterman + k-mer 索引
- `enzymes.ts` — 限制酶 Aho-Corasick 自动机扫描
- `restriction.ts` — REBASE 子集
- 后续可把工具组件中的算法迁移到这里以减少代码重复
