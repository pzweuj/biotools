"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function WarfarinCalculator() {
  const { t } = useI18n()

  const handleVisitSite = () => {
    window.open("https://warfarin.biotools.site/", "_blank", "noopener,noreferrer")
  }

  const handleViewSource = () => {
    window.open("https://github.com/pzweuj/Warfarin-Dosage-Calculator", "_blank", "noopener,noreferrer")
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-primary/20 bg-card/50">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <img 
                src="https://github.com/pzweuj/Warfarin-Dosage-Calculator/raw/refs/heads/main/public/favicon.ico" 
                alt="Warfarin Calculator Icon"
                className="w-16 h-16 mr-4"
                onError={(e) => {
                  // Fallback to a simple icon if the image fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div>
                <CardTitle className="text-3xl font-bold font-mono text-primary">
                  Warfarin Dosage Calculator
                </CardTitle>
                <CardDescription className="text-lg font-mono mt-2">
                  {t("tools.warfarin.subtitle", "Pharmacogenomic-Based Warfarin Dosing Prediction")}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-mono">React</Badge>
              <Badge variant="outline" className="font-mono">Pharmacogenomics</Badge>
              <Badge variant="outline" className="font-mono">Clinical Tool</Badge>
              <Badge variant="outline" className="font-mono">IWPC</Badge>
              <Badge variant="outline" className="font-mono">Multiple Models</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Project Description */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground font-mono leading-relaxed max-w-3xl mx-auto">
                {t("tools.warfarin.description", 
                  "The Warfarin Dosage Calculator is a comprehensive, open-source tool designed to assist researchers, clinicians, and students in predicting optimal Warfarin dosages based on multiple established pharmacogenomic and clinical algorithms. It supports prominent models including IWPC, Gage, Xiangya, Clover, and Biss models, providing a versatile platform for comparative analysis and educational purposes."
                )}
              </p>
            </div>

            {/* Important Notice */}
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="font-mono text-sm">
                {t("tools.warfarin.notice", 
                  "This calculator integrates multiple validated pharmacogenomic algorithms to provide evidence-based warfarin dosing recommendations. It is designed for research and educational purposes. Clinical decisions should always be made by qualified healthcare professionals."
                )}
              </AlertDescription>
            </Alert>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-mono font-semibold mb-2 text-primary">
                    {t("tools.warfarin.features.models", "Multiple Algorithms")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t("tools.warfarin.features.modelsDesc", "IWPC, Gage, Xiangya, Clover, and Biss models for comprehensive analysis")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-mono font-semibold mb-2 text-primary">
                    {t("tools.warfarin.features.pharmacogenomic", "Pharmacogenomic Integration")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t("tools.warfarin.features.pharmacogenomicDesc", "Incorporates genetic variants (CYP2C9, VKORC1) for personalized dosing")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-mono font-semibold mb-2 text-primary">
                    {t("tools.warfarin.features.clinical", "Clinical Parameters")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t("tools.warfarin.features.clinicalDesc", "Considers age, weight, height, and other clinical factors")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-mono font-semibold mb-2 text-primary">
                    {t("tools.warfarin.features.opensource", "Open Source")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t("tools.warfarin.features.opensourceDesc", "Freely available for research, education, and local deployment")}
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
                {t("tools.warfarin.visitSite", "Visit Calculator")}
              </Button>
              
              <Button 
                onClick={handleViewSource}
                variant="outline"
                className="font-mono border-primary/20 hover:bg-primary/10"
                size="lg"
              >
                <Github className="w-4 h-4 mr-2" />
                {t("tools.warfarin.viewSource", "View Source")}
              </Button>
            </div>

            {/* Usage Note */}
            <div className="text-center pt-4 border-t border-muted">
              <p className="text-xs text-muted-foreground font-mono">
                {t("tools.warfarin.note", "Click 'Visit Calculator' to access the full application with all dosing models and features")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
