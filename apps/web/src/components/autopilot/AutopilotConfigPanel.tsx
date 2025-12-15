'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AutopilotConfig } from '@/hooks/use-autopilot';
import {
  Tags,
  FileText,
  Bell,
  GitMerge,
  Camera,
  CreditCard,
  Receipt,
  Clock,
} from 'lucide-react';

interface AutopilotConfigPanelProps {
  config: AutopilotConfig;
  onUpdate: (updates: Partial<AutopilotConfig>) => Promise<void>;
  isLoading?: boolean;
}

interface FeatureToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

function FeatureToggle({
  icon,
  label,
  description,
  enabled,
  onToggle,
  disabled,
}: FeatureToggleProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="rounded-lg bg-blue-500/20 p-2">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white">{label}</h4>
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

export function AutopilotConfigPanel({
  config,
  onUpdate,
  isLoading = false,
}: AutopilotConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  const updateFeature = (feature: keyof AutopilotConfig['features'], value: boolean) => {
    const newConfig = {
      ...localConfig,
      features: {
        ...localConfig.features,
        [feature]: value,
      },
    };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const updateThreshold = (value: number[]) => {
    const newConfig = {
      ...localConfig,
      confidenceThreshold: value[0] ?? 0.8,
    };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const updateMaxAutoPayAmount = (value: string) => {
    const amount = parseFloat(value) || 0;
    const newConfig = {
      ...localConfig,
      maxAutoPayAmount: amount,
    };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const updateDailySummary = (enabled: boolean) => {
    const newConfig = {
      ...localConfig,
      dailySummary: {
        ...localConfig.dailySummary,
        enabled,
      },
    };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const updateSummaryTime = (time: string) => {
    const newConfig = {
      ...localConfig,
      dailySummary: {
        ...localConfig.dailySummary,
        time,
      },
    };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onUpdate(localConfig);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalConfig(config);
    setHasChanges(false);
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Autopilot Features</h3>

        <div className="space-y-3">
          <FeatureToggle
            icon={<Tags className="h-5 w-5 text-blue-400" />}
            label="Auto-categorize transactions"
            description="Automatically categorize bank transactions based on patterns"
            enabled={localConfig.features.autoCategorizeTransactions}
            onToggle={(value) => updateFeature('autoCategorizeTransactions', value)}
            disabled={isLoading}
          />

          <FeatureToggle
            icon={<FileText className="h-5 w-5 text-green-400" />}
            label="Auto-create invoices"
            description="Create invoices from approved quotes automatically"
            enabled={localConfig.features.autoCreateInvoices}
            onToggle={(value) => updateFeature('autoCreateInvoices', value)}
            disabled={isLoading}
          />

          <FeatureToggle
            icon={<Bell className="h-5 w-5 text-yellow-400" />}
            label="Auto-send payment reminders"
            description="Send reminders for overdue invoices automatically"
            enabled={localConfig.features.autoSendReminders}
            onToggle={(value) => updateFeature('autoSendReminders', value)}
            disabled={isLoading}
          />

          <FeatureToggle
            icon={<GitMerge className="h-5 w-5 text-purple-400" />}
            label="Auto-reconcile matches"
            description="Reconcile transactions with high-confidence matches"
            enabled={localConfig.features.autoReconcile}
            onToggle={(value) => updateFeature('autoReconcile', value)}
            disabled={isLoading}
          />

          <FeatureToggle
            icon={<Camera className="h-5 w-5 text-pink-400" />}
            label="Auto-extract receipts"
            description="Extract data from uploaded receipt images"
            enabled={localConfig.features.autoExtractReceipts}
            onToggle={(value) => updateFeature('autoExtractReceipts', value)}
            disabled={isLoading}
          />

          <FeatureToggle
            icon={<CreditCard className="h-5 w-5 text-orange-400" />}
            label="Auto-pay bills"
            description="Automatically pay bills below threshold"
            enabled={localConfig.features.autoPayBills}
            onToggle={(value) => updateFeature('autoPayBills', value)}
            disabled={isLoading}
          />

          <FeatureToggle
            icon={<Receipt className="h-5 w-5 text-cyan-400" />}
            label="Auto-file expenses"
            description="Automatically file and categorize expenses"
            enabled={localConfig.features.autoFileExpenses}
            onToggle={(value) => updateFeature('autoFileExpenses', value)}
            disabled={isLoading}
          />
        </div>

        {/* Confidence threshold */}
        <div className="mt-8 p-4 rounded-lg bg-white/5">
          <Label className="text-white">Confidence Threshold: {localConfig.confidenceThreshold}%</Label>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Only execute actions with at least this confidence level
          </p>
          <Slider
            value={[localConfig.confidenceThreshold]}
            onValueChange={updateThreshold}
            min={70}
            max={100}
            step={5}
            disabled={isLoading}
            className="mt-2"
          />
        </div>

        {/* Max auto-pay amount */}
        <div className="mt-4 p-4 rounded-lg bg-white/5">
          <Label className="text-white">Max Auto-Pay Amount (€)</Label>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Bills above this amount will require approval
          </p>
          <Input
            type="number"
            value={localConfig.maxAutoPayAmount}
            onChange={(e) => updateMaxAutoPayAmount(e.target.value)}
            disabled={isLoading}
            className="bg-white/5 border-white/10"
            min={0}
            step={100}
          />
        </div>

        {/* Daily summary */}
        <div className="mt-4 p-4 rounded-lg bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-white">Daily Summary Email</Label>
              <p className="text-xs text-gray-400 mt-1">
                Receive a daily summary of autopilot actions
              </p>
            </div>
            <Switch
              checked={localConfig.dailySummary.enabled}
              onCheckedChange={updateDailySummary}
              disabled={isLoading}
            />
          </div>

          {localConfig.dailySummary.enabled && (
            <div>
              <Label className="text-white">Time</Label>
              <Input
                type="time"
                value={localConfig.dailySummary.time}
                onChange={(e) => updateSummaryTime(e.target.value)}
                disabled={isLoading}
                className="mt-2 bg-white/5 border-white/10"
              />
            </div>
          )}
        </div>

        {/* Save/Reset buttons */}
        {hasChanges && (
          <div className="mt-6 flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
