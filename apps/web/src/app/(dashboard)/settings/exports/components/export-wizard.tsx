'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  FileSpreadsheet,
  FileCode,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExportFormatSelector } from './export-format-selector';
import { DatevOptions } from './datev-options';
import { SaftOptions } from './saft-options';
import { BmdOptions } from './bmd-options';
import {
  useExportWizard,
  useCreateDatevExport,
  useCreateSaftExport,
  useCreateBmdExport,
  useExportStatus,
  useDownloadExport,
} from '@/hooks/use-exports';
import {
  ExportFormat,
  DatevSKRType,
  SaftVariant,
  SaftExportScope,
  BmdExportType,
  ExportStatus,
} from '@/lib/api/exports';
import { cn } from '@/lib/utils';

// Base schema for date range
const dateRangeSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

// DATEV schema
const datevSchema = z.object({
  dateRange: dateRangeSchema,
  companyConfig: z.object({
    consultantNumber: z.number().min(1).max(9999999),
    clientNumber: z.number().min(1).max(99999),
    fiscalYearStart: z.number().min(19000101).max(21000101),
    skrType: z.nativeEnum(DatevSKRType),
    companyName: z.string().optional(),
  }),
  options: z.object({
    includeAccountLabels: z.boolean().default(true),
    includeCustomers: z.boolean().default(true),
    includeSuppliers: z.boolean().default(true),
    includeTransactions: z.boolean().default(true),
    label: z.string().optional(),
  }).optional(),
});

// SAF-T schema
const saftSchema = z.object({
  variant: z.nativeEnum(SaftVariant),
  scope: z.nativeEnum(SaftExportScope),
  dateRange: dateRangeSchema,
  includeOpeningBalances: z.boolean().default(true),
  includeClosingBalances: z.boolean().default(true),
  includeTaxDetails: z.boolean().default(true),
  includeCustomerSupplierDetails: z.boolean().default(true),
  compression: z.boolean().default(false),
  validation: z.boolean().default(true),
  description: z.string().optional(),
});

// BMD schema
const bmdSchema = z.object({
  exportTypes: z.array(z.nativeEnum(BmdExportType)).min(1, 'Select at least one export type'),
  dateRange: dateRangeSchema,
  options: z.object({
    accountingFramework: z.string().default('EKR'),
    useSemicolon: z.boolean().default(true),
    includeHeader: z.boolean().default(true),
    useIsoEncoding: z.boolean().default(false),
    postedOnly: z.boolean().default(true),
  }).optional(),
  includeArchived: z.boolean().default(false),
});

const STEPS = [
  { number: 1, title: 'Format', description: 'Select export format' },
  { number: 2, title: 'Date Range', description: 'Choose period' },
  { number: 3, title: 'Options', description: 'Configure settings' },
  { number: 4, title: 'Review', description: 'Review and export' },
];

