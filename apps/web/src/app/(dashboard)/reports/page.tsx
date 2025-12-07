'use client';

import { Download, FileSpreadsheet, Printer, Calendar } from 'lucide-react';
import { useState } from 'react';

import { ClientMetrics } from '@/components/reports/ClientMetrics';
import { DocumentStats } from '@/components/reports/DocumentStats';
import { FinancialOverview } from '@/components/reports/FinancialOverview';
import { TaxSummary } from '@/components/reports/TaxSummary';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReports, useExportReport } from '@/hooks/use-reports';

export default function ReportsPage() {
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
      alert(`Report export initiated! Your ${format.toUpperCase()} will be ready in ${response.estimatedCompletionTime}.`);

      // In a production app, you would trigger a download here
      // window.open(response.downloadUrl, '_blank');
    } catch (error) {
      alert('Failed to export report. Please try again.');
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <HeadlineOutside subtitle="Generate and export business reports and analytics">
          Reports
        </HeadlineOutside>

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
      </div>

      {/* Export Actions */}
      <AnimatedCard variant="elevated" padding="lg">
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
      </AnimatedCard>

      {/* Report Tabs */}
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
            <AnimatedCard variant="elevated" padding="lg">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading financial report...</p>
                </div>
              </div>
            </AnimatedCard>
          ) : financial.isError ? (
            <AnimatedCard variant="elevated" padding="lg">
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load financial report</p>
              </div>
            </AnimatedCard>
          ) : (
            <FinancialOverview data={financial.data} />
          )}
        </TabsContent>

        {/* Tax Report Tab */}
        <TabsContent value="tax" className="space-y-4">
          {isLoading || !tax.data ? (
            <AnimatedCard variant="elevated" padding="lg">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading tax report...</p>
                </div>
              </div>
            </AnimatedCard>
          ) : tax.isError ? (
            <AnimatedCard variant="elevated" padding="lg">
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load tax report</p>
              </div>
            </AnimatedCard>
          ) : (
            <TaxSummary data={tax.data} />
          )}
        </TabsContent>

        {/* Client Metrics Tab */}
        <TabsContent value="clients" className="space-y-4">
          {isLoading || !clients.data ? (
            <AnimatedCard variant="elevated" padding="lg">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading client metrics...</p>
                </div>
              </div>
            </AnimatedCard>
          ) : clients.isError ? (
            <AnimatedCard variant="elevated" padding="lg">
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load client metrics</p>
              </div>
            </AnimatedCard>
          ) : (
            <ClientMetrics data={clients.data} />
          )}
        </TabsContent>

        {/* Document Stats Tab */}
        <TabsContent value="documents" className="space-y-4">
          {isLoading || !documents.data ? (
            <AnimatedCard variant="elevated" padding="lg">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading document statistics...</p>
                </div>
              </div>
            </AnimatedCard>
          ) : documents.isError ? (
            <AnimatedCard variant="elevated" padding="lg">
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load document statistics</p>
              </div>
            </AnimatedCard>
          ) : (
            <DocumentStats data={documents.data} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
