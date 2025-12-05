'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import { useUpdateClient } from '@/hooks/use-clients';

const addressSchema = z.object({
  type: z.enum(['PRIMARY', 'BILLING', 'SHIPPING', 'REGISTERED']),
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().min(2, 'Country code is required'),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  type: 'PRIMARY' | 'BILLING' | 'SHIPPING' | 'REGISTERED';
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode: string;
  isPrimary?: boolean;
}

interface AddAddressDialogProps {
  clientId: string;
  address?: Address | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAddressDialog({ clientId, address, open, onOpenChange }: AddAddressDialogProps) {
  const updateMutation = useUpdateClient();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          type: address.type,
          street: address.street || '',
          city: address.city || '',
          postalCode: address.postalCode || '',
          countryCode: address.countryCode,
        }
      : {
          type: 'PRIMARY',
          street: '',
          city: '',
          postalCode: '',
          countryCode: 'DE',
        },
  });

  const onSubmit = async (data: AddressFormValues) => {
    // Determine which address field to update based on type
    const addressData: any = {};

    if (data.type === 'PRIMARY') {
      addressData.address = {
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        countryCode: data.countryCode,
      };
    } else if (data.type === 'BILLING') {
      addressData.billingAddress = {
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        countryCode: data.countryCode,
      };
    }

    await updateMutation.mutateAsync({
      id: clientId,
      data: addressData,
    });

    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'Add Address'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select address type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PRIMARY">Primary Address</SelectItem>
                      <SelectItem value="BILLING">Billing Address</SelectItem>
                      <SelectItem value="SHIPPING">Shipping Address</SelectItem>
                      <SelectItem value="REGISTERED">Registered Address</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10115" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Berlin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country Code</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DE">Germany (DE)</SelectItem>
                      <SelectItem value="AT">Austria (AT)</SelectItem>
                      <SelectItem value="CH">Switzerland (CH)</SelectItem>
                      <SelectItem value="FR">France (FR)</SelectItem>
                      <SelectItem value="IT">Italy (IT)</SelectItem>
                      <SelectItem value="NL">Netherlands (NL)</SelectItem>
                      <SelectItem value="BE">Belgium (BE)</SelectItem>
                      <SelectItem value="PL">Poland (PL)</SelectItem>
                      <SelectItem value="ES">Spain (ES)</SelectItem>
                      <SelectItem value="PT">Portugal (PT)</SelectItem>
                      <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                      <SelectItem value="US">United States (US)</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={updateMutation.isPending}>
                {address ? 'Update Address' : 'Add Address'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
