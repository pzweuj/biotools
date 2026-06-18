import { NextRequest, NextResponse } from 'next/server'

const MUTALYZER_API_BASE = 'https://mutalyzer.nl/api'
const REQUEST_TIMEOUT_MS = 30_000

// 仅允许 GET；其他方法显式拒绝
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      )
    }

    // endpoint 必须以 / 开头，且不允许 // (避免协议跳转) 与 .. (路径穿越)
    if (!endpoint.startsWith('/') || endpoint.includes('//') || endpoint.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid endpoint format' },
        { status: 400 }
      )
    }

    const mutalyzerUrl = `${MUTALYZER_API_BASE}${endpoint}`

    const response = await fetch(mutalyzerUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      // 仅暴露状态码，不回显上游响应体
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
    // 区分超时与其他错误
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Upstream timeout' }, { status: 504 })
    }
    console.error('Mutalyzer proxy error:', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 })
  }
}
