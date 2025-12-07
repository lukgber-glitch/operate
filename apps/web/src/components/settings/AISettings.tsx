'use client';

import { useState } from 'react';
import { useAIConsent } from '@/hooks/useAIConsent';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  Shield,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * AI Settings Component
 *
 * Allows users to manage AI consent and data processing preferences.
 *
 * Features:
 * - Toggle AI processing on/off
 * - View consent status and timestamp
 * - Request AI data deletion
 * - Link to privacy policy
 * - GDPR-compliant controls
 */
export function AISettings() {
  const {
    hasConsent,
    consentData,
    isLoading,
    giveConsent,
    revokeConsent,
    isNativeSecure,
  } = useAIConsent();

  const [isToggling, setIsToggling] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleAI = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      if (enabled) {
        await giveConsent();
      } else {
        setShowRevokeDialog(true);
      }
    } catch (error) {
      console.error('Failed to toggle AI consent:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleConfirmRevoke = async () => {
    setIsToggling(true);
    try {
      await revokeConsent();
      setShowRevokeDialog(false);
    } catch (error) {
      console.error('Failed to revoke consent:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteAIData = async () => {
    setIsDeleting(true);
    try {
      // Call API to delete AI data
      const response = await fetch('/api/v1/ai/data', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete AI data');
      }

      // Success - show confirmation
      alert('Your AI data has been deleted successfully.');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete AI data:', error);
      alert('Failed to delete AI data. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6" />
          AI Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage AI data processing and privacy preferences
        </p>
      </div>

      {/* AI Processing Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Processing
          </CardTitle>
          <CardDescription>
            Enable or disable AI-powered features in Operate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="ai-toggle" className="text-base font-medium">
                Use AI Assistant
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow Claude AI to process your business data for insights and
                automation
              </p>
            </div>
            <Switch
              id="ai-toggle"
              checked={hasConsent}
              onCheckedChange={handleToggleAI}
              disabled={isLoading || isToggling}
              aria-label="Toggle AI processing"
            />
          </div>

          {consentData && (
            <Alert variant={hasConsent ? 'default' : 'destructive'}>
              {hasConsent ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {hasConsent ? (
                  <>
                    AI processing is <strong>enabled</strong> since{' '}
                    {formatDate(consentData.timestamp)}
                  </>
                ) : (
                  <>
                    AI processing is <strong>disabled</strong>. You won't be
                    able to use AI-powered features.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isNativeSecure && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted">
              <Shield className="h-4 w-4 mt-0.5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Your consent is stored securely using device-level encryption
                (Keychain/Keystore)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Collection Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            What Data Is Processed?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              When AI processing is enabled, the following data may be sent to
              our AI provider (Anthropic):
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Chat messages and conversations</li>
              <li>Invoice and transaction data</li>
              <li>Document contents (receipts, contracts, etc.)</li>
              <li>Business insights requests</li>
              <li>Financial summaries and reports</li>
            </ul>
            <p className="pt-2">
              <strong>Note:</strong> Your data is never used to train AI models
              without explicit consent. All data transmission is encrypted.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your AI-processed data and exercise your rights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Delete AI Data</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Request deletion of all data processed by our AI systems. This
              includes chat history, AI-generated insights, and cached
              responses.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={!hasConsent}
              aria-label="Request deletion of AI data"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My AI Data
            </Button>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Privacy Policy</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Review our complete privacy policy and AI data processing terms
            </p>
            <Button variant="outline" asChild>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                View Privacy Policy
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Third-Party Provider</h4>
            <p className="text-sm text-muted-foreground">
              AI processing is provided by{' '}
              <a
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Anthropic (Claude AI)
              </a>
              . Review their privacy policy for details on data handling.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Consent Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable AI Processing?</AlertDialogTitle>
            <AlertDialogDescription>
              Disabling AI processing will prevent you from using AI-powered
              features including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>AI chat assistant</li>
                <li>Automatic document processing</li>
                <li>AI-generated insights and suggestions</li>
                <li>Smart categorization</li>
              </ul>
              <p className="mt-3">
                You can re-enable AI processing at any time from Settings.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              disabled={isToggling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isToggling ? 'Disabling...' : 'Disable AI'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete AI Data Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All chat conversations with the AI</li>
                <li>AI-generated insights and suggestions</li>
                <li>Document analysis results</li>
                <li>Cached AI responses</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAIData}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete My Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
