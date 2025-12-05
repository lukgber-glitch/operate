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
import { DatevSKRType } from '@/lib/api/exports';

interface DatevOptionsProps {
  form: UseFormReturn<any>;
}

export function DatevOptions({ form }: DatevOptionsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Configuration</CardTitle>
          <CardDescription>
            Enter your DATEV consultant and client numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyConfig.consultantNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consultant Number (Berater-Nr.)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1234567"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                    />
                  </FormControl>
                  <FormDescription>7-digit consultant number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyConfig.clientNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Number (Mandanten-Nr.)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="12345"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                    />
                  </FormControl>
                  <FormDescription>5-digit client number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyConfig.skrType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chart of Accounts (SKR)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SKR type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={DatevSKRType.SKR03}>
                        SKR03 - Industrial/Commercial
                      </SelectItem>
                      <SelectItem value={DatevSKRType.SKR04}>
                        SKR04 - SME/Services
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Standard chart of accounts</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyConfig.fiscalYearStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscal Year Start</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="20240101"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                    />
                  </FormControl>
                  <FormDescription>Format: YYYYMMDD</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="companyConfig.companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Musterfirma GmbH" {...field} />
                </FormControl>
                <FormDescription>Your company name for the export</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Configure what data to include in the export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="options.includeAccountLabels"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Account Labels</FormLabel>
                  <FormDescription>
                    Include account descriptions (Kontenbeschriftung)
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
            name="options.includeCustomers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Customer Data</FormLabel>
                  <FormDescription>
                    Include customer master data
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
            name="options.includeSuppliers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Supplier Data</FormLabel>
                  <FormDescription>
                    Include supplier master data
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
            name="options.includeTransactions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Transaction Details</FormLabel>
                  <FormDescription>
                    Include transaction details
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
            name="options.label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Export Label (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Q4 2024 Export" {...field} />
                </FormControl>
                <FormDescription>
                  A label to identify this export
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
