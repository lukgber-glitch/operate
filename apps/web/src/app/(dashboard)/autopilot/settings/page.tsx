'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TestTube } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AutopilotConfigPanel } from '@/components/autopilot';
import { useAutopilotConfig } from '@/hooks/use-autopilot';
import { useToast } from '@/components/ui/use-toast';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

export default function AutopilotSettingsPage() {
  const { toast } = useToast();
  const { config, isLoading, fetchConfig, updateConfig } = useAutopilotConfig();

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleUpdate = async (updates: any) => {
    try {
      await updateConfig(updates);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const handleTestFeature = (feature: string) => {
    toast({
      title: 'Test Mode',
      description: `Testing ${feature} feature...`,
    });
    // In real implementation, this would trigger a test run of the feature
  };

  if (isLoading && !config) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <Link href="/autopilot">
          <Button variant="ghost" className="mb-2 text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Autopilot
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-white">Autopilot Settings</h1>
        <p className="text-sm text-gray-400">
          Configure which tasks AI can handle automatically
        </p>
      </motion.div>

      {/* Configuration panel */}
      <motion.div variants={fadeUp}>
        <AutopilotConfigPanel
          config={config}
          onUpdate={handleUpdate}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Feature explanations */}
      <motion.div variants={fadeUp}>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
            <div className="space-y-4">
              <FeatureExplanation
                title="Auto-categorize transactions"
                description="AI analyzes transaction descriptions and patterns to automatically assign categories. High-confidence matches are applied immediately, while uncertain ones are queued for approval."
                onTest={() => handleTestFeature('categorization')}
              />
              <FeatureExplanation
                title="Auto-create invoices"
                description="When a quote is marked as accepted, AI automatically creates an invoice with the same details. You can review before sending."
                onTest={() => handleTestFeature('invoice creation')}
              />
              <FeatureExplanation
                title="Auto-send payment reminders"
                description="AI monitors overdue invoices and sends professional reminder emails at optimal intervals (3, 7, and 14 days overdue)."
                onTest={() => handleTestFeature('payment reminders')}
              />
              <FeatureExplanation
                title="Auto-reconcile matches"
                description="Bank transactions are matched against invoices and expenses. Matches with 95%+ confidence are reconciled automatically."
                onTest={() => handleTestFeature('reconciliation')}
              />
              <FeatureExplanation
                title="Auto-extract receipts"
                description="Upload a receipt photo and AI extracts vendor, amount, date, and items. You review before saving."
                onTest={() => handleTestFeature('receipt extraction')}
              />
              <FeatureExplanation
                title="Auto-pay bills"
                description="Bills below your threshold amount are paid automatically on their due date. You receive a notification after payment."
                onTest={() => handleTestFeature('bill payment')}
              />
              <FeatureExplanation
                title="Auto-file expenses"
                description="Recurring expenses from known vendors are automatically categorized and filed based on historical patterns."
                onTest={() => handleTestFeature('expense filing')}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Safety notice */}
      <motion.div variants={fadeUp}>
        <Card className="border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Safety & Control</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>
                  You always have final approval on important actions like payments and reconciliations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>
                  All actions are logged and can be reversed if needed
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>
                  AI only acts on tasks with confidence above your threshold
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>
                  You can disable any feature or pause Autopilot entirely at any time
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>
                  Daily summaries keep you informed of all automated actions
                </span>
              </li>
            </ul>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function FeatureExplanation({
  title,
  description,
  onTest,
}: {
  title: string;
  description: string;
  onTest: () => void;
}) {
  return (
    <div className="rounded-lg bg-white/5 p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-white mb-1">{title}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onTest}
          className="border-white/10 shrink-0"
        >
          <TestTube className="mr-2 h-4 w-4" />
          Test
        </Button>
      </div>
    </div>
  );
}
