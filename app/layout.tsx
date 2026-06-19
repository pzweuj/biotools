import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import { CommandPalette } from "@/components/command-palette"
import { SwRegister } from "@/components/sw-register"
import "./globals.css"

const siteUrl = "https://use.biotools.space"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BioTools — 生物信息学工具库 / Local Bioinformatics Tools",
    template: "%s | BioTools",
  },
  description:
    "Modern, privacy-first bioinformatics tools — sequence analysis, primer design, qPCR, TMB and more. All calculations run locally in your browser.",
  applicationName: "BioTools",
  authors: [{ name: "pzweuj", url: "https://github.com/pzweuj" }],
  generator: "Next.js",
  keywords: [
    "bioinformatics",
    "DNA",
    "RNA",
    "primer",
    "Tm",
    "PCR",
    "qPCR",
    "GC content",
    "ORF",
    "translation",
    "BLOSUM",
    "TMB",
    "CRISPR",
    "sgRNA",
    "生物信息学",
    "本地计算",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BioTools — 生物信息学工具库",
    description:
      "Modern, privacy-first bioinformatics tools that run entirely in your browser.",
    url: siteUrl,
    siteName: "BioTools",
    images: [{ url: "/logo.png", alt: "BioTools" }],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BioTools",
    description: "Modern, privacy-first bioinformatics tools.",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/favicon.png" }],
  },
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="msapplication-TileColor" content="#000000" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Providers>
          <Suspense fallback={<div className="flex items-center justify-center h-screen font-mono">Loading...</div>}>
            {children}
            <CommandPalette />
            <SwRegister />
            <Analytics />
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
