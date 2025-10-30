'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

interface TmbResult {
  panelTmb: number;
  wesTmb: number | null;
  cancerType?: string;
}

// TCGA-MC3数据集中不同癌种的TMB参考值（中位数和高TMB阈值）
interface CancerTypeReference {
  code: string;
  median: number;
  highThreshold: number; // 通常为第三四分位数或top 20%
}

const TCGA_CANCER_TYPES: CancerTypeReference[] = [
  { code: 'SKCM', median: 15.8, highThreshold: 30.0 },
  { code: 'LUAD', median: 8.5, highThreshold: 17.0 },
  { code: 'LUSC', median: 10.5, highThreshold: 20.0 },
  { code: 'BLCA', median: 7.5, highThreshold: 15.0 },
  { code: 'UCEC', median: 5.8, highThreshold: 30.0 },
  { code: 'STAD', median: 7.2, highThreshold: 15.0 },
  { code: 'COAD', median: 6.5, highThreshold: 25.0 },
  { code: 'HNSC', median: 4.8, highThreshold: 10.0 },
  { code: 'BRCA', median: 1.4, highThreshold: 5.0 },
  { code: 'PRAD', median: 1.0, highThreshold: 3.0 },
  { code: 'THCA', median: 0.9, highThreshold: 2.5 },
  { code: 'KIRC', median: 1.3, highThreshold: 4.0 },
  { code: 'LIHC', median: 3.5, highThreshold: 8.0 },
  { code: 'GBM', median: 1.8, highThreshold: 4.5 },
  { code: 'OV', median: 2.5, highThreshold: 6.0 },
  { code: 'ESCA', median: 5.5, highThreshold: 12.0 },
  { code: 'PAAD', median: 2.2, highThreshold: 5.5 },
  { code: 'CESC', median: 4.0, highThreshold: 9.0 },
];

