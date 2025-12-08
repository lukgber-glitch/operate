'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const emailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  template: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface SendEmailDialogProps {
  clientId: string;
  clientEmail: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailTemplates = [
  {
    id: 'general',
    name: 'General Inquiry',
    subject: 'Following up on your inquiry',
    body: 'Dear {{clientName}},\n\nThank you for your inquiry. We wanted to follow up with you regarding your request.\n\nBest regards',
  },
  {
    id: 'meeting',
    name: 'Meeting Follow-up',
    subject: 'Thank you for meeting with us',
    body: 'Dear {{clientName}},\n\nThank you for taking the time to meet with us. We appreciate your interest and would like to discuss the next steps.\n\nBest regards',
  },
  {
    id: 'quote',
    name: 'Quote Request',
    subject: 'Your requested quote',
    body: 'Dear {{clientName}},\n\nThank you for your interest in our services. Please find attached the quote you requested.\n\nBest regards',
  },
  {
    id: 'custom',
    name: 'Custom Message',
    subject: '',
    body: '',
  },
];

export function SendEmailDialog({
  clientId,
  clientEmail,
  clientName,
  open,
  onOpenChange,
}: SendEmailDialogProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<File[]>([]);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: clientEmail,
      subject: '',
      message: '',
      template: '',
    },
  });

  const handleTemplateChange = (templateId: string) => {
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      form.setValue('subject', template.subject);
      form.setValue('message', template.body.replace('{{clientName}}', clientName));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EmailFormValues) => {
    try {
      // TODO: Call email sending API with attachments      toast({
        title: 'Email sent',
        description: 'Your email has been sent successfully.',
      });

      onOpenChange(false);
      form.reset();
      setAttachments([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleTemplateChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="recipient@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Type your message here..."
                      className="resize-none"
                      rows={12}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Attachments (Optional)</FormLabel>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add Attachment
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {attachments.length > 0 && (
                <div className="border rounded-md p-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setAttachments([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Send Email</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
