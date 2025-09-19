"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, FileText, Filter, Copy } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type SequenceRecord = {
  id: string
  description?: string
  sequence: string
  length: number
  format: 'fasta' | 'genbank' | 'embl'
}

export function SequenceFormatConverter() {
  const { t } = useI18n()
  const [inputText, setInputText] = useState("")
  const [outputFormat, setOutputFormat] = useState<'fasta' | 'genbank' | 'embl'>('fasta')
  const [renamePattern, setRenamePattern] = useState("seq_{n}")
  const [minLength, setMinLength] = useState("")
  const [maxLength, setMaxLength] = useState("")
  const [removeDuplicates, setRemoveDuplicates] = useState(false)
  const [processedText, setProcessedText] = useState("")

  // 解析FASTA格式
  const parseFASTA = (text: string): SequenceRecord[] => {
    const records: SequenceRecord[] = []
    const lines = text.trim().split('\n')
    let currentRecord: Partial<SequenceRecord> | null = null

    for (const line of lines) {
      if (line.startsWith('>')) {
        if (currentRecord) {
          records.push({
            ...currentRecord,
            sequence: currentRecord.sequence || '',
            length: (currentRecord.sequence || '').length,
            format: 'fasta'
          } as SequenceRecord)
        }
        const header = line.substring(1).trim()
        const spaceIndex = header.indexOf(' ')
        currentRecord = {
          id: spaceIndex > 0 ? header.substring(0, spaceIndex) : header,
          description: spaceIndex > 0 ? header.substring(spaceIndex + 1) : undefined,
          sequence: ''
        }
      } else if (currentRecord && line.trim()) {
        currentRecord.sequence += line.trim().toUpperCase()
      }
    }

    if (currentRecord) {
      records.push({
        ...currentRecord,
        sequence: currentRecord.sequence || '',
        length: (currentRecord.sequence || '').length,
        format: 'fasta'
      } as SequenceRecord)
    }

    return records
  }

  // 简化的GenBank解析
  const parseGenBank = (text: string): SequenceRecord[] => {
    const records: SequenceRecord[] = []
    const entries = text.split('//').filter(entry => entry.trim())

    for (const entry of entries) {
      const lines = entry.trim().split('\n')
      let id = ''
      let description = ''
      let sequence = ''
      let inOrigin = false

      for (const line of lines) {
        if (line.startsWith('LOCUS')) {
          id = line.split(/\s+/)[1] || 'unknown'
        } else if (line.startsWith('DEFINITION')) {
          description = line.substring(10).trim()
        } else if (line.startsWith('ORIGIN')) {
          inOrigin = true
        } else if (inOrigin && line.trim() && !line.startsWith('//')) {
          const seqLine = line.replace(/^\s*\d+\s*/, '').replace(/\s/g, '').toUpperCase()
          sequence += seqLine
        }
      }

      if (id && sequence) {
        records.push({
          id,
          description: description || undefined,
          sequence,
          length: sequence.length,
          format: 'genbank'
        })
      }
    }

    return records
  }

  // 简化的EMBL解析
  const parseEMBL = (text: string): SequenceRecord[] => {
    const records: SequenceRecord[] = []
    const entries = text.split('//').filter(entry => entry.trim())

    for (const entry of entries) {
      const lines = entry.trim().split('\n')
      let id = ''
      let description = ''
      let sequence = ''
      let inSequence = false

      for (const line of lines) {
        if (line.startsWith('ID')) {
          id = line.split(/\s+/)[1] || 'unknown'
        } else if (line.startsWith('DE')) {
          description += line.substring(2).trim() + ' '
        } else if (line.startsWith('SQ')) {
          inSequence = true
        } else if (inSequence && line.trim() && !line.startsWith('//')) {
          const seqLine = line.replace(/^\s*/, '').replace(/\s/g, '').replace(/\d/g, '').toUpperCase()
          sequence += seqLine
        }
      }

      if (id && sequence) {
        records.push({
          id,
          description: description.trim() || undefined,
          sequence,
          length: sequence.length,
          format: 'embl'
        })
      }
    }

    return records
  }

  // 自动检测格式并解析
  const parseSequences = (text: string): SequenceRecord[] => {
    if (!text.trim()) return []

    // 检测FASTA格式
    if (text.includes('>')) {
      return parseFASTA(text)
    }
    // 检测GenBank格式
    else if (text.includes('LOCUS') && text.includes('ORIGIN')) {
      return parseGenBank(text)
    }
    // 检测EMBL格式
    else if (text.includes('ID   ') && text.includes('SQ   ')) {
      return parseEMBL(text)
    }
    // 默认作为纯序列处理
    else {
      const cleanSeq = text.replace(/[^A-Za-z]/g, '').toUpperCase()
      if (cleanSeq) {
        return [{
          id: 'sequence_1',
          sequence: cleanSeq,
          length: cleanSeq.length,
          format: 'fasta'
        }]
      }
    }

    return []
  }

  // 格式化输出
  const formatSequences = (records: SequenceRecord[], format: string): string => {
    switch (format) {
      case 'fasta':
        return records.map(record => {
          const header = record.description ? `${record.id} ${record.description}` : record.id
          return `>${header}\n${record.sequence}`
        }).join('\n\n')

      case 'genbank':
        return records.map(record => {
          const lines = [`LOCUS       ${record.id}                     ${record.length} bp    DNA     linear   UNK 01-JAN-1980`]
          if (record.description) {
            lines.push(`DEFINITION  ${record.description}`)
          }
          lines.push('ACCESSION   .')
          lines.push('VERSION     .')
          lines.push('KEYWORDS    .')
          lines.push('SOURCE      .')
          lines.push('  ORGANISM  .')
          lines.push('FEATURES             Location/Qualifiers')
          lines.push('ORIGIN      ')
          
          // 格式化序列，每行60个字符，每10个字符一组
          const seq = record.sequence
          for (let i = 0; i < seq.length; i += 60) {
            const chunk = seq.substring(i, i + 60)
            const formatted = chunk.match(/.{1,10}/g)?.join(' ') || chunk
            lines.push(`${String(i + 1).padStart(9)} ${formatted}`)
          }
          lines.push('//')
          return lines.join('\n')
        }).join('\n\n')

      case 'embl':
        return records.map(record => {
          const lines = [`ID   ${record.id}; SV 1; linear; genomic DNA; STD; UNK; ${record.length} BP.`]
          lines.push('XX')
          lines.push('AC   .')
          lines.push('XX')
          lines.push('DT   01-JAN-1980 (Rel. 1, Created)')
          lines.push('XX')
          if (record.description) {
            lines.push(`DE   ${record.description}`)
            lines.push('XX')
          }
          lines.push('KW   .')
          lines.push('XX')
          lines.push('OS   .')
          lines.push('OC   .')
          lines.push('XX')
          lines.push('FH   Key             Location/Qualifiers')
          lines.push('FH')
          lines.push(`SQ   Sequence ${record.length} BP; A; C; G; T; other;`)
          
          // 格式化序列
          const seq = record.sequence
          for (let i = 0; i < seq.length; i += 60) {
            const chunk = seq.substring(i, i + 60)
            const formatted = chunk.match(/.{1,10}/g)?.join(' ') || chunk
            lines.push(`     ${formatted}${' '.repeat(Math.max(0, 66 - formatted.length))}${i + chunk.length}`)
          }
          lines.push('//')
          return lines.join('\n')
        }).join('\n\n')

      default:
        return ''
    }
  }

  // 处理序列
  const processSequences = () => {
    let records = parseSequences(inputText)
    
    if (records.length === 0) {
      setProcessedText('')
      return
    }

    // ID重命名
    if (renamePattern.trim()) {
      records = records.map((record, index) => ({
        ...record,
        id: renamePattern.replace('{n}', String(index + 1)).replace('{id}', record.id)
      }))
    }

    // 长度过滤
    const minLen = parseInt(minLength) || 0
    const maxLen = parseInt(maxLength) || Infinity
    records = records.filter(record => record.length >= minLen && record.length <= maxLen)

    // 去重复
    if (removeDuplicates) {
      const seenSequences = new Set<string>()
      records = records.filter(record => {
        if (seenSequences.has(record.sequence)) {
          return false
        }
        seenSequences.add(record.sequence)
        return true
      })
    }

    const output = formatSequences(records, outputFormat)
    setProcessedText(output)
  }

  const parsedRecords = useMemo(() => parseSequences(inputText), [inputText])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(processedText)
  }

  const clearAll = () => {
    setInputText('')
    setProcessedText('')
    setRenamePattern('seq_{n}')
    setMinLength('')
    setMaxLength('')
    setRemoveDuplicates(false)
  }

  return (
    <Card className="w-full geek-card">
      <CardHeader>
        <CardTitle className="text-balance font-mono text-card-foreground">
          {t("tools.sequence-format-converter.name", "Sequence Format Converter")}
        </CardTitle>
        <CardDescription className="font-mono">
          {t("tools.sequence-format-converter.description", "Convert between FASTA/GenBank/EMBL formats, rename IDs, filter by length, and remove duplicates")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 输入区域 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {t("tools.sequence-format-converter.input", "Input Sequences")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="input-sequences" className="font-mono">
                {t("tools.sequence-format-converter.inputLabel", "Paste sequences (FASTA/GenBank/EMBL format)")}
              </Label>
              <Textarea
                id="input-sequences"
                placeholder={t("tools.sequence-format-converter.inputPlaceholder", ">seq1\nATCGATCGATCG\n>seq2\nGCTAGCTAGCTA")}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="terminal-input min-h-[150px] font-mono"
                rows={8}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                <span>
                  {parsedRecords.length} {t("tools.sequence-format-converter.sequencesDetected", "sequences detected")}
                </span>
                <Button onClick={clearAll} variant="outline" size="sm" className="font-mono">
                  {t("common.clear", "Clear")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 处理选项 */}
        <Card className="border-2 border-dashed border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              {t("tools.sequence-format-converter.processing", "Processing Options")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 输出格式 */}
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-format-converter.outputFormat", "Output Format")}</Label>
                <Select value={outputFormat} onValueChange={(value: any) => setOutputFormat(value)}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fasta" className="font-mono">FASTA</SelectItem>
                    <SelectItem value="genbank" className="font-mono">GenBank</SelectItem>
                    <SelectItem value="embl" className="font-mono">EMBL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ID重命名模式 */}
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-format-converter.renamePattern", "ID Rename Pattern")}</Label>
                <Input
                  placeholder="seq_{n} or {id}_new"
                  value={renamePattern}
                  onChange={(e) => setRenamePattern(e.target.value)}
                  className="font-mono"
                />
                <div className="text-xs text-muted-foreground font-mono">
                  {t("tools.sequence-format-converter.patternHint", "{n} = number, {id} = original ID")}
                </div>
              </div>

              {/* 长度过滤 */}
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-format-converter.lengthFilter", "Length Filter")}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("tools.sequence-format-converter.minLength", "Min")}
                    value={minLength}
                    onChange={(e) => setMinLength(e.target.value)}
                    className="font-mono"
                    type="number"
                  />
                  <Input
                    placeholder={t("tools.sequence-format-converter.maxLength", "Max")}
                    value={maxLength}
                    onChange={(e) => setMaxLength(e.target.value)}
                    className="font-mono"
                    type="number"
                  />
                </div>
              </div>

              {/* 去重选项 */}
              <div className="space-y-2">
                <Label className="font-mono">{t("tools.sequence-format-converter.deduplication", "Deduplication")}</Label>
                <div className={`p-3 border rounded-lg transition-all ${
                  removeDuplicates 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-muted/20 hover:bg-muted/30'
                }`}>
                  <label className="flex items-center gap-3 font-mono text-sm cursor-pointer">
                    <Checkbox
                      checked={removeDuplicates}
                      onCheckedChange={(checked) => setRemoveDuplicates(Boolean(checked))}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${removeDuplicates ? 'text-primary' : 'text-foreground'}`}>
                        {t("tools.sequence-format-converter.removeDuplicates", "Remove duplicate sequences")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t("tools.sequence-format-converter.deduplicationHint", "Keep only the first occurrence of identical sequences")}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded font-mono ${
                      removeDuplicates 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {removeDuplicates 
                        ? t("tools.sequence-format-converter.enabled", "✓ Enabled") 
                        : t("tools.sequence-format-converter.disabled", "○ Disabled")
                      }
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <Button onClick={processSequences} className="w-full font-mono" disabled={parsedRecords.length === 0}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("tools.sequence-format-converter.process", "Process Sequences")}
            </Button>
          </CardContent>
        </Card>

        {/* 输出区域 */}
        {processedText && (
          <Card className="border-2 border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  {t("tools.sequence-format-converter.output", "Processed Output")}
                </span>
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="font-mono">
                  <Copy className="w-4 h-4 mr-1" />
                  {t("common.copy", "Copy")}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={processedText}
                readOnly
                className="terminal-input min-h-[200px] font-mono"
                rows={10}
              />
            </CardContent>
          </Card>
        )}

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t("tools.sequence-format-converter.note", "Supports automatic format detection. GenBank and EMBL parsing is simplified for basic conversion needs.")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default SequenceFormatConverter
