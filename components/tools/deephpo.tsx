"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, AlertCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DeepHpo() {
  const { t } = useI18n()

  const handleVisitSite = () => {
    window.open("https://deephpo.biotools.site", "_blank", "noopener,noreferrer")
  }

  const handleViewSource = () => {
    window.open("https://github.com/pzweuj/DeepHPO", "_blank", "noopener,noreferrer")
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-primary/20 bg-card/50">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <img 
                src="https://github.com/pzweuj/DeepHPO/raw/refs/heads/main/public/icon.png" 
                alt="DeepHPO Icon"
                className="w-16 h-16 mr-4"
                onError={(e) => {
                  // Fallback to a simple icon if the image fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div>
                <CardTitle className="text-3xl font-bold font-mono text-primary">
                  DeepHPO
                </CardTitle>
                <CardDescription className="text-lg font-mono mt-2">
                  {t("tools.deephpo.subtitle", "AI-Powered Clinical Phenotype HPO Term Extraction")}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-mono">DeepSeek-V3</Badge>
              <Badge variant="outline" className="font-mono">HPO</Badge>
              <Badge variant="outline" className="font-mono">Clinical Phenotype</Badge>
              <Badge variant="outline" className="font-mono">AI</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Project Description */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground font-mono leading-relaxed max-w-3xl mx-auto">
                {t("tools.deephpo.description", 
                  "DeepHPO is a web application based on DeepSeek for extracting HPO (Human Phenotype Ontology) terms from clinical phenotype descriptions. It provides convenient HPO term query services for users. The current version uses DeepSeek-V3 (0324) model."
                )}
              </p>
            </div>

            {/* Important Notice */}
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="font-mono text-sm">
                {t("tools.deephpo.notice", 
                  "Due to Vercel's 60-second timeout mechanism, queries may fail if complete information cannot be retrieved in time. The default API provider is SiliconFlow, but you can configure other OpenAI-compatible service providers through the settings button on the homepage."
                )}
              </AlertDescription>
            </Alert>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-mono font-semibold mb-2 text-primary">
                    {t("tools.deephpo.features.ai", "AI-Powered Extraction")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t("tools.deephpo.features.aiDesc", "Utilizes DeepSeek-V3 for intelligent HPO term extraction")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-mono font-semibold mb-2 text-primary">
                    {t("tools.deephpo.features.hpo", "HPO Ontology")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t("tools.deephpo.features.hpoDesc", "Standardized clinical phenotype terminology system")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-mono font-semibold mb-2 text-primary">
                    {t("tools.deephpo.features.web", "Web-based Interface")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t("tools.deephpo.features.webDesc", "Easy-to-use web application accessible via Vercel")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-mono font-semibold mb-2 text-primary">
                    {t("tools.deephpo.features.flexible", "Flexible API Configuration")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t("tools.deephpo.features.flexibleDesc", "Support for custom OpenAI-compatible API providers")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button 
                onClick={handleVisitSite}
                className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t("tools.deephpo.visitSite", "Visit DeepHPO")}
              </Button>
              
              <Button 
                onClick={handleViewSource}
                variant="outline"
                className="font-mono border-primary/20 hover:bg-primary/10"
                size="lg"
              >
                <Github className="w-4 h-4 mr-2" />
                {t("tools.deephpo.viewSource", "View Source")}
              </Button>
            </div>

            {/* Usage Note */}
            <div className="text-center pt-4 border-t border-muted">
              <p className="text-xs text-muted-foreground font-mono">
                {t("tools.deephpo.note", "Click 'Visit DeepHPO' to access the full application with all features")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
