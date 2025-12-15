'use client';

import { useState } from 'react';
import { Webhook, Plus, Edit, Trash2, Play, Check, X, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'disabled';
  created: string;
  lastDelivery: {
    timestamp: string;
    status: 'success' | 'failed';
  } | null;
}

const availableEvents = [
  'invoice.created',
  'invoice.paid',
  'invoice.overdue',
  'payment.received',
  'payment.failed',
  'expense.created',
  'expense.approved',
  'customer.created',
  'customer.updated',
];

const mockWebhooks: WebhookEndpoint[] = [
  {
    id: '1',
    url: 'https://api.example.com/webhooks/operate',
    events: ['invoice.created', 'invoice.paid', 'payment.received'],
    status: 'active',
    created: '2024-11-20',
    lastDelivery: {
      timestamp: '2024-12-10T08:30:00Z',
      status: 'success',
    },
  },
  {
    id: '2',
    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX',
    events: ['invoice.overdue', 'payment.failed'],
    status: 'active',
    created: '2024-10-15',
    lastDelivery: {
      timestamp: '2024-12-09T14:20:00Z',
      status: 'failed',
    },
  },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(mockWebhooks);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a webhook URL',
        variant: 'destructive',
      });
      return;
    }

    if (selectedEvents.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one event',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    // Simulate API call
    setTimeout(() => {
      const newWebhook: WebhookEndpoint = {
        id: String(webhooks.length + 1),
        url: newWebhookUrl,
        events: selectedEvents,
        status: 'active',
        created: new Date().toISOString().split('T')[0] || new Date().toISOString(),
        lastDelivery: null,
      };

      setWebhooks([...webhooks, newWebhook]);
      setIsCreateDialogOpen(false);
      setNewWebhookUrl('');
      setSelectedEvents([]);
      setIsCreating(false);

      toast({
        title: 'Webhook Created',
        description: 'Your webhook endpoint has been configured successfully',
      });
    }, 1000);
  };

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return;

    setIsDeleting(true);

    // Simulate API call
    setTimeout(() => {
      setWebhooks(webhooks.filter(w => w.id !== selectedWebhook.id));
      setIsDeleteDialogOpen(false);
      setSelectedWebhook(null);
      setIsDeleting(false);

      toast({
        title: 'Webhook Deleted',
        description: 'The webhook endpoint has been removed',
      });
    }, 800);
  };

  const handleTestWebhook = async (webhook: WebhookEndpoint) => {
    setTestingWebhook(webhook.id);

    // Simulate test delivery
    setTimeout(() => {
      toast({
        title: 'Test Webhook Sent',
        description: `Test payload delivered to ${webhook.url}`,
      });
      setTestingWebhook(null);
    }, 1500);
  };

  const toggleWebhookStatus = (webhookId: string) => {
    setWebhooks(webhooks.map(w =>
      w.id === webhookId
        ? { ...w, status: w.status === 'active' ? 'disabled' as const : 'active' as const }
        : w
    ));

    const webhook = webhooks.find(w => w.id === webhookId);
    toast({
      title: webhook?.status === 'active' ? 'Webhook Disabled' : 'Webhook Enabled',
      description: `Webhook ${webhook?.status === 'active' ? 'disabled' : 'enabled'} successfully`,
    });
  };

  const openDeleteDialog = (webhook: WebhookEndpoint) => {
    setSelectedWebhook(webhook);
    setIsDeleteDialogOpen(true);
  };

  const toggleEventSelection = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhook endpoints to receive real-time event notifications
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Webhooks</CardDescription>
            <CardTitle className="text-2xl text-white">
              {webhooks.filter(w => w.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Successful Deliveries</CardDescription>
            <CardTitle className="text-2xl text-white">
              {webhooks.filter(w => w.lastDelivery?.status === 'success').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failed Deliveries</CardDescription>
            <CardTitle className="text-2xl text-white">
              {webhooks.filter(w => w.lastDelivery?.status === 'failed').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>
            Manage your webhook endpoints and monitor delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Webhooks</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first webhook to receive real-time event notifications
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Last Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div className="max-w-xs truncate font-mono text-sm">
                        {webhook.url}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{webhook.events.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.lastDelivery ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {webhook.lastDelivery.status === 'success' ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">
                              {webhook.lastDelivery.status === 'success' ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(webhook.lastDelivery.timestamp)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Never delivered</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={webhook.status === 'active' ? 'default' : 'secondary'}
                        className={
                          webhook.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : ''
                        }
                      >
                        {webhook.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook)}
                          disabled={testingWebhook === webhook.id || webhook.status === 'disabled'}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWebhookStatus(webhook.id)}
                        >
                          {webhook.status === 'active' ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(webhook)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Available Events */}
      <Card>
        <CardHeader>
          <CardTitle>Available Events</CardTitle>
          <CardDescription>
            Events you can subscribe to via webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {availableEvents.map((event) => (
              <div
                key={event}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                <code className="text-sm">{event}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Configure a new webhook endpoint to receive event notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://api.example.com/webhooks"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Events to Subscribe</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {availableEvents.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => toggleEventSelection(event)}
                    />
                    <label
                      htmlFor={event}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {event}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewWebhookUrl('');
                setSelectedEvents([]);
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateWebhook} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this webhook endpoint? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-2 py-4">
              <div className="text-sm">
                <span className="font-medium">URL:</span>{' '}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {selectedWebhook.url}
                </code>
              </div>
              <div className="text-sm">
                <span className="font-medium">Events:</span>{' '}
                {selectedWebhook.events.join(', ')}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedWebhook(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWebhook}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
