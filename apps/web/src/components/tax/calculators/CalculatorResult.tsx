'use client';

import { useTranslations } from 'next-intl';

import { CheckCircle2, AlertCircle, FileText, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface CalculatorResultProps {
  originalAmount: number;
  deductibleAmount: number;
  taxSavings: number;
  currency?: string;
  legalReference?: {
    title: string;
    description: string;
    link?: string;
  };
  requiredDocuments?: string[];
  onSave?: () => void;
  isSaving?: boolean;
}

export function CalculatorResult({
  // @ts-ignore - Adding useTranslations hook

  originalAmount,
  deductibleAmount,
  taxSavings,
  currency = 'EUR',
  legalReference,
  requiredDocuments,
  onSave,
  isSaving = false,
}: CalculatorResultProps) {
  const t = useTranslations('taxCalculators');
  const [isLegalExpanded, setIsLegalExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <GlassCard className="rounded-[16px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Calculation Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Results */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-white/70 mb-1">Original Amount</p>
              <p className="text-2xl text-white font-bold">
                {formatCurrency(originalAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/70 mb-1">Deductible Amount</p>
              <p className="text-2xl text-white font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(deductibleAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/70 mb-1">Tax Savings (Est.)</p>
              <p className="text-2xl text-white font-bold text-green-600 dark:text-green-400">
                {formatCurrency(taxSavings)}
              </p>
            </div>
          </div>

          {/* Tax Savings Note */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Tax savings are estimated at 30% tax rate. Your actual savings may vary based on your personal tax situation.
            </p>
          </div>

          {/* Legal Reference */}
          {legalReference && (
            <Collapsible open={isLegalExpanded} onOpenChange={setIsLegalExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {legalReference.title}
                  </span>
                  <span className="text-xs text-white/70">
                    {isLegalExpanded ? 'Hide' : 'Show'} details
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg text-sm">
                  <p className="text-white/90">{legalReference.description}</p>
                  {legalReference.link && (
                    <a
                      href={legalReference.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Required Documents */}
          {requiredDocuments && requiredDocuments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Required Documentation</h4>
              <ul className="space-y-1 text-sm text-white/70">
                {requiredDocuments.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Save Button */}
          {onSave && (
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : t('result.saveEntry')}
            </Button>
          )}
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}
