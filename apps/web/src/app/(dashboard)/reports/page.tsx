'use client';

import { Download, FileSpreadsheet, Printer, Calendar } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

import { ClientMetrics } from '@/components/reports/ClientMetrics';
import { DocumentStats } from '@/components/reports/DocumentStats';
import { FinancialOverview } from '@/components/reports/FinancialOverview';
import { TaxSummary } from '@/components/reports/TaxSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FinancialReportSkeleton,
  TaxReportSkeleton,
  ClientMetricsSkeleton,
  DocumentStatsSkeleton,
} from '@/components/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReports, useExportReport } from '@/hooks/use-reports';
import { useToast } from '@/components/ui/use-toast';

function ReportsPageContent() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('q3-2024');
  const [activeTab, setActiveTab] = useState('financial');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all report data using the custom hook
  const { financial, tax, clients, documents, isLoading } = useReports({
    dateRange,
  });

  const { exportReport } = useExportReport();

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      const reportType = activeTab as 'financial' | 'tax' | 'invoices' | 'hr';
      const normalizedFormat = format === 'excel' ? 'xlsx' : format;

      const response = await exportReport(reportType, normalizedFormat, { dateRange });

      // Show success message
      toast({
        title: 'Export Initiated',
        description: `Your ${format.toUpperCase()} will be ready in ${response.estimatedCompletionTime}.`,
      });

      // In a production app, you would trigger a download here
      // window.open(response.downloadUrl, '_blank');
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive',
      });
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and export business reports and analytics</p>
        </div>

        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
              <SelectItem value="ytd-2024">Year to Date 2024</SelectItem>
              <SelectItem value="2023">Full Year 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Export Actions */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
      <Card className="rounded-[16px]">
        <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Export Options</p>
            <p className="text-xs text-muted-foreground">
              Download reports in your preferred format
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Report Tabs */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Financial Report Tab */}
        <TabsContent value="financial" className="space-y-4">
          {isLoading || !financial.data ? (
            <FinancialReportSkeleton />
          ) : financial.isError ? (
            <Card className="rounded-[16px]">
              <CardContent className="p-6">
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load financial report</p>
              </div>
              </CardContent>
            </Card>
          ) : (
            <FinancialOverview data={financial.data} />
          )}
        </TabsContent>

        {/* Tax Report Tab */}
        <TabsContent value="tax" className="space-y-4">
          {isLoading || !tax.data ? (
            <TaxReportSkeleton />
          ) : tax.isError ? (
            <Card className="rounded-[16px]">
              <CardContent className="p-6">
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load tax report</p>
              </div>
              </CardContent>
            </Card>
          ) : (
            <TaxSummary data={tax.data} />
          )}
        </TabsContent>

        {/* Client Metrics Tab */}
        <TabsContent value="clients" className="space-y-4">
          {isLoading || !clients.data ? (
            <ClientMetricsSkeleton />
          ) : clients.isError ? (
            <Card className="rounded-[16px]">
              <CardContent className="p-6">
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load client metrics</p>
              </div>
              </CardContent>
            </Card>
          ) : (
            <ClientMetrics data={clients.data} />
          )}
        </TabsContent>

        {/* Document Stats Tab */}
        <TabsContent value="documents" className="space-y-4">
          {isLoading || !documents.data ? (
            <DocumentStatsSkeleton />
          ) : documents.isError ? (
            <Card className="rounded-[16px]">
              <CardContent className="p-6">
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load document statistics</p>
              </div>
              </CardContent>
            </Card>
          ) : (
            <DocumentStats data={documents.data} />
          )}
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <ReportsPageContent />
    </ErrorBoundary>
  );
}