export function ExportWizard() {
  const {
    currentStep,
    selectedFormat,
    currentExportId,
    setCurrentStep,
    setSelectedFormat,
    setCurrentExportId,
    nextStep,
    prevStep,
    resetWizard,
  } = useExportWizard();

  const datevMutation = useCreateDatevExport();
  const saftMutation = useCreateSaftExport();
  const bmdMutation = useCreateBmdExport();
  const downloadMutation = useDownloadExport();

  // Form with dynamic schema based on selected format
  const getSchema = () => {
    if (selectedFormat === ExportFormat.DATEV) return datevSchema;
    if (selectedFormat === ExportFormat.SAFT) return saftSchema;
    if (selectedFormat === ExportFormat.BMD) return bmdSchema;
    return z.object({});
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: getDefaultValues(selectedFormat),
  });

  // Poll export status
  const { data: exportStatus } = useExportStatus(
    currentExportId || '',
    selectedFormat as ExportFormat,
    !!currentExportId && currentStep === 3
  );

  // Update export status
  useEffect(() => {
    if (exportStatus?.status === ExportStatus.READY || exportStatus?.status === ExportStatus.COMPLETED) {
      // Export is ready
    }
  }, [exportStatus]);

  const handleFormatSelect = (format: ExportFormat) => {
    setSelectedFormat(format);
    form.reset(getDefaultValues(format));
    nextStep();
  };

  const handleDateRangeNext = () => {
    form.trigger(['dateRange.startDate', 'dateRange.endDate']).then((valid) => {
      if (valid) {
        nextStep();
      }
    });
  };

  const handleSubmit = async (data: any) => {
    try {
      // Add orgId (would come from auth context in real app)
      const orgId = 'org-123'; // TODO: Get from auth context

      let response;

      if (selectedFormat === ExportFormat.DATEV) {
        response = await datevMutation.mutateAsync({
          orgId,
          ...data,
        });
      } else if (selectedFormat === ExportFormat.SAFT) {
        response = await saftMutation.mutateAsync(data);
      } else if (selectedFormat === ExportFormat.BMD) {
        response = await bmdMutation.mutateAsync({
          orgId,
          ...data,
        });
      }

      if (response) {
        setCurrentExportId(response.id);
        nextStep();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDownload = () => {
    if (currentExportId && selectedFormat) {
      downloadMutation.mutate({ id: currentExportId, format: selectedFormat });
    }
  };

  const handleNewExport = () => {
    resetWizard();
    form.reset();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Select Export Format</h2>
            <p className="text-muted-foreground mb-6">
              Choose the accounting format for your export
            </p>
            <ExportFormatSelector
              selectedFormat={selectedFormat}
              onSelectFormat={handleFormatSelect}
            />
          </div>
        );

      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Select Date Range</h2>
            <p className="text-muted-foreground mb-6">
              Choose the period for your export
            </p>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateRange.startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>Beginning of the period</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateRange.endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>End of the period</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Configure Options</h2>
            <p className="text-muted-foreground mb-6">
              Set format-specific options for your export
            </p>
            {selectedFormat === ExportFormat.DATEV && <DatevOptions form={form} />}
            {selectedFormat === ExportFormat.SAFT && <SaftOptions form={form} />}
            {selectedFormat === ExportFormat.BMD && <BmdOptions form={form} />}
          </div>
        );

      case 3:
        const isProcessing =
          exportStatus?.status === ExportStatus.PENDING ||
          exportStatus?.status === ExportStatus.PROCESSING ||
          exportStatus?.status === ExportStatus.VALIDATING;
        const isReady =
          exportStatus?.status === ExportStatus.READY ||
          exportStatus?.status === ExportStatus.COMPLETED;
        const isFailed = exportStatus?.status === ExportStatus.FAILED;

        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Export Status</h2>
            <p className="text-muted-foreground mb-6">
              Your export is being generated
            </p>

            <Card>
              <CardContent className="pt-6 space-y-6">
                {isProcessing && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Generating your export...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This may take a few moments
                      </p>
                    </div>
                  </div>
                )}

                {isReady && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                        <Check className="h-12 w-12 text-green-600 dark:text-green-300" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-lg">Export Ready!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your export is ready to download
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button onClick={handleDownload} disabled={downloadMutation.isPending}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Export
                      </Button>
                      <Button variant="outline" onClick={handleNewExport}>
                        Create New Export
                      </Button>
                    </div>
                  </div>
                )}

                {isFailed && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Export Failed</AlertTitle>
                    <AlertDescription>
                      {exportStatus?.errorMessage || 'An error occurred during export'}
                    </AlertDescription>
                  </Alert>
                )}

                {exportStatus && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Format:</span>
                      <Badge variant="outline">{selectedFormat}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge>{exportStatus.status}</Badge>
                    </div>
                    {exportStatus.filename && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Filename:</span>
                        <span className="font-mono text-xs">{exportStatus.filename}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                  currentStep >= index
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > index ? <Check className="h-5 w-5" /> : step.number}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-4',
                  currentStep > index ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep !== 3 && (
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={currentStep === 1 ? handleDateRangeNext : nextStep}
                  disabled={currentStep === 0 && !selectedFormat}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit">
                  Create Export
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

function getDefaultValues(format: ExportFormat | null) {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const baseDefaults = {
    dateRange: {
      startDate: format === ExportFormat.DATEV
        ? format(startOfYear, 'yyyy-MM-dd')
        : format(startOfYear, 'yyyy-MM-dd'),
      endDate: format === ExportFormat.DATEV
        ? format(today, 'yyyy-MM-dd')
        : format(today, 'yyyy-MM-dd'),
    },
  };

  if (format === ExportFormat.DATEV) {
    return {
      ...baseDefaults,
      companyConfig: {
        consultantNumber: undefined,
        clientNumber: undefined,
        fiscalYearStart: parseInt(format(startOfYear, 'yyyyMMdd')),
        skrType: DatevSKRType.SKR03,
        companyName: '',
      },
      options: {
        includeAccountLabels: true,
        includeCustomers: true,
        includeSuppliers: true,
        includeTransactions: true,
        label: '',
      },
    };
  }

  if (format === ExportFormat.SAFT) {
    return {
      ...baseDefaults,
      variant: SaftVariant.INTERNATIONAL,
      scope: SaftExportScope.FULL,
      includeOpeningBalances: true,
      includeClosingBalances: true,
      includeTaxDetails: true,
      includeCustomerSupplierDetails: true,
      compression: false,
      validation: true,
      description: '',
    };
  }

  if (format === ExportFormat.BMD) {
    return {
      ...baseDefaults,
      exportTypes: [],
      options: {
        accountingFramework: 'EKR',
        useSemicolon: true,
        includeHeader: true,
        useIsoEncoding: false,
        postedOnly: true,
      },
      includeArchived: false,
    };
  }

  return baseDefaults;
}
