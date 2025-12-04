'use client';

import {
  AlertCircle,
  Bot,
  ChevronRight,
  FileText,
  Info,
  Receipt,
  RotateCcw,
  Save,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  useAutomationSettings,
  type AutomationMode,
  type AutomationFeatureConfig,
  type AutomationSettingsData,
} from '@/hooks/use-automation-settings';

const automationModes: Array<{
  value: AutomationMode;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: 'FULL_AUTO',
    label: 'Full Automatic',
    description: 'AI processes items automatically without human review when confidence is high',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    value: 'SEMI_AUTO',
    label: 'Semi-Automatic',
    description: 'AI suggests actions, you approve or reject before processing',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    value: 'MANUAL',
    label: 'Manual',
    description: 'All items require manual processing without AI assistance',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  },
];

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  feature: keyof AutomationSettingsData;
  config: AutomationFeatureConfig;
  onUpdate: (feature: keyof AutomationSettingsData, updates: Partial<AutomationFeatureConfig>) => void;
  showAmountThreshold?: boolean;
  amountLabel?: string;
}

function FeatureCard({
  icon,
  title,
  description,
  feature,
  config,
  onUpdate,
  showAmountThreshold = true,
  amountLabel = 'Maximum auto-approve amount',
}: FeatureCardProps) {
  const currentMode = automationModes.find((m) => m.value === config.mode);
  const confidencePercent = Math.round(config.confidenceThreshold * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">{icon}</div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={currentMode?.color}>{currentMode?.label}</Badge>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => onUpdate(feature, { enabled: checked })}
            />
          </div>
        </div>
      </CardHeader>

      {config.enabled && (
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="space-y-2">
            <Label htmlFor={`${feature}-mode`}>Automation Mode</Label>
            <Select
              value={config.mode}
              onValueChange={(value: AutomationMode) => onUpdate(feature, { mode: value })}
            >
              <SelectTrigger id={`${feature}-mode`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {automationModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{mode.label}</span>
                      <span className="text-xs text-muted-foreground">{mode.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confidence Threshold - Only for Full Auto and Semi Auto */}
          {config.mode !== 'MANUAL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${feature}-confidence`}>Confidence Threshold</Label>
                <span className="text-sm font-medium text-primary">{confidencePercent}%</span>
              </div>
              <Slider
                id={`${feature}-confidence`}
                min={50}
                max={100}
                step={5}
                value={[confidencePercent]}
                onValueChange={(value) =>
                  onUpdate(feature, { confidenceThreshold: value[0] / 100 })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {config.mode === 'FULL_AUTO'
                  ? `Only auto-process when AI is at least ${confidencePercent}% confident`
                  : `AI will suggest actions when confidence is at least ${confidencePercent}%`}
              </p>
            </div>
          )}

          {/* Amount Threshold */}
          {showAmountThreshold && config.maxAutoApproveAmount !== undefined && (
            <div className="space-y-2">
              <Label htmlFor={`${feature}-amount`}>{amountLabel} (EUR)</Label>
              <Input
                id={`${feature}-amount`}
                type="number"
                min="0"
                step="100"
                value={(config.maxAutoApproveAmount / 100).toFixed(2)}
                onChange={(e) => {
                  const euros = parseFloat(e.target.value) || 0;
                  onUpdate(feature, { maxAutoApproveAmount: Math.round(euros * 100) });
                }}
                placeholder="5000.00"
              />
              <p className="text-xs text-muted-foreground">
                {config.mode === 'FULL_AUTO'
                  ? 'Items above this amount will require manual review even if confidence is high'
                  : 'Set a maximum amount for this automation feature'}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function AutomationSettingsPage() {
  const {
    settings,
    accuracyStats,
    isLoading,
    isSaving,
    updateFeature,
    saveSettings,
    resetToDefaults,
  } = useAutomationSettings();

  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local settings when fetched settings change
  useState(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleUpdateFeature = (
    feature: keyof AutomationSettingsData,
    updates: Partial<AutomationFeatureConfig>
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await saveSettings(localSettings);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    resetToDefaults();
    setLocalSettings(settings);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading automation settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automation Settings</h1>
        <p className="text-muted-foreground">
          Configure AI-powered automation for your business operations
        </p>
      </div>

      {/* Info Banner */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">
          Understanding Automation Modes
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <strong>Full Automatic:</strong> AI processes items without human review when
              confidence is high
            </li>
            <li>
              <strong>Semi-Automatic:</strong> AI suggests actions, you approve or reject before
              processing
            </li>
            <li>
              <strong>Manual:</strong> All items require manual processing without AI assistance
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* AI Accuracy Stats */}
      {accuracyStats && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-base text-green-900 dark:text-green-100">
                AI Performance
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {(accuracyStats.overallAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Overall Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {(accuracyStats.invoiceAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Invoice Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {(accuracyStats.expenseAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Expense Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {accuracyStats.totalProcessed.toLocaleString()}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Items Processed</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-green-600 dark:text-green-400">
              Last updated: {new Date(accuracyStats.lastUpdated).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Warning for changes */}
      {hasChanges && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>
            You have unsaved changes. Click &quot;Save Settings&quot; to apply your changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Automation Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Automation Features</h2>

        <FeatureCard
          icon={<FileText className="h-5 w-5 text-primary" />}
          title="Invoice Creation"
          description="Automatically generate invoices from time entries and deliverables"
          feature="invoiceCreation"
          config={localSettings.invoiceCreation}
          onUpdate={handleUpdateFeature}
          amountLabel="Maximum auto-generate amount"
        />

        <FeatureCard
          icon={<Receipt className="h-5 w-5 text-primary" />}
          title="Expense Approval"
          description="Automatically approve employee expense claims based on policy rules"
          feature="expenseApproval"
          config={localSettings.expenseApproval}
          onUpdate={handleUpdateFeature}
          amountLabel="Maximum auto-approve expense"
        />

        <FeatureCard
          icon={<Wallet className="h-5 w-5 text-primary" />}
          title="Bank Reconciliation"
          description="Automatically match bank transactions to invoices and expenses"
          feature="bankReconciliation"
          config={localSettings.bankReconciliation}
          onUpdate={handleUpdateFeature}
          amountLabel="Maximum auto-reconcile amount"
        />

        <FeatureCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          title="Tax Classification"
          description="Automatically classify transactions into correct tax categories"
          feature="taxClassification"
          config={localSettings.taxClassification}
          onUpdate={handleUpdateFeature}
          amountLabel="Maximum auto-classify amount"
        />

        <FeatureCard
          icon={<Bot className="h-5 w-5 text-primary" />}
          title="Payment Reminders"
          description="Automatically send payment reminders for overdue invoices"
          feature="paymentReminders"
          config={localSettings.paymentReminders}
          onUpdate={handleUpdateFeature}
          showAmountThreshold={false}
        />
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleReset} disabled={isSaving}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>

        <div className="flex gap-3">
          {hasChanges && (
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Additional Info */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-base text-amber-900 dark:text-amber-100">
              Important Notes
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
          <p>
            • Confidence thresholds determine how certain the AI must be before taking action
          </p>
          <p>• Amount limits provide an additional safety check for high-value transactions</p>
          <p>
            • Semi-automatic mode is recommended when starting to ensure AI suggestions meet your
            standards
          </p>
          <p>• You can review all automated actions in the Activity Log</p>
        </CardContent>
      </Card>
    </div>
  );
}
