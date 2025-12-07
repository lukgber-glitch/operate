// Example Bank Connections Page with Disclaimer
// Copy this pattern to your actual connections page

'use client';

import { useState } from 'react';
import { BankConnectionDisclaimer } from '@/components/banking/BankConnectionDisclaimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus } from 'lucide-react';

type BankProvider = 'TrueLayer' | 'Tink' | 'Plaid';

export default function ConnectionsPage() {
  const [selectedProvider, setSelectedProvider] = useState<BankProvider | null>(null);

  const handleConnectBank = (provider: BankProvider) => {
    setSelectedProvider(provider);
  };

  const handleProceedToBank = () => {
    if (!selectedProvider) return;

    // Redirect to bank login flow
    console.log(`Connecting to ${selectedProvider}...`);
    // Actual implementation would redirect to OAuth flow
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bank Connections</h1>
        <p className="text-muted-foreground">
          Connect your bank accounts to automatically sync transactions
        </p>
      </div>

      {/* Connection Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              TrueLayer
            </CardTitle>
            <CardDescription>EU/UK Banks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect European and UK bank accounts via regulated Open Banking
            </p>
            <Button
              onClick={() => handleConnectBank('TrueLayer')}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect with TrueLayer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Tink
            </CardTitle>
            <CardDescription>European Banks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect European bank accounts with PSD2-compliant banking
            </p>
            <Button
              onClick={() => handleConnectBank('Tink')}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect with Tink
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Plaid
            </CardTitle>
            <CardDescription>US Banks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect US bank accounts with industry-leading security
            </p>
            <Button
              onClick={() => handleConnectBank('Plaid')}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect with Plaid
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bank Connection Disclaimer - shown when provider selected */}
      {selectedProvider && (
        <div className="space-y-4">
          <BankConnectionDisclaimer provider={selectedProvider} />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setSelectedProvider(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToBank}
              className="bg-[#06BF9D] hover:bg-[#05a889] text-white"
            >
              Continue to Bank Login
            </Button>
          </div>
        </div>
      )}

      {/* Connected Accounts Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              No bank accounts connected yet. Connect your first account to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
