'use client';

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { ClientHeader } from '@/components/clients/ClientHeader';
import { ClientOverview } from '@/components/clients/ClientOverview';
import { ClientContactsTab } from '@/components/clients/ClientContactsTab';
import { ClientAddressesTab } from '@/components/clients/ClientAddressesTab';
import { ClientActivityTab } from '@/components/clients/ClientActivityTab';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClient, useClientMetrics } from '@/hooks/use-clients';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const { data: client, isLoading: isClientLoading } = useClient(clientId);
  const { data: metrics, isLoading: isMetricsLoading } = useClientMetrics(clientId);

  if (isClientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Client not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ClientHeader client={client} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ClientOverview client={client} metrics={metrics} isLoadingMetrics={isMetricsLoading} />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <ClientContactsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="addresses" className="space-y-6">
          <ClientAddressesTab client={client} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ClientActivityTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
