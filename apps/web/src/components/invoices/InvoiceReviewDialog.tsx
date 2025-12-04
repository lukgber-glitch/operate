/**
 * Invoice Review Dialog Component
 * Side-by-side view for reviewing extracted invoices
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { InvoiceDataEditor } from './InvoiceDataEditor';
import { InvoiceDocumentViewer } from './InvoiceDocumentViewer';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { ExportMenu } from './ExportMenu';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import {
  CheckCircle2,
  XCircle,
  Edit,
  FileCheck,
  Loader2,
  RotateCcw,
  Keyboard,
} from 'lucide-react';
import type { ExtractedInvoice, ExtractedInvoiceData } from '@/types/extracted-invoice';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInvoiceReviewShortcuts } from '@/hooks/useKeyboardShortcuts';

interface InvoiceReviewDialogProps {
  invoice: ExtractedInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, reason?: string) => void;
  onUpdate: (id: string, data: ExtractedInvoiceData) => void;
  onCreateInvoice?: (id: string) => void;
  loading?: boolean;
}

export function InvoiceReviewDialog({
  invoice,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onUpdate,
  onCreateInvoice,
  loading = false,
}: InvoiceReviewDialogProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedInvoiceData | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  React.useEffect(() => {
    if (invoice) {
      setEditedData(invoice.data);
      setEditMode(false);
      setReviewNotes('');
    }
  }, [invoice]);

  // Keyboard shortcuts
  useInvoiceReviewShortcuts({
    onApprove: invoice ? () => handleApprove() : undefined,
    onReject: invoice ? () => handleReject() : undefined,
    onEdit: invoice ? () => setEditMode((prev) => !prev) : undefined,
    onClose: () => onOpenChange(false),
    enabled: open && !loading,
  });

  if (!invoice) return null;

  const hasChanges = editedData && JSON.stringify(editedData) !== JSON.stringify(invoice.data);

  const handleSaveChanges = () => {
    if (editedData && hasChanges) {
      onUpdate(invoice.id, editedData);
      setEditMode(false);
    }
  };

  const handleResetChanges = () => {
    setEditedData(invoice.data);
    setEditMode(false);
  };

  const handleApprove = () => {
    if (hasChanges) {
      // Save changes first
      onUpdate(invoice.id, editedData!);
    }
    onApprove(invoice.id, reviewNotes || undefined);
  };

  const handleReject = () => {
    onReject(invoice.id, reviewNotes || undefined);
  };

  const canCreateInvoice = invoice.reviewStatus === 'APPROVED' && !invoice.invoiceId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">
                Review Invoice Extraction
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {invoice.data.vendorName || 'Unknown Vendor'} •{' '}
                {invoice.data.invoiceNumber || 'No number'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(true)}
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </Button>
              <ExportMenu
                singleExtraction={invoice}
                variant="ghost"
                size="sm"
              />
              <ConfidenceIndicator
                confidence={invoice.overallConfidence}
                showLabel={true}
                showProgress={false}
              />
              <Badge
                variant={
                  invoice.reviewStatus === 'APPROVED'
                    ? 'default'
                    : invoice.reviewStatus === 'REJECTED'
                    ? 'destructive'
                    : 'outline'
                }
              >
                {invoice.reviewStatus.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="review" className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="confidence">Confidence Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="flex-1 flex gap-4 min-h-0 mt-4">
            {/* Document Viewer - Left Side */}
            <div className="flex-1 border rounded-lg overflow-hidden">
              <InvoiceDocumentViewer
                attachmentId={invoice.id}
                mimeType={invoice.attachmentMimeType}
              />
            </div>

            {/* Data Editor - Right Side */}
            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-semibold">Extracted Data</h3>
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetChanges}
                        disabled={loading}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSaveChanges}
                        disabled={!hasChanges || loading}
                      >
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  {editedData && (
                    <InvoiceDataEditor
                      data={editedData}
                      fieldConfidences={invoice.fieldConfidences}
                      onChange={setEditedData}
                      readOnly={!editMode}
                    />
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="document" className="flex-1 min-h-0 mt-4">
            <div className="border rounded-lg h-full overflow-hidden">
              <InvoiceDocumentViewer
                attachmentId={invoice.id}
                mimeType={invoice.attachmentMimeType}
              />
            </div>
          </TabsContent>

          <TabsContent value="confidence" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <span className="font-semibold">Overall Confidence</span>
                  <ConfidenceIndicator
                    confidence={invoice.overallConfidence}
                    showLabel={true}
                    showProgress={true}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Field Confidence Scores</h4>
                  <div className="space-y-2">
                    {invoice.fieldConfidences.map((fc) => (
                      <div
                        key={fc.field}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span className="text-sm font-medium capitalize">
                          {fc.field.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <ConfidenceIndicator
                          confidence={fc.confidence}
                          showLabel={true}
                          showProgress={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col gap-4">
          {/* Review Notes */}
          <div className="w-full space-y-2">
            <Label htmlFor="reviewNotes">Review Notes (optional)</Label>
            <Textarea
              id="reviewNotes"
              placeholder="Add any notes about this extraction..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading || invoice.reviewStatus === 'REJECTED'}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                onClick={handleApprove}
                disabled={loading || invoice.reviewStatus === 'APPROVED'}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Approve
              </Button>
            </div>

            {canCreateInvoice && onCreateInvoice && (
              <Button
                variant="secondary"
                onClick={() => onCreateInvoice(invoice.id)}
                disabled={loading}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
    </Dialog>
  );
}
