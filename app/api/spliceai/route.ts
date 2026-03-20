import { NextRequest, NextResponse } from 'next/server'

// SpliceAI API base URLs for different genome versions
const SPLICEAI_BASE_37 = 'https://spliceai-37-xwkwwwxdwq-uc.a.run.app/spliceai/'
const SPLICEAI_BASE_38 = 'https://spliceai-38-xwkwwwxdwq-uc.a.run.app/spliceai/'

// Pangolin API base URLs for different genome versions
const PANGOLIN_BASE_37 = 'https://pangolin-37-xwkwwwxdwq-uc.a.run.app/pangolin/'
const PANGOLIN_BASE_38 = 'https://pangolin-38-xwkwwwxdwq-uc.a.run.app/pangolin/'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model') // 'spliceai' or 'pangolin'
    const hg = searchParams.get('hg') // '37' or '38'
    const variant = searchParams.get('variant')
    const distance = searchParams.get('distance') || '50'
    const mask = searchParams.get('mask') || '0'

    if (!model || !hg || !variant) {
      return NextResponse.json(
        { error: 'Missing required parameters: model, hg, variant' },
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

    // Construct the appropriate base URL
    let baseUrl: string
    if (model === 'spliceai') {
      baseUrl = hg === '37' ? SPLICEAI_BASE_37 : SPLICEAI_BASE_38
    } else {
      baseUrl = hg === '37' ? PANGOLIN_BASE_37 : PANGOLIN_BASE_38
    }

    // Build the full URL with query parameters
    const params = new URLSearchParams({
      hg,
      variant,
      distance,
      mask,
    })

    const apiUrl = `${baseUrl}?${params.toString()}`

    // Forward request to the appropriate API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `${model.toUpperCase()} API error: ${response.status} ${response.statusText}`, details: errorText },
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
    console.error('SpliceAI/Pangolin proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}