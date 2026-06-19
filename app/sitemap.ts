import { MetadataRoute } from 'next'
import { TOOL_IDS } from '@/lib/config/tools.meta'

const BASE_URL = 'https://use.biotools.space'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date()

  const toolPages = TOOL_IDS.map((toolId) => ({
    url: `${BASE_URL}/tools/${toolId}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...toolPages,
  ]
}
