'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const reminderSchema = z.object({
  invoiceIds: z.array(z.string()).min(1, 'Select at least one invoice'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  scheduledFor: z.string().optional(),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

interface SendReminderDialogProps {
  clientId: string;
  clientEmail: string;
  clientName: string;
  invoices?: Array<{ id: string; number: string; amount: number; dueDate: string; currency: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendReminderDialog({
  clientId,
  clientEmail,
  clientName,
  invoices = [],
  open,
  onOpenChange,
}: SendReminderDialogProps) {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      invoiceIds: [],
      subject: `Payment Reminder - Outstanding Invoices`,
      message: `Dear ${clientName},\n\nThis is a friendly reminder that the following invoice(s) are currently outstanding:\n\n[INVOICE_LIST]\n\nPlease arrange payment at your earliest convenience. If you have already sent payment, please disregard this message.\n\nThank you for your business.\n\nBest regards`,
      scheduledFor: '',
    },
  });

  const selectedInvoiceIds = form.watch('invoiceIds');
  const selectedInvoices = invoices.filter((inv) => selectedInvoiceIds.includes(inv.id));

  const generateInvoiceList = () => {
    return selectedInvoices
      .map(
        (inv) =>
          `- Invoice ${inv.number}: ${inv.currency} ${inv.amount.toFixed(2)} (Due: ${new Date(inv.dueDate).toLocaleDateString()})`
      )
      .join('\n');
  };

  const getPreviewMessage = () => {
    const message = form.getValues('message');
    return message.replace('[INVOICE_LIST]', generateInvoiceList());
  };

  const onSubmit = async (data: ReminderFormValues) => {
    try {
      const messageWithInvoices = data.message.replace('[INVOICE_LIST]', generateInvoiceList());

      // TODO: Call reminder API      toast({
        title: data.scheduledFor ? 'Reminder scheduled' : 'Reminder sent',
        description: data.scheduledFor
          ? 'The reminder has been scheduled successfully.'
          : 'The reminder has been sent successfully.',
      });

      onOpenChange(false);
      form.reset();
      setShowPreview(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reminder.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Payment Reminder</DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <FormLabel>Select Invoices</FormLabel>
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                  {invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No overdue invoices</p>
                  ) : (
                    invoices.map((invoice) => (
                      <FormField
                        key={invoice.id}
                        control={form.control}
                        name="invoiceIds"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(invoice.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  field.onChange(
                                    checked
                                      ? [...current, invoice.id]
                                      : current.filter((id) => id !== invoice.id)
                                  );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              <span className="font-medium">{invoice.number}</span> -{' '}
                              {invoice.currency} {invoice.amount.toFixed(2)} (Due:{' '}
                              {new Date(invoice.dueDate).toLocaleDateString()})
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))
                  )}
                </div>
                {form.formState.errors.invoiceIds && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.invoiceIds.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your reminder message..."
                        className="resize-none"
                        rows={10}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Use [INVOICE_LIST] to automatically insert invoice details
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule for Later (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Leave empty to send immediately
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  disabled={selectedInvoiceIds.length === 0}
                >
                  Preview
                </Button>
                <Button type="submit" disabled={selectedInvoiceIds.length === 0}>
                  {form.watch('scheduledFor') ? 'Schedule Reminder' : 'Send Reminder'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/50">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">To:</p>
                  <p>{clientEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subject:</p>
                  <p>{form.getValues('subject')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Message:</p>
                  <pre className="whitespace-pre-wrap font-sans">{getPreviewMessage()}</pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowPreview(false)}>
                Back to Edit
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)}>
                {form.watch('scheduledFor') ? 'Schedule Reminder' : 'Send Reminder'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
