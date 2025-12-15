'use client';

import { CheckCircle2, Download, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePublicQuote } from '@/hooks/use-public-quote';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';

interface QuoteAcceptedPageProps {
  params: {
    token: string;
  };
}

export default function QuoteAcceptedPage({ params }: QuoteAcceptedPageProps) {
  const { quote } = usePublicQuote(params.token);

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/public/quotes/${params.token}/pdf`);
      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${params.token}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Quote Accepted!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Thank you for accepting our quote. We will be in touch shortly to proceed with the next
          steps.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Acceptance Confirmation</CardTitle>
          <CardDescription>Quote details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quote && (
            <>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Quote Number</p>
                <p className="font-medium text-slate-900 dark:text-white">{quote.number}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  <CurrencyDisplay
                    amount={quote.totalAmount}
                    currency={quote.currency as CurrencyCode}
                  />
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Company</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {quote.companyInfo.name}
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Accepted On</p>
              <p className="font-medium text-slate-900 dark:text-white">{formatDate()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>A confirmation email has been sent to your registered email address</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Our team will contact you within 1-2 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>We will send you a contract and invoice to complete the process</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={handleDownloadPDF} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Download Quote
        </Button>
        <Link href={`/quote/${params.token}`} className="flex-1">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quote
          </Button>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Questions about your quote?
        </p>
        {quote?.companyInfo.email && (
          <p className="text-sm">
            Contact us at{' '}
            <a
              href={`mailto:${quote.companyInfo.email}`}
              className="text-primary hover:underline"
            >
              {quote.companyInfo.email}
            </a>
          </p>
        )}
        {quote?.companyInfo.phone && (
          <p className="text-sm">
            Call us at{' '}
            <a
              href={`tel:${quote.companyInfo.phone}`}
              className="text-primary hover:underline"
            >
              {quote.companyInfo.phone}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
