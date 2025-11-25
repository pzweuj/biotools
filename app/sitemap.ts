import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://use.biotools.site' // TODO: Replace with your actual domain
  const currentDate = new Date()

  // All tool IDs from the project
  const toolIds = [
    // Sequence Analysis
    'sequence-stats',
    'base-complement',
    'sequence-translation',
    'orf-finder',
    
    // Molecular Biology
    'molecular-weight-calculator',
    'restriction-enzymes',
    'protein-analysis',
    'aa-converter',
    
    // Primer Design
    'tm-calculator',
    'primer-dimer-detector',
    'pcr-product-calculator',
    
    // Data Processing
    'index-checker',
    'sequence-format-converter',
    'qpcr-data-analyzer',
    'qpcr-fluorescence-channel-tool',
    'gel-electrophoresis-analyzer',
    
    // Laboratory Calculations
    'buffer-calculator',
    'cell-culture-calculator',
    'protein-purification-calculator',
    
    // Reference Tables
    'amino-acid-table',
    'blosum-matrix',
    
    // External Tools
    'maneloca',
    'deephpo',
    'warfarin',
    'mutalyzer',
  ]

  // Generate tool pages
  const toolPages = toolIds.map((toolId) => ({
    url: `${baseUrl}/tools/${toolId}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // All tool pages
    ...toolPages,
  ]
}
