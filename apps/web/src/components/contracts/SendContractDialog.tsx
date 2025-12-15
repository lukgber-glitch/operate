'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const sendSchema = z.object({
  recipientName: z.string().min(1, 'Name is required'),
  recipientEmail: z.string().email('Valid email is required'),
  message: z.string().optional(),
});

type SendFormData = z.infer<typeof sendSchema>;

interface SendContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: SendFormData) => Promise<void>;
  defaultEmail?: string;
  defaultName?: string;
}

export function SendContractDialog({
  open,
  onOpenChange,
  onSend,
  defaultEmail,
  defaultName,
}: SendContractDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SendFormData>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      recipientEmail: defaultEmail || '',
      recipientName: defaultName || '',
      message: '',
    },
  });

  const onSubmit = async (data: SendFormData) => {
    try {
      setIsLoading(true);
      await onSend(data);
      toast({
        title: 'Contract Sent',
        description: `Contract has been sent to ${data.recipientEmail}`,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send contract. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Send Contract for Signature</DialogTitle>
            <DialogDescription>
              Enter the recipient's details to send this contract for e-signature.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                {...register('recipientName')}
                placeholder="John Doe"
              />
              {errors.recipientName && (
                <p className="text-sm text-destructive">
                  {errors.recipientName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                {...register('recipientEmail')}
                placeholder="john@example.com"
              />
              {errors.recipientEmail && (
                <p className="text-sm text-destructive">
                  {errors.recipientEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                {...register('message')}
                placeholder="Add a personal message..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Contract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
