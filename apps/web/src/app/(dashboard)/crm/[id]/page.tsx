'use client';

import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  Edit,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';

import { ClientForm } from '@/components/crm/ClientForm';
import { ClientMetrics } from '@/components/crm/ClientMetrics';
import { CommunicationTimeline } from '@/components/crm/CommunicationTimeline';
import { ContactList } from '@/components/crm/ContactList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useClient,
  useContacts,
  useCommunications,
  useClientMetrics,
  useUpdateClient,
} from '@/hooks/use-clients';
import { cn } from '@/lib/utils';

const statusVariants = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  CHURNED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const typeVariants = {
  CUSTOMER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  LEAD: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  PROSPECT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  PARTNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  VENDOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const riskVariants = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: contacts, isLoading: contactsLoading } = useContacts(clientId);
  const { data: communications, isLoading: communicationsLoading } = useCommunications(clientId);
  const { data: metrics, isLoading: metricsLoading } = useClientMetrics(clientId);
  const updateMutation = useUpdateClient();

  const handleUpdateClient = async (data: any) => {
    await updateMutation.mutateAsync({ id: clientId, data });
    setIsEditOpen(false);
  };

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Client not found</p>
        <Button asChild>
          <Link href="/crm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Link>
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/crm">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <Badge variant="secondary" className={cn(typeVariants[client.type])}>
                {client.type}
              </Badge>
              <Badge variant="secondary" className={cn(statusVariants[client.status])}>
                {client.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {client.industry && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {client.industry}
                </div>
              )}
              {client.riskLevel !== 'LOW' && (
                <Badge variant="outline" className={cn(riskVariants[client.riskLevel])}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {client.riskLevel} Risk
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setIsEditOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Client
        </Button>
      </motion.div>

      {/* Client Info Card */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-[24px]">
        <CardContent className="p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {client.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Website</p>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline flex items-center gap-1"
                    >
                      {client.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {client.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        client.address.street,
                        client.address.city,
                        client.address.postalCode,
                        client.address.countryCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}
              {client.vatId && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">VAT ID</p>
                    <p className="text-sm text-muted-foreground">{client.vatId}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Payment Terms</p>
                  <p className="text-sm text-muted-foreground">
                    {client.paymentTerms || 30} days
                  </p>
                </div>
              </div>
              {client.creditLimit !== undefined && client.creditLimit > 0 && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Credit Limit</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(client.creditLimit)}
                    </p>
                  </div>
                </div>
              )}
              {client.tags && client.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {client.notes && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium mb-2">Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Metrics */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
      {metricsLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : metrics ? (
        <ClientMetrics metrics={metrics} />
      ) : null}
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="rounded-[24px]">
            <CardContent className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              {communicationsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : communications && communications.length > 0 ? (
                <div className="space-y-4">
                  {communications.slice(0, 5).map((comm) => (
                    <div
                      key={comm.id}
                      className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="text-sm text-muted-foreground">
                        {new Date(comm.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{comm.subject}</p>
                        <p className="text-sm text-muted-foreground">{comm.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              )}
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          {contactsLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <ContactList clientId={clientId} contacts={contacts || []} />
          )}
        </TabsContent>

        <TabsContent value="communications">
          {communicationsLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <CommunicationTimeline clientId={clientId} communications={communications || []} />
          )}
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="rounded-[24px]">
            <CardContent className="p-6">
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Invoice integration coming soon
              </p>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="rounded-[24px]">
            <CardContent className="p-6">
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Document management coming soon
              </p>
            </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={client}
            onSubmit={handleUpdateClient}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
