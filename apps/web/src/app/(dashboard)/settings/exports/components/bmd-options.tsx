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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BmdExportType } from '@/lib/api/exports';

interface BmdOptionsProps {
  form: UseFormReturn<any>;
}

const exportTypeLabels: Record<BmdExportType, { label: string; description: string }> = {
  [BmdExportType.BOOKING_JOURNAL]: {
    label: 'Booking Journal',
    description: 'Buchungsjournal - All bookings',
  },
  [BmdExportType.CHART_OF_ACCOUNTS]: {
    label: 'Chart of Accounts',
    description: 'Kontenstamm - Account master data',
  },
  [BmdExportType.CUSTOMERS]: {
    label: 'Customers',
    description: 'Kundenstamm - Customer master data',
  },
  [BmdExportType.SUPPLIERS]: {
    label: 'Suppliers',
    description: 'Lieferantenstamm - Supplier master data',
  },
  [BmdExportType.TAX_ACCOUNTS]: {
    label: 'Tax Accounts',
    description: 'Steuerkonto-Zuordnung - Tax account mapping',
  },
};

export function BmdOptions({ form }: BmdOptionsProps) {
  const selectedTypes = form.watch('exportTypes') || [];

  const handleTypeToggle = (type: BmdExportType, checked: boolean) => {
    const current = form.getValues('exportTypes') || [];
    if (checked) {
      form.setValue('exportTypes', [...current, type]);
    } else {
      form.setValue('exportTypes', current.filter((t: BmdExportType) => t !== type));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Export Types</CardTitle>
          <CardDescription>
            Select which data types to include in the export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(exportTypeLabels).map(([type, { label, description }]) => (
            <div
              key={type}
              className="flex flex-row items-start space-x-3 rounded-lg border p-4"
            >
              <Checkbox
                checked={selectedTypes.includes(type)}
                onCheckedChange={(checked) => handleTypeToggle(type as BmdExportType, checked === true)}
              />
              <div className="space-y-1 leading-none">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {label}
                </label>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
          {selectedTypes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Please select at least one export type
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Format Options</CardTitle>
          <CardDescription>
            Configure the output format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="options.accountingFramework"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accounting Framework</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EKR">
                      EKR - Einheits-Kontenrahmen (Standard)
                    </SelectItem>
                    <SelectItem value="BAB">
                      BAB - Betriebsabrechnungsbogen
                    </SelectItem>
                    <SelectItem value="CUSTOM">
                      Custom - Custom chart of accounts
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Austrian accounting framework
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="options.useSemicolon"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Use Semicolon Delimiter</FormLabel>
                  <FormDescription>
                    Use semicolon (;) instead of comma for CSV
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
            name="options.includeHeader"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Include Header Row</FormLabel>
                  <FormDescription>
                    Include column headers in CSV files
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
            name="options.useIsoEncoding"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">ISO-8859-1 Encoding</FormLabel>
                  <FormDescription>
                    Use ISO-8859-1 encoding instead of UTF-8
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
          <CardTitle>Data Filters</CardTitle>
          <CardDescription>
            Filter what data to include
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="options.postedOnly"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Posted Transactions Only</FormLabel>
                  <FormDescription>
                    Include only posted transactions (Gegenbuchungen)
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
            name="includeArchived"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Include Archived Data</FormLabel>
                  <FormDescription>
                    Include archived or deleted records
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
