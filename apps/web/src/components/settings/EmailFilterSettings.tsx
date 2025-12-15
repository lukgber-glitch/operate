'use client';

import { useEffect, useState } from 'react';
import { useEmailFilterConfig } from '@/hooks/use-email-filter-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, Shield, Mail, AlertTriangle, Settings2 } from 'lucide-react';

export function EmailFilterSettings() {
  const {
    config,
    loading,
    saving,
    fetchConfig,
    updateConfig,
    addToBlacklist,
    removeFromBlacklist,
    addToWhitelist,
    removeFromWhitelist,
    addBlockedPattern,
    removeBlockedPattern,
  } = useEmailFilterConfig();

  const [newBlacklistDomain, setNewBlacklistDomain] = useState('');
  const [newWhitelistDomain, setNewWhitelistDomain] = useState('');
  const [newBlockedPattern, setNewBlockedPattern] = useState('');

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleAddBlacklist = async () => {
    if (newBlacklistDomain.trim()) {
      await addToBlacklist(newBlacklistDomain.trim());
      setNewBlacklistDomain('');
    }
  };

  const handleAddWhitelist = async () => {
    if (newWhitelistDomain.trim()) {
      await addToWhitelist(newWhitelistDomain.trim());
      setNewWhitelistDomain('');
    }
  };

  const handleAddPattern = async () => {
    if (newBlockedPattern.trim()) {
      await addBlockedPattern(newBlockedPattern.trim());
      setNewBlockedPattern('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No filter configuration found.</p>
          <Button className="mt-4" onClick={fetchConfig}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="domains">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domains">
            <Shield className="h-4 w-4 mr-2" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <Mail className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="confidence">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Confidence
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Settings2 className="h-4 w-4 mr-2" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* Domain Filtering Tab */}
        <TabsContent value="domains" className="space-y-6">
          {/* Blacklist */}
          <Card>
            <CardHeader>
              <CardTitle>Blocked Domains</CardTitle>
              <CardDescription>
                Emails from these domains will be automatically skipped
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={newBlacklistDomain}
                  onChange={(e) => setNewBlacklistDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBlacklist()}
                />
                <Button onClick={handleAddBlacklist} disabled={saving}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.customDomainBlacklist?.map((domain) => (
                  <Badge key={domain} variant="destructive" className="pl-3">
                    {domain}
                    <button
                      onClick={() => removeFromBlacklist(domain)}
                      className="ml-2 hover:bg-destructive-foreground/20 rounded p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!config.customDomainBlacklist || config.customDomainBlacklist.length === 0) && (
                  <p className="text-sm text-muted-foreground">No custom blocked domains</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Whitelist */}
          <Card>
            <CardHeader>
              <CardTitle>Allowed Domains</CardTitle>
              <CardDescription>
                Emails from these domains will always be processed (bypass all filters)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="trustedpartner.com"
                  value={newWhitelistDomain}
                  onChange={(e) => setNewWhitelistDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddWhitelist()}
                />
                <Button onClick={handleAddWhitelist} disabled={saving}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.customDomainWhitelist?.map((domain) => (
                  <Badge key={domain} variant="secondary" className="pl-3">
                    {domain}
                    <button
                      onClick={() => removeFromWhitelist(domain)}
                      className="ml-2 hover:bg-secondary-foreground/20 rounded p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!config.customDomainWhitelist || config.customDomainWhitelist.length === 0) && (
                  <p className="text-sm text-muted-foreground">No custom allowed domains</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pattern Filtering Tab */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Blocked Email Patterns</CardTitle>
              <CardDescription>
                Emails matching these patterns will be skipped. Use * as wildcard (e.g., noreply@*)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="noreply@*"
                  value={newBlockedPattern}
                  onChange={(e) => setNewBlockedPattern(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPattern()}
                />
                <Button onClick={handleAddPattern} disabled={saving}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.blockedEmailPatterns?.map((pattern) => (
                  <Badge key={pattern} variant="outline" className="pl-3">
                    {pattern}
                    <button
                      onClick={() => removeBlockedPattern(pattern)}
                      className="ml-2 hover:bg-muted rounded p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!config.blockedEmailPatterns || config.blockedEmailPatterns.length === 0) && (
                  <p className="text-sm text-muted-foreground">No custom blocked patterns</p>
                )}
              </div>

              {/* Header Filters */}
              <div className="pt-4 border-t space-y-4">
                <h4 className="font-medium">Header Filters</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Skip Auto-Replies</Label>
                      <p className="text-sm text-muted-foreground">Skip automated reply emails</p>
                    </div>
                    <Switch
                      checked={config.skipAutoReplies}
                      onCheckedChange={(checked) => updateConfig({ skipAutoReplies: checked })}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Skip Bulk Mail</Label>
                      <p className="text-sm text-muted-foreground">Skip mass mailing and newsletters</p>
                    </div>
                    <Switch
                      checked={config.skipBulkMail}
                      onCheckedChange={(checked) => updateConfig({ skipBulkMail: checked })}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Skip Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Skip promotional and marketing emails</p>
                    </div>
                    <Switch
                      checked={config.skipMarketingMail}
                      onCheckedChange={(checked) => updateConfig({ skipMarketingMail: checked })}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confidence Tab */}
        <TabsContent value="confidence">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Thresholds</CardTitle>
              <CardDescription>
                Configure minimum confidence levels for automatic processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Entity Extraction Confidence</Label>
                    <span className="text-sm font-medium">{Math.round(config.minEntityConfidence * 100)}%</span>
                  </div>
                  <Slider
                    value={[config.minEntityConfidence * 100]}
                    onValueChange={([value]) => updateConfig({ minEntityConfidence: (value ?? 30) / 100 })}
                    min={30}
                    max={95}
                    step={5}
                    disabled={saving}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum confidence for extracted entities (companies, contacts, etc.)
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Classification Confidence</Label>
                    <span className="text-sm font-medium">{Math.round(config.minClassificationConfidence * 100)}%</span>
                  </div>
                  <Slider
                    value={[config.minClassificationConfidence * 100]}
                    onValueChange={([value]) => updateConfig({ minClassificationConfidence: (value ?? 30) / 100 })}
                    min={30}
                    max={95}
                    step={5}
                    disabled={saving}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum confidence for email classification
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Low Confidence Threshold</Label>
                    <span className="text-sm font-medium">{Math.round(config.lowConfidenceThreshold * 100)}%</span>
                  </div>
                  <Slider
                    value={[config.lowConfidenceThreshold * 100]}
                    onValueChange={([value]) => updateConfig({ lowConfidenceThreshold: (value ?? 20) / 100 })}
                    min={20}
                    max={70}
                    step={5}
                    disabled={saving}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Below this threshold, emails are skipped entirely
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label>Review Low Confidence</Label>
                    <p className="text-sm text-muted-foreground">
                      Queue emails between low and min threshold for manual review
                    </p>
                  </div>
                  <Switch
                    checked={config.reviewLowConfidence}
                    onCheckedChange={(checked) => updateConfig({ reviewLowConfidence: checked })}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure automatic customer and vendor creation behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Create Customers</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create customers from qualifying emails
                  </p>
                </div>
                <Switch
                  checked={config.autoCreateCustomers}
                  onCheckedChange={(checked) => updateConfig({ autoCreateCustomers: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Create Vendors</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create vendors from invoice emails
                  </p>
                </div>
                <Switch
                  checked={config.autoCreateVendors}
                  onCheckedChange={(checked) => updateConfig({ autoCreateVendors: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label>Require Manual Review</Label>
                  <p className="text-sm text-muted-foreground">
                    Send all emails to review queue instead of auto-creating
                  </p>
                </div>
                <Switch
                  checked={config.requireManualReview}
                  onCheckedChange={(checked) => updateConfig({ requireManualReview: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
