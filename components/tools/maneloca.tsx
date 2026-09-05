"use client"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ManeLoca() {
  const { t } = useI18n()

  const handleVisitSite = () => {
    window.open("https://maneloca.biotools.space", "_blank", "noopener,noreferrer")
  }

  const handleViewSource = () => {
    window.open("https://github.com/pzweuj/ManeLoca", "_blank", "noopener,noreferrer")
  }

  return (
    <ToolPage>
      <div className="mx-auto w-full max-w-4xl space-y-8">

          <ToolPageHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <img 
                src="https://github.com/pzweuj/ManeLoca/raw/refs/heads/main/src/app/icon.ico" 
                alt="ManeLoca Icon"
                className="w-16 h-16 mr-4"
                onError={(e) => {
                  // Fallback to a simple icon if the image fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div>
                <ToolPageTitle>
                  ManeLoca
                </ToolPageTitle>
                <ToolPageDescription>
                  {t("tools.maneloca.subtitle", "MANE Select Transcript Position Finder")}
                </ToolPageDescription>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="">React</Badge>
              <Badge variant="outline" className="">MANE Select</Badge>
              <Badge variant="outline" className="">Genomics</Badge>
            </div>
          </ToolPageHeader>

          <ToolPageContent className="space-y-6">
            {/* Project Description */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {t("tools.maneloca.description", 
                  "ManeLoca is a React-based web application that allows users to easily find the corresponding position in MANE Select transcripts given a genomic coordinate. MANE (Matched Annotation from NCBI and EMBL-EBI) Select transcripts represent a high-confidence set of human transcript annotations agreed upon by both NCBI and Ensembl."
                )}
              </p>
            </div>

            {/* Important Notice */}
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                {t("tools.maneloca.notice", 
                  "ManeLoca provides accurate genomic coordinate to transcript position mapping based on MANE Select annotations. The web application offers an intuitive interface for researchers and clinicians working with genomic data."
                )}
              </AlertDescription>
            </Alert>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    {t("tools.maneloca.features.genomic", "Genomic Coordinate Mapping")}
                  </h3>
                  <p className="text-sm text-muted-foreground ">
                    {t("tools.maneloca.features.genomicDesc", "Convert genomic coordinates to transcript positions")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    {t("tools.maneloca.features.mane", "MANE Select Support")}
                  </h3>
                  <p className="text-sm text-muted-foreground ">
                    {t("tools.maneloca.features.maneDesc", "High-confidence transcript annotations from NCBI and Ensembl")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    {t("tools.maneloca.features.web", "Web-based Interface")}
                  </h3>
                  <p className="text-sm text-muted-foreground ">
                    {t("tools.maneloca.features.webDesc", "Easy-to-use React application with modern UI")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    {t("tools.maneloca.features.accurate", "Accurate Mapping")}
                  </h3>
                  <p className="text-sm text-muted-foreground ">
                    {t("tools.maneloca.features.accurateDesc", "Precise position conversion for genomic analysis")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button 
                onClick={handleVisitSite}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t("tools.maneloca.visitSite", "Visit ManeLoca")}
              </Button>
              
              <Button 
                onClick={handleViewSource}
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
                size="lg"
              >
                <Github className="w-4 h-4 mr-2" />
                {t("tools.maneloca.viewSource", "View Source")}
              </Button>
            </div>

            {/* Usage Note */}
            <div className="text-center pt-4 border-t border-muted">
              <p className="text-xs text-muted-foreground ">
                {t("tools.maneloca.note", "Click 'Visit ManeLoca' to access the full application with all features")}
              </p>
            </div>
          </ToolPageContent>

      </div>
    </ToolPage>
  )
}
