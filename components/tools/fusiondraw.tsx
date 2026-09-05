"use client"
import { ToolPage, ToolPageHeader, ToolPageTitle, ToolPageDescription, ToolPageContent } from "@/components/tool-page"

import { ExternalLink, Github, Info } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { FusionDrawIcon } from "@/components/icons/fusiondraw-icon"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const FUSIONDRAW_URL = "https://fusiondraw.biotools.space"
const FUSIONDRAW_SOURCE_URL = "https://github.com/pzweuj/FusionDraw"

export function FusionDraw() {
  const { t } = useI18n()

  return (
    <ToolPage>
      <div className="mx-auto w-full max-w-4xl space-y-8">

          <ToolPageHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <FusionDrawIcon className="w-16 h-16 mr-4 text-primary" />
              <div>
                <ToolPageTitle>
                  FusionDraw
                </ToolPageTitle>
                <ToolPageDescription>
                  {t("tools.fusiondraw.subtitle", "Fusion Gene Diagram Builder")}
                </ToolPageDescription>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="">React</Badge>
              <Badge variant="outline" className="">hg19 / hg38</Badge>
              <Badge variant="outline" className="">SVG</Badge>
              <Badge variant="outline" className="">PlotSpec</Badge>
            </div>
          </ToolPageHeader>

          <ToolPageContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {t(
                  "tools.fusiondraw.description",
                  "FusionDraw is a browser-based tool for creating clear, editable fusion-gene diagrams from transcript and genomic information. It separates annotation lookup from rendering so diagrams can be refined and reused in research reports.",
                )}
              </p>
            </div>

            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                {t(
                  "tools.fusiondraw.notice",
                  "FusionDraw supports research illustrations and report figures. It is not intended for clinical diagnosis.",
                )}
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    {t("tools.fusiondraw.features.fusion", "Fusion Gene Diagrams")}
                  </h3>
                  <p className="text-sm text-muted-foreground ">
                    {t("tools.fusiondraw.features.fusionDesc", "Build schematic diagrams that show the retained exon segments of two fusion partners.")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    {t("tools.fusiondraw.features.annotation", "Genome Annotation")}
                  </h3>
                  <p className="text-sm text-muted-foreground ">
                    {t("tools.fusiondraw.features.annotationDesc", "Use bundled hg19 and hg38 annotations for chromosome and cytoband context.")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    {t("tools.fusiondraw.features.export", "SVG and PlotSpec Export")}
                  </h3>
                  <p className="text-sm text-muted-foreground ">
                    {t("tools.fusiondraw.features.exportDesc", "Download publication-ready SVG output or save a PlotSpec for later editing and reuse.")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-muted">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    {t("tools.fusiondraw.features.editable", "Editable Research Figures")}
                  </h3>
                  <p className="text-sm text-muted-foreground ">
                    {t("tools.fusiondraw.features.editableDesc", "Adjust exon labels, widths, visibility, and breakpoint details before rendering.")}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <a href={FUSIONDRAW_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t("tools.fusiondraw.visitSite", "Visit FusionDraw")}
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
                size="lg"
              >
                <a href={FUSIONDRAW_SOURCE_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  {t("tools.fusiondraw.viewSource", "View Source")}
                </a>
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-muted">
              <p className="text-xs text-muted-foreground ">
                {t("tools.fusiondraw.note", "Click 'Visit FusionDraw' to open the full application with diagram editing and SVG export.")}
              </p>
            </div>
          </ToolPageContent>

      </div>
    </ToolPage>
  )
}
