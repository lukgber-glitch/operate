'use client';

import { Info, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface BankConnectionDisclaimerProps {
  provider: 'TrueLayer' | 'Tink' | 'Plaid';
  className?: string;
}

const providerInfo = {
  TrueLayer: {
    name: 'TrueLayer',
    regulation: 'FCA-regulated',
    region: 'EU/UK',
  },
  Tink: {
    name: 'Tink',
    regulation: 'PSD2-compliant',
    region: 'European',
  },
  Plaid: {
    name: 'Plaid',
    regulation: 'industry-leading',
    region: 'US',
  },
};

export function BankConnectionDisclaimer({
  provider,
  className = ''
}: BankConnectionDisclaimerProps) {
  const info = providerInfo[provider];

  return (
    <div
      className={`rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20 p-4 ${className}`}
      role="region"
      aria-label="Bank connection security information"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-2 flex-shrink-0">
          <Shield
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            Secure Bank Connection
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              Your bank connection is secured through <strong>{info.name}</strong>,
              a {info.regulation} {info.region} Open Banking provider.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>We <strong>never</strong> store your bank login credentials</li>
              <li>All connections use bank-grade encryption</li>
              <li>You can revoke access at any time from your settings</li>
              <li>We only access data you explicitly authorize</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <Button
              variant="link"
              className="h-auto p-0 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
              asChild
            >
              <a
                href="/legal/privacy#banking"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about data security
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
