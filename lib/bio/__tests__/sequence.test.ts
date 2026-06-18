import { describe, expect, it } from "vitest"
import {
  cleanSequence,
  cleanDnaStrict,
  complement,
  reverse,
  reverseComplement,
  countBases,
  gcContent,
  atContent,
  shannonEntropy,
  parseFasta,
  toFasta,
} from "../sequence"

describe("cleanSequence", () => {
  it("uppercases and removes whitespace", () => {
    expect(cleanSequence("  acgt  ")).toBe("ACGT")
    expect(cleanSequence("a c\ng\tt")).toBe("ACGT")
  })
  it("strips non-IUPAC by default", () => {
    expect(cleanSequence("ACGT123$")).toBe("ACGT")
  })
  it("keeps IUPAC ambiguity when requested", () => {
    expect(cleanSequence("ACGTNRYSW123", { keepIupac: true })).toBe("ACGTNRYSW")
  })
})

describe("cleanDnaStrict", () => {
  it("strips U and ambiguity codes", () => {
    expect(cleanDnaStrict("AUNC")).toBe("AC")
    expect(cleanDnaStrict("acgtRY")).toBe("ACGT")
  })
})

describe("complement / reverse / reverseComplement", () => {
  it("complements DNA", () => {
    expect(complement("ATGC")).toBe("TACG")
  })
  it("preserves case", () => {
    expect(complement("aTGc")).toBe("tACg")
  })
  it("handles IUPAC ambiguity", () => {
    expect(complement("RYSWKM")).toBe("YRSWMK")
  })
  it("complements RNA", () => {
    expect(complement("AUGC", { rna: true })).toBe("UACG")
  })
  it("reverses", () => {
    expect(reverse("ATGC")).toBe("CGTA")
  })
  it("reverse-complements DNA", () => {
    expect(reverseComplement("ATGC")).toBe("GCAT")
    expect(reverseComplement("AAAA")).toBe("TTTT")
  })
})

describe("countBases", () => {
  it("counts in single pass", () => {
    const c = countBases("AAACCGTNNX")
    expect(c.A).toBe(3)
    expect(c.C).toBe(2)
    expect(c.G).toBe(1)
    expect(c.T).toBe(1)
    expect(c.N).toBe(2)
    expect(c.other).toBe(1)
    expect(c.total).toBe(10)
  })
  it("is case insensitive", () => {
    const c = countBases("aAcCgGtT")
    expect(c.A).toBe(2)
    expect(c.C).toBe(2)
    expect(c.G).toBe(2)
    expect(c.T).toBe(2)
  })
})

describe("gcContent / atContent", () => {
  it("computes GC fraction over A/C/G/T only", () => {
    // GC = 2/4 = 0.5
    expect(gcContent("AGCT")).toBeCloseTo(0.5, 6)
    // N is excluded from denom
    expect(gcContent("AGCTNN")).toBeCloseTo(0.5, 6)
  })
  it("returns 0 on empty", () => {
    expect(gcContent("")).toBe(0)
    expect(atContent("")).toBe(0)
  })
  it("AT content complements GC", () => {
    expect(gcContent("ATGC") + atContent("ATGC")).toBeCloseTo(1.0, 6)
  })
})

describe("shannonEntropy", () => {
  it("is 0 for homopolymer", () => {
    expect(shannonEntropy("AAAA")).toBe(0)
  })
  it("is 2 bits for equiprobable ACGT", () => {
    expect(shannonEntropy("ACGT")).toBeCloseTo(2.0, 6)
  })
  it("is 1 bit for two equally frequent bases", () => {
    expect(shannonEntropy("AAAATTTT")).toBeCloseTo(1.0, 6)
  })
})

describe("parseFasta / toFasta", () => {
  it("parses single record", () => {
    const recs = parseFasta(">seq1 desc\nACGT\nACGT")
    expect(recs).toHaveLength(1)
    expect(recs[0].id).toBe("seq1")
    expect(recs[0].description).toBe("desc")
    expect(recs[0].sequence).toBe("ACGTACGT")
  })
  it("parses multiple records", () => {
    const text = ">a\nAAA\n>b\nCCC\nGGG"
    const recs = parseFasta(text)
    expect(recs).toHaveLength(2)
    expect(recs[0].sequence).toBe("AAA")
    expect(recs[1].sequence).toBe("CCCGGG")
  })
  it("ignores ; comment lines", () => {
    const recs = parseFasta(">a\n;comment\nACGT")
    expect(recs[0].sequence).toBe("ACGT")
  })
  it("handles raw seq without header", () => {
    const recs = parseFasta("ACGT\nGCGC")
    expect(recs).toHaveLength(1)
    expect(recs[0].id).toBe("")
    expect(recs[0].sequence).toBe("ACGTGCGC")
  })
  it("round-trips via toFasta", () => {
    const recs = parseFasta(">a desc\nACGT")
    const out = toFasta(recs, 0)
    expect(out).toContain(">a desc")
    expect(out).toContain("ACGT")
  })
  it("toFasta wraps sequences", () => {
    const out = toFasta([{ id: "x", description: "", sequence: "AAAACCCC" }], 4)
    expect(out.split("\n")).toEqual([">x", "AAAA", "CCCC"])
  })
})
