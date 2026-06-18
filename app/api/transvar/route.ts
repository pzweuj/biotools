import { NextRequest, NextResponse } from 'next/server'

const TRANSVAR_API = 'https://pzweuj-transvarweb.hf.space/api/annotate'
const TRANSVAR_BATCH_API = 'https://pzweuj-transvarweb.hf.space/api/batch_annotate'

const REQUEST_TIMEOUT_MS = 60_000
const MAX_VARIANT_LEN = 512
const MAX_BATCH = 200

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { variant, variants, refversion = 'hg38', mode = 'panno', databases = ['refseq'] } = body

    const isBatch = variants && Array.isArray(variants) && variants.length > 0

    if (!isBatch && !variant) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: variant or variants' },
        { status: 400 }
      )
    }

    // 输入长度上限
    if (!isBatch && typeof variant === 'string' && variant.length > MAX_VARIANT_LEN) {
      return NextResponse.json(
        { success: false, error: `variant too long (max ${MAX_VARIANT_LEN})` },
        { status: 400 }
      )
    }
    if (isBatch) {
      if (variants.length > MAX_BATCH) {
        return NextResponse.json(
          { success: false, error: `Too many variants (max ${MAX_BATCH})` },
          { status: 400 }
        )
      }
      if (variants.some((v: unknown) => typeof v !== 'string' || (v as string).length > MAX_VARIANT_LEN)) {
        return NextResponse.json(
          { success: false, error: 'Each variant must be a string within length limit' },
          { status: 400 }
        )
      }
    }

    const validModes = ['panno', 'ganno', 'canno', 'region']
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json(
        { success: false, error: `Invalid mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      )
    }

    const validRefversions = ['hg19', 'hg38', 'grch37', 'grch38']
    if (refversion && !validRefversions.includes(String(refversion).toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid refversion. Must be one of: ${validRefversions.join(', ')}` },
        { status: 400 }
      )
    }

    const validDbs = new Set(['refseq', 'ensembl', 'ucsc', 'ccds'])
    if (!Array.isArray(databases) || databases.some((d: unknown) => typeof d !== 'string' || !validDbs.has(d as string))) {
      return NextResponse.json(
        { success: false, error: 'Invalid databases parameter' },
        { status: 400 }
      )
    }

    const payload = isBatch
      ? { variants, refversion, mode, databases }
      : { variant, refversion, mode, databases }

    const apiUrl = isBatch ? TRANSVAR_BATCH_API : TRANSVAR_API

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return NextResponse.json({ success: false, error: 'Upstream timeout' }, { status: 504 })
    }
    console.error('TransVar proxy error:', error)
    return NextResponse.json({ success: false, error: 'Proxy error' }, { status: 502 })
  }
}
