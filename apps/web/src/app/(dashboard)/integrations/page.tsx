'use client';

import { useState } from 'react';
import {
  CreditCard,
  Mail,
  Calendar,
  Database,
  Building2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

// Integration categories
const integrations = [
  {
    category: 'Banking',
    description: 'Connect your bank accounts for real-time financial data',
    items: [
      {
        id: 'truelayer',
        name: 'TrueLayer',
        description: 'EU/UK Open Banking - Access transactions and account data',
        icon: Building2,
        status: 'available',
        region: 'EU/UK',
      },
      {
        id: 'plaid',
        name: 'Plaid',
        description: 'US Banking - Connect US bank accounts and credit cards',
        icon: Building2,
        status: 'available',
        region: 'US',
      },
      {
        id: 'tink',
        name: 'Tink',
        description: 'European Banking - Access bank data across Europe',
        icon: Building2,
        status: 'available',
        region: 'EU',
      },
    ],
  },
  {
    category: 'Payments',
    description: 'Process payments and manage subscriptions',
    items: [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Accept payments, manage subscriptions and invoicing',
        icon: CreditCard,
        status: 'available',
        region: 'Global',
      },
    ],
  },
  {
    category: 'Communication',
    description: 'Email and messaging integrations',
    items: [
      {
        id: 'email',
        name: 'Email Integration',
        description: 'Process invoices and receipts from email',
        icon: Mail,
        status: 'available',
        region: 'Global',
      },
    ],
  },
  {
    category: 'Productivity',
    description: 'Calendar and document management',
    items: [
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Sync deadlines and appointments',
        icon: Calendar,
        status: 'coming-soon',
        region: 'Global',
      },
      {
        id: 'storage',
        name: 'Cloud Storage',
        description: 'Store and manage documents',
        icon: Database,
        status: 'coming-soon',
        region: 'Global',
      },
    ],
  },
];

export default function IntegrationsPage() {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (id: string, name: string) => {
    setConnecting(id);

    // Simulate connection
    setTimeout(() => {
      toast({
        title: 'Integration Connected',
        description: `Successfully connected to ${name}`,
      });
      setConnecting(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your business tools and services
        </p>
      </div>

      {/* Integration Categories */}
      <div className="space-y-8">
        {integrations.map((category) => (
          <div key={category.category} className="space-y-4">
            {/* Category Header */}
            <div>
              <h2 className="text-xl font-semibold">{category.category}</h2>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </div>

            {/* Integration Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.items.map((integration) => {
                const Icon = integration.icon;
                const isConnecting = connecting === integration.id;
                const isComingSoon = integration.status === 'coming-soon';

                return (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div
                          className="p-2 rounded-md"
                          style={{
                            background: 'var(--color-accent-light)',
                          }}
                        >
                          <Icon
                            className="h-6 w-6"
                            style={{ color: 'var(--color-primary)' }}
                          />
                        </div>
                        <Badge
                          variant={
                            integration.status === 'available'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {integration.region}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4">
                        {integration.name}
                      </CardTitle>
                      <CardDescription>
                        {integration.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        disabled={isComingSoon || isConnecting}
                        onClick={() =>
                          handleConnect(integration.id, integration.name)
                        }
                      >
                        {isConnecting ? (
                          <>Connecting...</>
                        ) : isComingSoon ? (
                          <>Coming Soon</>
                        ) : (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Connected Integrations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>
            Manage your active connections and sync settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              No integrations connected yet. Connect your first integration above to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
