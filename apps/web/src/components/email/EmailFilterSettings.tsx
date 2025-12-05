'use client';

import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export interface EmailFilterConfig {
  processAttachments: boolean;
  processInvoices: boolean;
  processReceipts: boolean;
  processPurchaseOrders: boolean;
  processStatements: boolean;
  senderWhitelist: string[];
  senderBlacklist: string[];
  subjectKeywords: string[];
  minAmount?: number;
  maxAmount?: number;
  autoProcess: boolean;
  requireManualReview: boolean;
}

interface EmailFilterSettingsProps {
  config: EmailFilterConfig;
  onChange: (config: EmailFilterConfig) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

export function EmailFilterSettings({
  config,
  onChange,
  onSave,
  onReset,
  isSaving = false,
  isDirty = false,
}: EmailFilterSettingsProps) {
  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');
  const [newBlacklistEmail, setNewBlacklistEmail] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const updateConfig = (updates: Partial<EmailFilterConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addToWhitelist = () => {
    if (newWhitelistEmail && !config.senderWhitelist.includes(newWhitelistEmail)) {
      updateConfig({
        senderWhitelist: [...config.senderWhitelist, newWhitelistEmail],
      });
      setNewWhitelistEmail('');
    }
  };

  const removeFromWhitelist = (email: string) => {
    updateConfig({
      senderWhitelist: config.senderWhitelist.filter((e) => e !== email),
    });
  };

  const addToBlacklist = () => {
    if (newBlacklistEmail && !config.senderBlacklist.includes(newBlacklistEmail)) {
      updateConfig({
        senderBlacklist: [...config.senderBlacklist, newBlacklistEmail],
      });
      setNewBlacklistEmail('');
    }
  };

  const removeFromBlacklist = (email: string) => {
    updateConfig({
      senderBlacklist: config.senderBlacklist.filter((e) => e !== email),
    });
  };

  const addKeyword = () => {
    if (newKeyword && !config.subjectKeywords.includes(newKeyword)) {
      updateConfig({
        subjectKeywords: [...config.subjectKeywords, newKeyword],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    updateConfig({
      subjectKeywords: config.subjectKeywords.filter((k) => k !== keyword),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Filter Settings</CardTitle>
            <CardDescription>
              Configure which emails to process and how to handle them
            </CardDescription>
          </div>
          {isDirty && (
            <Badge variant="secondary">Unsaved Changes</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Document Types to Process</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="invoices" className="flex flex-col space-y-1">
                <span>Invoices</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Process invoice documents from emails
                </span>
              </Label>
              <Switch
                id="invoices"
                checked={config.processInvoices}
                onCheckedChange={(checked) => updateConfig({ processInvoices: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="receipts" className="flex flex-col space-y-1">
                <span>Receipts</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Process receipt documents from emails
                </span>
              </Label>
              <Switch
                id="receipts"
                checked={config.processReceipts}
                onCheckedChange={(checked) => updateConfig({ processReceipts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="purchase-orders" className="flex flex-col space-y-1">
                <span>Purchase Orders</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Process purchase order documents
                </span>
              </Label>
              <Switch
                id="purchase-orders"
                checked={config.processPurchaseOrders}
                onCheckedChange={(checked) => updateConfig({ processPurchaseOrders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="statements" className="flex flex-col space-y-1">
                <span>Statements</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Process bank and financial statements
                </span>
              </Label>
              <Switch
                id="statements"
                checked={config.processStatements}
                onCheckedChange={(checked) => updateConfig({ processStatements: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="attachments" className="flex flex-col space-y-1">
                <span>Process Attachments</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Extract and process PDF and image attachments
                </span>
              </Label>
              <Switch
                id="attachments"
                checked={config.processAttachments}
                onCheckedChange={(checked) => updateConfig({ processAttachments: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Processing Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Processing Options</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-process" className="flex flex-col space-y-1">
                <span>Auto-process Documents</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Automatically process documents without manual review
                </span>
              </Label>
              <Switch
                id="auto-process"
                checked={config.autoProcess}
                onCheckedChange={(checked) => updateConfig({ autoProcess: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="manual-review" className="flex flex-col space-y-1">
                <span>Require Manual Review</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Flag all processed documents for manual review
                </span>
              </Label>
              <Switch
                id="manual-review"
                checked={config.requireManualReview}
                onCheckedChange={(checked) => updateConfig({ requireManualReview: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Amount Filters */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Amount Filters (Optional)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-amount">Minimum Amount</Label>
              <Input
                id="min-amount"
                type="number"
                placeholder="0.00"
                value={config.minAmount || ''}
                onChange={(e) =>
                  updateConfig({
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-amount">Maximum Amount</Label>
              <Input
                id="max-amount"
                type="number"
                placeholder="No limit"
                value={config.maxAmount || ''}
                onChange={(e) =>
                  updateConfig({
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Sender Whitelist */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Sender Whitelist</h4>
            <p className="text-sm text-muted-foreground">
              Only process emails from these senders (leave empty to process all)
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="email@example.com"
              value={newWhitelistEmail}
              onChange={(e) => setNewWhitelistEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToWhitelist()}
            />
            <Button variant="outline" onClick={addToWhitelist}>
              Add
            </Button>
          </div>
          {config.senderWhitelist.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.senderWhitelist.map((email) => (
                <Badge key={email} variant="secondary" className="gap-2">
                  {email}
                  <button
                    onClick={() => removeFromWhitelist(email)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Sender Blacklist */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Sender Blacklist</h4>
            <p className="text-sm text-muted-foreground">
              Never process emails from these senders
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="spam@example.com"
              value={newBlacklistEmail}
              onChange={(e) => setNewBlacklistEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToBlacklist()}
            />
            <Button variant="outline" onClick={addToBlacklist}>
              Add
            </Button>
          </div>
          {config.senderBlacklist.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.senderBlacklist.map((email) => (
                <Badge key={email} variant="destructive" className="gap-2">
                  {email}
                  <button
                    onClick={() => removeFromBlacklist(email)}
                    className="text-destructive-foreground/80 hover:text-destructive-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Subject Keywords */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Subject Keywords</h4>
            <p className="text-sm text-muted-foreground">
              Process emails with these keywords in the subject line
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="invoice, receipt, etc."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button variant="outline" onClick={addKeyword}>
              Add
            </Button>
          </div>
          {config.subjectKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.subjectKeywords.map((keyword) => (
                <Badge key={keyword} variant="outline" className="gap-2">
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={!isDirty || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={onSave} disabled={!isDirty || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
