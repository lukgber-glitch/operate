'use client';

import {
  Mail,
  ShieldCheck,
  Sparkles,
  Bell,
  FolderSync,
  FileText,
  Info,
  Copy,
  Settings,
} from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import {
  useEmailConnection,
  type EmailProvider,
} from '@/hooks/use-email-connection';
import { EmailProviderCard } from './EmailProviderCard';

const EMAIL_PROVIDERS = [
  {
    id: 'gmail' as EmailProvider,
    name: 'Gmail',
    description:
      'Connect your Google Workspace or personal Gmail account to automatically extract invoices and receipts',
    recommended: true,
    logo: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.545l8.073-6.052C21.69 2.28 24 3.434 24 5.457z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: 'outlook' as EmailProvider,
    name: 'Outlook',
    description:
      'Connect your Microsoft 365, Outlook.com, or Hotmail account for seamless invoice tracking',
    recommended: false,
    logo: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 7.387v9.226c0 .747-.606 1.353-1.353 1.353h-8.294V5.034h8.294c.747 0 1.353.606 1.353 1.353z"
          fill="#0078D4"
        />
        <path
          d="M14.353 18v3.647c0 .747-.606 1.353-1.353 1.353H1.353A1.353 1.353 0 0 1 0 21.647V7.387C0 6.64.606 6.034 1.353 6.034H13c.747 0 1.353.606 1.353 1.353V18z"
          fill="#0364B8"
        />
        <path
          d="M7 9.5c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5zm0 5.833c-1.288 0-2.333-1.045-2.333-2.333S5.712 10.667 7 10.667 9.333 11.712 9.333 13 8.288 15.333 7 15.333z"
          fill="#FFF"
        />
      </svg>
    ),
  },
];

const BENEFITS = [
  {
    icon: FileText,
    title: 'Automatically extract invoices from emails',
    description: 'AI scans your inbox for bills and receipts',
  },
  {
    icon: Sparkles,
    title: 'Never miss a bill or receipt',
    description: 'All important documents captured automatically',
  },
  {
    icon: FolderSync,
    title: 'AI categorizes expenses for you',
    description: 'Smart expense classification and tagging',
  },
  {
    icon: Bell,
    title: 'Smart alerts for payment deadlines',
    description: 'Get notified before invoices are due',
  },
];

