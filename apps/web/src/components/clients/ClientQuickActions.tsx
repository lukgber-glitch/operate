'use client';

import {
  FileText,
  Mail,
  Bell,
  Calendar,
  StickyNote,
  DollarSign,
  MoreHorizontal,
  Download,
  Archive,
} from 'lucide-react';
import { useState } from 'react';

import { AddNoteDialog } from './AddNoteDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { SendEmailDialog } from './SendEmailDialog';
import { SendReminderDialog } from './SendReminderDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import type { Client } from '@/lib/api/crm';

interface ClientQuickActionsProps {
  client: Client;
  invoices?: Array<{
    id: string;
    number: string;
    amount: number;
    currency: string;
    dueDate: string;
    status: string;
  }>;
}

export function ClientQuickActions({ client, invoices = [] }: ClientQuickActionsProps) {
  const { toast } = useToast();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const unpaidInvoices = invoices.filter(
    (inv) => inv.status === 'SENT' || inv.status === 'OVERDUE'
  );

  const handleCreateInvoice = () => {
    // TODO: Navigate to invoice creation with pre-filled client
    toast({
      title: 'Creating invoice',
      description: 'Redirecting to invoice creation...',
    });
  };

  const handleScheduleMeeting = () => {
    // TODO: Open meeting scheduler
    toast({
      title: 'Schedule meeting',
      description: 'Opening calendar scheduler...',
    });
  };

  const handleExportPDF = async () => {
    try {
      // TODO: Call export API
      toast({
        title: 'Exporting',
        description: 'Generating PDF export...',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export client data.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveClient = async () => {
    try {
      // TODO: Call archive API
      toast({
        title: 'Client archived',
        description: 'The client has been archived successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive client.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Button variant="default" onClick={handleCreateInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>

          <Button
            variant="outline"
            onClick={() => setReminderDialogOpen(true)}
            disabled={unpaidInvoices.length === 0}
          >
            <Bell className="h-4 w-4 mr-2" />
            Send Reminder
          </Button>

          <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>

          <Button variant="outline" onClick={handleScheduleMeeting}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>

          <Button variant="outline" onClick={() => setNoteDialogOpen(true)}>
            <StickyNote className="h-4 w-4 mr-2" />
            Add Note
          </Button>

          <Button
            variant="outline"
            onClick={() => setPaymentDialogOpen(true)}
            disabled={unpaidInvoices.length === 0}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export to PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleArchiveClient} className="text-destructive">
              <Archive className="h-4 w-4 mr-2" />
              Archive Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <AddNoteDialog
        clientId={client.id}
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
      />

      <SendEmailDialog
        clientId={client.id}
        clientEmail={client.email}
        clientName={client.name}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />

      <SendReminderDialog
        clientId={client.id}
        clientEmail={client.email}
        clientName={client.name}
        invoices={unpaidInvoices}
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
      />

      <RecordPaymentDialog
        clientId={client.id}
        invoices={unpaidInvoices}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />
    </>
  );
}
