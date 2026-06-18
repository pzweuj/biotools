import { NextRequest, NextResponse } from 'next/server'

const SPLICEAI_BASE_37 = 'https://spliceai-37-xwkwwwxdwq-uc.a.run.app/spliceai/'
const SPLICEAI_BASE_38 = 'https://spliceai-38-xwkwwwxdwq-uc.a.run.app/spliceai/'
const PANGOLIN_BASE_37 = 'https://pangolin-37-xwkwwwxdwq-uc.a.run.app/pangolin/'
const PANGOLIN_BASE_38 = 'https://pangolin-38-xwkwwwxdwq-uc.a.run.app/pangolin/'

const REQUEST_TIMEOUT_MS = 30_000
const MAX_VARIANT_LEN = 256

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model')
    const hg = searchParams.get('hg')
    const variant = searchParams.get('variant')
    const distance = searchParams.get('distance') || '50'
    const mask = searchParams.get('mask') || '0'

    if (!model || !hg || !variant) {
      return NextResponse.json(
        { error: 'Missing required parameters: model, hg, variant' },
        { status: 400 }
      )
    }

    if (variant.length > MAX_VARIANT_LEN) {
      return NextResponse.json(
        { error: `variant too long (max ${MAX_VARIANT_LEN})` },
        { status: 400 }
      )
    }

    if (hg !== '37' && hg !== '38') {
      return NextResponse.json(
        { error: 'Invalid hg parameter. Must be 37 or 38' },
        { status: 400 }
      )
    }

    if (model !== 'spliceai' && model !== 'pangolin') {
      return NextResponse.json(
        { error: 'Invalid model parameter. Must be spliceai or pangolin' },
        { status: 400 }
      )
    }

    // distance 必须是 1-1000 范围的整数；mask 必须是 0/1
    const distanceNum = Number(distance)
    if (!Number.isInteger(distanceNum) || distanceNum < 1 || distanceNum > 1000) {
      return NextResponse.json(
        { error: 'Invalid distance parameter (must be integer 1-1000)' },
        { status: 400 }
      )
    }
    if (mask !== '0' && mask !== '1') {
      return NextResponse.json({ error: 'Invalid mask parameter (must be 0 or 1)' }, { status: 400 })
    }

    let baseUrl: string
    if (model === 'spliceai') {
      baseUrl = hg === '37' ? SPLICEAI_BASE_37 : SPLICEAI_BASE_38
    } else {
      baseUrl = hg === '37' ? PANGOLIN_BASE_37 : PANGOLIN_BASE_38
    }

    const params = new URLSearchParams({ hg, variant, distance, mask })
    const apiUrl = `${baseUrl}?${params.toString()}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${response.status}` },
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
      return NextResponse.json({ error: 'Upstream timeout' }, { status: 504 })
    }
    console.error('SpliceAI/Pangolin proxy error:', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 })
  }
}
