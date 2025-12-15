'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvoicePortalView } from '@/components/portal/InvoicePortalView';
import { usePublicInvoice, useRecordPayment } from '@/hooks/use-public-invoice';

interface InvoicePortalPageProps {
  params: {
    token: string;
  };
}

export default function InvoicePortalPage({ params }: InvoicePortalPageProps) {
  const router = useRouter();
  const { invoice, isLoading, error } = usePublicInvoice(params.token);
  const { downloadPDF, isLoading: isDownloading } = useRecordPayment(params.token);

  const handlePayNow = () => {
    router.push(`/invoice/${params.token}/pay`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Invoice not found or the link has expired.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <InvoicePortalView
        invoice={invoice}
        onDownloadPDF={downloadPDF}
        onPayNow={handlePayNow}
        isDownloading={isDownloading}
      />
    </div>
  );
}
