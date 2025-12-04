'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from '@/components/ui/switch';
import { SaftVariant, SaftExportScope } from '@/lib/api/exports';

interface SaftOptionsProps {
  form: UseFormReturn<any>;
}

const variantLabels: Record<SaftVariant, string> = {
  [SaftVariant.INTERNATIONAL]: 'International (OECD 2.0)',
  [SaftVariant.PORTUGAL]: 'Portugal (SAF-T PT)',
  [SaftVariant.NORWAY]: 'Norway (SAF-T NO)',
  [SaftVariant.AUSTRIA]: 'Austria (SAF-T AT)',
  [SaftVariant.POLAND]: 'Poland (JPK)',
  [SaftVariant.LUXEMBOURG]: 'Luxembourg (SAF-T LU)',
};

const scopeLabels: Record<SaftExportScope, { label: string; description: string }> = {
  [SaftExportScope.FULL]: {
    label: 'Full Audit File',
    description: 'Complete audit file with all data',
  },
  [SaftExportScope.MASTER_FILES]: {
    label: 'Master Files Only',
    description: 'Only master data (accounts, customers, suppliers)',
  },
  [SaftExportScope.TRANSACTIONS]: {
    label: 'Transactions Only',
    description: 'Only transaction data',
  },
  [SaftExportScope.SOURCE_DOCUMENTS]: {
    label: 'Source Documents',
    description: 'Only source documents',
  },
};

export function SaftOptions({ form }: SaftOptionsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>SAF-T Configuration</CardTitle>
          <CardDescription>
            Select variant and scope for your SAF-T export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="variant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country Variant</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country variant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(variantLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the country-specific SAF-T variant
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Export Scope</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select export scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(scopeLabels).map(([value, { label, description }]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">{description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Define what data to include
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Tax audit Q4 2024" {...field} />
                </FormControl>
                <FormDescription>
                  A description for this export
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Options</CardTitle>
          <CardDescription>
            Configure what data to include in the export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="includeOpeningBalances"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Opening Balances</FormLabel>
                  <FormDescription>
                    Include opening balances for the period
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="includeClosingBalances"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Closing Balances</FormLabel>
                  <FormDescription>
                    Include closing balances for the period
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="includeTaxDetails"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Tax Details</FormLabel>
                  <FormDescription>
                    Include detailed tax information
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="includeCustomerSupplierDetails"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Customer & Supplier Details</FormLabel>
                  <FormDescription>
                    Include customer and supplier master data
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Output Options</CardTitle>
          <CardDescription>
            Configure output format and validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="compression"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Compress Output</FormLabel>
                  <FormDescription>
                    Create ZIP archive of the XML file
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="validation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">XSD Validation</FormLabel>
                  <FormDescription>
                    Validate XML against XSD schema
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
