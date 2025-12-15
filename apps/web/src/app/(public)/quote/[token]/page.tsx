'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { QuotePortalView } from '@/components/portal/QuotePortalView';
import { usePublicQuote, useAcceptQuote, useRejectQuote } from '@/hooks/use-public-quote';

interface QuotePortalPageProps {
  params: {
    token: string;
  };
}

export default function QuotePortalPage({ params }: QuotePortalPageProps) {
  const router = useRouter();
  const { quote, isLoading, error } = usePublicQuote(params.token);
  const { acceptQuote, isLoading: isAccepting } = useAcceptQuote(params.token);
  const {
    rejectQuote,
    downloadPDF,
    isLoading: isRejecting,
  } = useRejectQuote(params.token);

  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Mark quote as viewed on mount
  useEffect(() => {
    const markAsViewed = async () => {
      if (quote && (quote.status === 'SENT' || quote.status === 'DRAFT')) {
        try {
          await fetch(`/api/public/quotes/${params.token}/view`, { method: 'POST' });
        } catch (error) {
          console.error('Failed to mark quote as viewed:', error);
        }
      }
    };

    markAsViewed();
  }, [quote, params.token]);

  const handleAccept = () => {
    setShowAcceptDialog(true);
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmAccept = async () => {
    try {
      await acceptQuote(notes);
      setShowAcceptDialog(false);
      router.push(`/quote/${params.token}/accepted`);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const confirmReject = async () => {
    try {
      await rejectQuote(rejectReason);
      setShowRejectDialog(false);
      router.refresh();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Quote not found or the link has expired.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto py-8">
        <QuotePortalView
          quote={quote}
          onDownloadPDF={downloadPDF}
          onAccept={handleAccept}
          onReject={handleReject}
          isProcessing={isAccepting || isRejecting}
        />
      </div>

      {/* Accept Quote Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quote</DialogTitle>
            <DialogDescription>
              You are about to accept quote {quote.number}. This action will notify the sender
              that you agree to the terms.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={isAccepting}
            >
              Cancel
            </Button>
            <Button onClick={confirmAccept} disabled={isAccepting}>
              {isAccepting ? 'Accepting...' : 'Accept Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Quote Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Quote</DialogTitle>
            <DialogDescription>
              Please let us know why you are declining this quote. This helps us improve our
              service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Reason for Declining (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Tell us why you're declining this quote..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={isRejecting}
            >
              {isRejecting ? 'Declining...' : 'Decline Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
