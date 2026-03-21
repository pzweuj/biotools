import { NextRequest, NextResponse } from 'next/server'

const TRANSVAR_API = 'https://pzweuj-transvarweb.hf.space/api/annotate'
const TRANSVAR_BATCH_API = 'https://pzweuj-transvarweb.hf.space/api/batch_annotate'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { variant, variants, refversion = 'hg38', mode = 'panno', databases = ['refseq'] } = body

    // Determine if batch or single request
    const isBatch = variants && Array.isArray(variants) && variants.length > 0

    if (!isBatch && !variant) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: variant or variants' },
        { status: 400 }
      )
    }

    // Validate mode
    const validModes = ['panno', 'ganno', 'canno', 'region']
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json(
        { success: false, error: `Invalid mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate refversion
    const validRefversions = ['hg19', 'hg38', 'grch37', 'grch38']
    if (refversion && !validRefversions.includes(refversion.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid refversion. Must be one of: ${validRefversions.join(', ')}` },
        { status: 400 }
      )
    }

    // Prepare request payload
    const payload = isBatch
      ? { variants, refversion, mode, databases }
      : { variant, refversion, mode, databases }

    const apiUrl = isBatch ? TRANSVAR_BATCH_API : TRANSVAR_API

    // Forward request to TransVar API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { success: false, error: `TransVar API error: ${response.status} ${response.statusText}`, details: errorText },
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
    console.error('TransVar proxy error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}