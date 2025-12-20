'use client';

import {
  Mail,
  Phone,
  Users,
  FileText,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Link as LinkIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCommunication } from '@/hooks/use-clients';
import type { Communication, CommunicationType, CommunicationDirection } from '@/lib/api/crm';
import { cn } from '@/lib/utils';

interface CommunicationTimelineProps {
  clientId: string;
  communications: Communication[];
}

const communicationIcons: Record<CommunicationType, React.ElementType> = {
  EMAIL: Mail,
  PHONE: Phone,
  MEETING: Users,
  NOTE: FileText,
  TASK: FileText,
};

const communicationColors: Record<CommunicationType, string> = {
  EMAIL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  PHONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  MEETING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  NOTE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  TASK: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

interface CommunicationFormData {
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  content: string;
  date: string;
  linkedEntityType: '' | 'INVOICE' | 'PAYMENT' | 'QUOTE';
  linkedEntityId: string;
}

export function CommunicationTimeline({ clientId, communications }: CommunicationTimelineProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const createMutation = useCreateCommunication();

  const [formData, setFormData] = useState<CommunicationFormData>({
    type: 'EMAIL',
    direction: 'OUTBOUND',
    subject: '',
    content: '',
    date: new Date().toISOString().slice(0, 16),
    linkedEntityType: '',
    linkedEntityId: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'EMAIL',
      direction: 'OUTBOUND',
      subject: '',
      content: '',
      date: new Date().toISOString().slice(0, 16),
      linkedEntityType: '',
      linkedEntityId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      clientId,
      type: formData.type,
      direction: formData.direction,
      subject: formData.subject,
      content: formData.content || undefined,
      date: formData.date,
      linkedEntityType: formData.linkedEntityType || undefined,
      linkedEntityId: formData.linkedEntityId || undefined,
    });

    setIsAddOpen(false);
    resetForm();
  };

  const sortedCommunications = [...communications].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Communications</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Communication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Communication</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as CommunicationType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="PHONE">Phone Call</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="NOTE">Note</SelectItem>
                      <SelectItem value="TASK">Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Direction *</Label>
                  <Select
                    value={formData.direction}
                    onValueChange={(value) =>
                      setFormData({ ...formData, direction: value as CommunicationDirection })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INBOUND">Inbound</SelectItem>
                      <SelectItem value="OUTBOUND">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date & Time *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of the communication"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Detailed notes or content..."
                  rows={5}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Link to Entity (Optional)</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="linkedEntityType">Entity Type</Label>
                    <Select
                      value={formData.linkedEntityType || 'none'}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          linkedEntityType: (value === 'none' ? '' : value) as '' | 'INVOICE' | 'PAYMENT' | 'QUOTE',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="INVOICE">Invoice</SelectItem>
                        <SelectItem value="PAYMENT">Payment</SelectItem>
                        <SelectItem value="QUOTE">Quote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.linkedEntityType && (
                    <div className="space-y-2">
                      <Label htmlFor="linkedEntityId">Entity ID</Label>
                      <Input
                        id="linkedEntityId"
                        value={formData.linkedEntityId}
                        onChange={(e) =>
                          setFormData({ ...formData, linkedEntityId: e.target.value })
                        }
                        placeholder="Enter ID"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Log Communication'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sortedCommunications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No communications yet</p>
            <p className="text-sm text-muted-foreground">
              Log your first communication to start tracking interactions
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {sortedCommunications.map((comm) => {
              const Icon = communicationIcons[comm.type];
              return (
                <div key={comm.id} className="relative flex gap-4">
                  <div
                    className={cn(
                      'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-background z-10',
                      communicationColors[comm.type]
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <Card className="flex-1">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{comm.subject}</h4>
                            {comm.direction === 'INBOUND' ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(comm.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={communicationColors[comm.type]}>
                            {comm.type}
                          </Badge>
                          <Badge variant="outline">
                            {comm.direction === 'INBOUND' ? 'Inbound' : 'Outbound'}
                          </Badge>
                        </div>
                      </div>
                      {comm.content && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {comm.content}
                        </p>
                      )}
                      {comm.linkedEntityType && comm.linkedEntityId && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LinkIcon className="h-4 w-4" />
                            <span>
                              Linked to {comm.linkedEntityType}: {comm.linkedEntityId}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
