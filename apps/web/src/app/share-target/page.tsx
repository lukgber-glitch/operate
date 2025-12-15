'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Image, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ShareTargetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSharedContent = async () => {
      try {
        // Get shared data from URL params (for text/url shares)
        const title = searchParams.get('title');
        const text = searchParams.get('text');
        const url = searchParams.get('url');

        // For file shares, we need to handle FormData
        // This would typically come from a POST request
        const hasFiles = searchParams.has('files');

        if (hasFiles) {
          // Route to expense scanner for receipt/document uploads
          router.push('/finance/expenses/scan');
        } else if (url) {
          // Shared URL - could be an invoice link or document
          router.push(`/documents?shared_url=${encodeURIComponent(url)}`);
        } else if (text || title) {
          // Shared text - route to chat or notes
          const sharedText = `${title ? title + '\n' : ''}${text || ''}`;
          router.push(`/chat?shared_text=${encodeURIComponent(sharedText)}`);
        } else {
          // No recognized share data, go to dashboard
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error handling shared content:', err);
        setError('Failed to process shared content');
        setProcessing(false);

        // Redirect to dashboard after error
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    };

    handleSharedContent();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Error Processing Share</h2>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Processing Shared Content</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Please wait while we process your shared content...
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