export function TmbCalculator() {
  const { t } = useI18n();
  const [panelSize, setPanelSize] = useState<string>('');
  const [mutationCount, setMutationCount] = useState<string>('');
  const [useCorrection, setUseCorrection] = useState<boolean>(false);
  const [kValue, setKValue] = useState<string>('1.0');
  const [bValue, setBValue] = useState<string>('0');
  const [selectedCancerType, setSelectedCancerType] = useState<string>('');
  const [result, setResult] = useState<TmbResult | null>(null);

  const calculate = useCallback(() => {
    const size = parseFloat(panelSize);
    const count = parseFloat(mutationCount);
    const k = parseFloat(kValue);
    const b = parseFloat(bValue);

    if (isNaN(size) || size <= 0) {
      alert(t('tools.tmbCalculator.invalidPanelSize'));
      return;
    }

    if (isNaN(count) || count < 0) {
      alert(t('tools.tmbCalculator.invalidMutationCount'));
      return;
    }

    if (useCorrection && (isNaN(k) || isNaN(b))) {
      alert(t('tools.tmbCalculator.invalidCorrectionParams'));
      return;
    }

    // Calculate Panel-TMB: mutations per megabase
    const panelTmb = (count / size) * 1000000;

    // Calculate WES-TMB using correction formula: f(x) = kx + b
    const wesTmb = useCorrection ? k * panelTmb + b : null;

    setResult({
      panelTmb,
      wesTmb,
      cancerType: selectedCancerType,
    });
  }, [panelSize, mutationCount, useCorrection, kValue, bValue, selectedCancerType, t]);

  const clearAll = useCallback(() => {
    setPanelSize('');
    setMutationCount('');
    setUseCorrection(false);
    setKValue('1.0');
    setBValue('0');
    setSelectedCancerType('');
    setResult(null);
  }, []);

  const getCancerTypeLevel = (tmb: number, cancerType: string): { level: string; color: string } => {
    const cancer = TCGA_CANCER_TYPES.find(c => c.code === cancerType);
    if (!cancer) return { level: '', color: '' };

    if (tmb >= cancer.highThreshold) {
      return { level: t('tools.tmbCalculator.highTmbLevel'), color: 'text-red-600 dark:text-red-400' };
    } else if (tmb >= cancer.median) {
      return { level: t('tools.tmbCalculator.mediumTmbLevel'), color: 'text-yellow-600 dark:text-yellow-400' };
    } else {
      return { level: t('tools.tmbCalculator.lowTmbLevel'), color: 'text-green-600 dark:text-green-400' };
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('tools.tmbCalculator.name')}</CardTitle>
          <CardDescription>{t('tools.tmbCalculator.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="panelSize" className="text-base font-semibold">
                {t('tools.tmbCalculator.panelSize')}
              </Label>
              <Input
                id="panelSize"
                type="number"
                value={panelSize}
                onChange={(e) => setPanelSize(e.target.value)}
                placeholder={t('tools.tmbCalculator.panelSizePlaceholder')}
                className="font-mono border-2 bg-muted/30"
              />
              <p className="text-sm text-muted-foreground">
                {t('tools.tmbCalculator.panelSizeHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mutationCount" className="text-base font-semibold">
                {t('tools.tmbCalculator.mutationCount')}
              </Label>
              <Input
                id="mutationCount"
                type="number"
                value={mutationCount}
                onChange={(e) => setMutationCount(e.target.value)}
                placeholder={t('tools.tmbCalculator.mutationCountPlaceholder')}
                className="font-mono border-2 bg-muted/30"
              />
              <p className="text-sm text-muted-foreground">
                {t('tools.tmbCalculator.mutationCountHint')}
              </p>
            </div>

            {/* Cancer Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="cancerType" className="text-base font-semibold">
                {t('tools.tmbCalculator.cancerType')}
              </Label>
              <Select value={selectedCancerType} onValueChange={setSelectedCancerType}>
                <SelectTrigger className="border-2 bg-muted/30">
                  <SelectValue placeholder={t('tools.tmbCalculator.selectCancerType')} />
                </SelectTrigger>
                <SelectContent>
                  {TCGA_CANCER_TYPES.map((cancer) => (
                    <SelectItem key={cancer.code} value={cancer.code}>
                      {cancer.code} - {t(`tools.tmbCalculator.cancerTypes.${cancer.code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('tools.tmbCalculator.cancerTypeHint')}
              </p>
            </div>

            {/* Correction Formula Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant={useCorrection ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseCorrection(!useCorrection)}
                  className="font-semibold"
                >
                  {useCorrection ? "✓ " : ""}{t('tools.tmbCalculator.useCorrection')}
                </Button>
                {useCorrection && (
                  <span className="text-sm text-muted-foreground">
                    {t('tools.tmbCalculator.correctionFormula')}: WES-TMB = k × Panel-TMB + b
                  </span>
                )}
              </div>

              {useCorrection && (
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kValue" className="text-sm font-semibold">
                        {t('tools.tmbCalculator.kValue')}
                      </Label>
                      <Input
                        id="kValue"
                        type="number"
                        step="0.01"
                        value={kValue}
                        onChange={(e) => setKValue(e.target.value)}
                        placeholder="1.0"
                        className="font-mono border-2 bg-muted/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bValue" className="text-sm font-semibold">
                        {t('tools.tmbCalculator.bValue')}
                      </Label>
                      <Input
                        id="bValue"
                        type="number"
                        step="0.01"
                        value={bValue}
                        onChange={(e) => setBValue(e.target.value)}
                        placeholder="0"
                        className="font-mono border-2 bg-muted/30"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {t('tools.tmbCalculator.correctionHint')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={calculate} className="flex-1">
              {t('tools.tmbCalculator.calculate')}
            </Button>
            <Button onClick={clearAll} variant="outline">
              {t('tools.tmbCalculator.clear')}
            </Button>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">{t('tools.tmbCalculator.results')}</h3>
              
              <div className="grid gap-4">
                {/* Panel-TMB Result */}
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {t('tools.tmbCalculator.panelTmb')}
                        </span>
                        <Badge variant="secondary">Panel-TMB</Badge>
                      </div>
                      <div className="text-3xl font-bold font-mono">
                        {result.panelTmb.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('tools.tmbCalculator.mutationsPerMb')}
                      </div>
                      {result.cancerType && (() => {
                        const { level, color } = getCancerTypeLevel(result.panelTmb, result.cancerType);
                        const cancer = TCGA_CANCER_TYPES.find(c => c.code === result.cancerType);
                        return level ? (
                          <div className="pt-3 border-t space-y-1">
                            <div className={`text-sm font-semibold ${color}`}>
                              {level}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('tools.tmbCalculator.referenceRange')}: {t('tools.tmbCalculator.median')} {cancer?.median} | {t('tools.tmbCalculator.highThreshold')} {cancer?.highThreshold}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* WES-TMB Result */}
                {result.wesTmb !== null && (
                  <Card className="border-2 border-primary/50 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-muted-foreground">
                            {t('tools.tmbCalculator.wesTmb')}
                          </span>
                          <Badge>WES-TMB</Badge>
                        </div>
                        <div className="text-3xl font-bold font-mono">
                          {result.wesTmb.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('tools.tmbCalculator.mutationsPerMb')}
                        </div>
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          {t('tools.tmbCalculator.correctedValue')}: {kValue} × {result.panelTmb.toFixed(2)} + {bValue}
                        </div>
                        {result.cancerType && (() => {
                          const { level, color } = getCancerTypeLevel(result.wesTmb, result.cancerType);
                          const cancer = TCGA_CANCER_TYPES.find(c => c.code === result.cancerType);
                          return level ? (
                            <div className="pt-3 border-t space-y-1">
                              <div className={`text-sm font-semibold ${color}`}>
                                {level}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t('tools.tmbCalculator.referenceRange')}: {t('tools.tmbCalculator.median')} {cancer?.median} | {t('tools.tmbCalculator.highThreshold')} {cancer?.highThreshold}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools.tmbCalculator.about')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">{t('tools.tmbCalculator.whatIsTmb')}</h4>
            <p className="text-muted-foreground">
              {t('tools.tmbCalculator.tmbDescription')}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">{t('tools.tmbCalculator.whyCorrection')}</h4>
            <p className="text-muted-foreground">
              {t('tools.tmbCalculator.correctionDescription')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">{t('tools.tmbCalculator.aboutMC3')}</h4>
            <p className="text-muted-foreground">
              {t('tools.tmbCalculator.mc3Description')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">{t('tools.tmbCalculator.example')}</h4>
            <div className="space-y-2 text-muted-foreground">
              <p>{t('tools.tmbCalculator.exampleText')}</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>{t('tools.tmbCalculator.exampleStep1')}</li>
                <li>{t('tools.tmbCalculator.exampleStep2')}</li>
                <li>{t('tools.tmbCalculator.exampleStep3')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