export function EmailStep() {
  const { setValue, watch } = useFormContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasConnected, setHasConnected] = React.useState(false);
  const [forwardingAddress, setForwardingAddress] = React.useState<string>('');

  const {
    gmail,
    outlook,
    isLoading,
    connectGmail,
    connectOutlook,
    disconnectGmail,
    disconnectOutlook,
    refresh,
  } = useEmailConnection({
    userId: user?.id || '',
    orgId: user?.orgId || '',
    onConnectionSuccess: (provider, email) => {
      console.log(`${provider} connected:`, email);
      setHasConnected(true);
      // Update form values
      setValue(`email.${provider}.connected`, true);
      setValue(`email.${provider}.email`, email);
      // Refresh to get latest status
      setTimeout(refresh, 1000);
    },
    onConnectionError: (provider, error) => {
      console.error(`${provider} connection error:`, error);
    },
  });

  // Fetch forwarding address on mount
  React.useEffect(() => {
    const fetchForwardingAddress = async () => {
      try {
        const response = await fetch('/api/email/mailboxes/forwarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'BILLS_INVOICES' }),
        });
        if (response.ok) {
          const data = await response.json();
          setForwardingAddress(data.inboxAddress);
        }
      } catch (error) {
        console.error('Failed to fetch forwarding address:', error);
      }
    };
    fetchForwardingAddress();
  }, []);

  const handleSkip = () => {
    setValue('email.skipped', true);
  };

  const anyConnected = gmail.status.connected || outlook.status.connected;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 mb-8 mt-4">
        <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
          Connect Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Email
          </span>
        </h1>
        <p className="text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
          Connect your business email to automatically extract invoices, receipts, and important documents. Connect one or both email providers.
        </p>
      </div>
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
        <div className="space-y-6">
          {/* Security Notice */}
          <Alert>
            <ShieldCheck className="w-4 h-4 text-white/70" />
            <AlertDescription className="ml-2">
              <strong>Secure & Private:</strong> We only read emails containing
              invoices and receipts. Your credentials are encrypted with
              bank-level security, and we use read-only access. Your emails are
              never stored on our servers.
            </AlertDescription>
          </Alert>

          {/* Provider Cards */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white">Choose your email provider</h4>
            <div className="grid grid-cols-1 gap-4">
              {EMAIL_PROVIDERS.map((provider) => {
                const connection =
                  provider.id === 'gmail' ? gmail : outlook;
                const connectHandler =
                  provider.id === 'gmail' ? connectGmail : connectOutlook;
                const disconnectHandler =
                  provider.id === 'gmail' ? disconnectGmail : disconnectOutlook;

                let status: 'disconnected' | 'connected' | 'connecting' | 'error' =
                  'disconnected';
                if (connection.isConnecting) status = 'connecting';
                else if (connection.status.connected) status = 'connected';
                else if (connection.error) status = 'error';

                return (
                  <EmailProviderCard
                    key={provider.id}
                    provider={provider.id}
                    name={provider.name}
                    description={provider.description}
                    logo={provider.logo}
                    recommended={provider.recommended}
                    status={status}
                    email={connection.status.email}
                    lastSync={connection.status.lastSync}
                    error={connection.error}
                    onConnect={connectHandler}
                    onDisconnect={disconnectHandler}
                  />
                );
              })}
            </div>
          </div>

          {/* Success Message */}
          {anyConnected && (
            <Alert className="bg-white/10 border border-white/20">
              <ShieldCheck className="w-4 h-4 text-white/70" />
              <AlertDescription className="ml-2 text-white">
                <strong>Email Connected!</strong> Your invoices and receipts
                will now be automatically extracted and categorized. You can
                manage your email connections anytime in Settings.
              </AlertDescription>
            </Alert>
          )}

          {/* Forwarding Address Section */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="text-center mb-4">
              <span className="text-sm text-white/60">or</span>
            </div>

            <div className="p-4 rounded-xl bg-white/10">
              <h4 className="font-medium text-white mb-2">
                Forward invoices manually
              </h4>
              <p className="text-sm text-white/60 mb-3">
                Send or forward invoices to your personal Operate inbox:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-black/20 rounded-lg text-sm font-mono text-white truncate">
                  {forwardingAddress || 'bills-xxxxx@in.operate.guru'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(forwardingAddress || '');
                    toast({ title: 'Copied to clipboard!' });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-white/50 mt-2">
                💡 Tip: Add this as a contact called "Operate Bills"
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="space-y-4 pt-6 border-t">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white/70" />
              What you get with email integration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BENEFITS.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white/10 rounded-lg"
                >
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-4 h-4 text-white/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-0.5 text-white">
                      {benefit.title}
                    </p>
                    <p className="text-xs text-white/60">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Hint */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white">
                  <span className="font-medium">Want more control?</span>
                </p>
                <p className="text-sm text-white/60 mt-1">
                  Add more email accounts, select specific folders, or set up category filters in Settings after completing onboarding.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Security Info */}
          <div className="flex items-start gap-3 p-4 bg-white/10 border border-white/20 rounded-lg">
            <Info className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">
                How we protect your privacy
              </p>
              <ul className="text-xs text-white/60 space-y-1">
                <li>
                  • We only scan emails with specific keywords (invoice,
                  receipt, bill)
                </li>
                <li>
                  • Email content is processed in memory and never stored on our
                  servers
                </li>
                <li>
                  • Access tokens are encrypted using AES-256 encryption
                </li>
                <li>
                  • You can revoke access at any time from your account settings
                </li>
              </ul>
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-white mt-2"
                asChild
              >
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read our Privacy Policy
                </a>
              </Button>
            </div>
          </div>

          {/* Skip Option */}
          {!anyConnected && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-white/60"
              >
                Skip for now - I'll connect later
              </Button>
            </div>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Alternative: Manual Upload Reminder */}
      {!anyConnected && (
        <Card className="border-dashed rounded-[16px] bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white/70" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">
                  Prefer to upload manually?
                </h4>
                <p className="text-sm text-white/60">
                  You can always upload invoices and receipts manually from your
                  dashboard. However, email integration saves significant time
                  and ensures nothing is missed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
