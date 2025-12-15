/**
 * DocumentViewer Component
 * Split-view document modal that slides out from the right side
 * Supports PDF preview, image preview, and invoice/bill formatted views
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Printer,
  Share2,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    type: 'PDF' | 'IMAGE' | 'INVOICE' | 'BILL' | 'EXPENSE';
    title: string;
    url?: string;
    data?: any;
  };
}

/**
 * Formatted view for invoice/bill documents
 */
function FormattedDocumentView({ data, type }: { data: any; type: string }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No document data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {type === 'INVOICE' ? 'Invoice' : type === 'BILL' ? 'Bill' : 'Expense'}
          </h2>
          <Badge variant="outline" className="text-sm">
            {data.status || 'Draft'}
          </Badge>
        </div>
        {data.number && (
          <p className="text-sm text-muted-foreground">
            {type === 'INVOICE' ? 'Invoice' : 'Bill'} #{data.number}
          </p>
        )}
      </div>

      <Separator />

      {/* Parties Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From */}
        {data.from && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              From
            </h3>
            <div className="text-sm">
              <p className="font-medium">{data.from.name}</p>
              {data.from.address && <p className="text-muted-foreground">{data.from.address}</p>}
              {data.from.email && <p className="text-muted-foreground">{data.from.email}</p>}
              {data.from.phone && <p className="text-muted-foreground">{data.from.phone}</p>}
            </div>
          </div>
        )}

        {/* To */}
        {data.to && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              To
            </h3>
            <div className="text-sm">
              <p className="font-medium">{data.to.name}</p>
              {data.to.address && <p className="text-muted-foreground">{data.to.address}</p>}
              {data.to.email && <p className="text-muted-foreground">{data.to.email}</p>}
              {data.to.phone && <p className="text-muted-foreground">{data.to.phone}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Dates and Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.date && (
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Date</p>
            <p className="text-sm font-medium">{data.date}</p>
          </div>
        )}
        {data.dueDate && (
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Due Date</p>
            <p className="text-sm font-medium">{data.dueDate}</p>
          </div>
        )}
        {data.paymentTerms && (
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Terms</p>
            <p className="text-sm font-medium">{data.paymentTerms}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Line Items */}
      {data.items && data.items.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase">
            Items
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{item.description || item.name}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{item.quantity || 1}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.price ? `$${Number(item.price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {item.total
                        ? `$${Number(item.total).toFixed(2)}`
                        : item.price && item.quantity
                        ? `$${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full md:w-1/2 space-y-2">
          {data.subtotal && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${Number(data.subtotal).toFixed(2)}</span>
            </div>
          )}
          {data.tax && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">${Number(data.tax).toFixed(2)}</span>
            </div>
          )}
          {data.discount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium">-${Number(data.discount).toFixed(2)}</span>
            </div>
          )}
          <Separator />
          {data.total && (
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">${Number(data.total).toFixed(2)}</span>
            </div>
          )}
          {data.amountPaid && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-medium">${Number(data.amountPaid).toFixed(2)}</span>
            </div>
          )}
          {data.amountDue && (
            <div className="flex justify-between text-base">
              <span className="font-semibold text-destructive">Amount Due</span>
              <span className="font-bold text-destructive">
                ${Number(data.amountDue).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * PDF Viewer Component
 */
function PDFViewer({ url, zoom }: { url: string; zoom: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center min-h-full p-4 bg-muted/20">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading PDF...</p>
          </div>
        </div>
      )}
      {error ? (
        <div className="text-center text-destructive">
          <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Failed to load PDF</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      ) : (
        <iframe
          src={url}
          className="w-full h-full border-0 rounded"
          style={{
            minHeight: '80vh',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
          title="PDF Document"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError('Failed to load PDF');
            setLoading(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Image Viewer Component with zoom capability
 */
function ImageViewer({ url, zoom }: { url: string; zoom: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center min-h-full p-4 bg-muted/20">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading image...</p>
          </div>
        </div>
      )}
      {error ? (
        <div className="text-center text-destructive">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Failed to load image</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      ) : (
        <img
          src={url}
          alt="Document"
          className="max-w-full h-auto rounded shadow-lg transition-transform duration-200"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center',
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError('Failed to load image');
            setLoading(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Get document type icon
 */
function getDocumentIcon(type: string) {
  switch (type) {
    case 'PDF':
      return FileText;
    case 'IMAGE':
      return ImageIcon;
    case 'INVOICE':
    case 'BILL':
    case 'EXPENSE':
      return FileText;
    default:
      return FileIcon;
  }
}

/**
 * DocumentViewer Component
 * Slide-out panel for viewing documents without leaving the chat
 */
export function DocumentViewer({ isOpen, onClose, document }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const Icon = getDocumentIcon(document.type);

  // Reset zoom when document changes
  useEffect(() => {
    setZoom(100);
  }, [document.id]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      window.document.body.style.overflow = 'hidden';
    } else {
      window.document.body.style.overflow = '';
    }

    return () => {
      window.document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDownload = () => {
    if (!document.url) return;

    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = `${document.title}.${document.type.toLowerCase()}`;
    link.click();
  };

  const handlePrint = () => {
    if (!document.url) return;
    const printWindow = window.open(document.url, '_blank');
    printWindow?.print();
  };

  const handleShare = async () => {
    if (!document.url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: document.url,
        });
      } catch (error) {
        // User cancelled share or share failed
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(document.url);
      // Could show a toast notification here
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const isFormattedView = ['INVOICE', 'BILL', 'EXPENSE'].includes(document.type) && document.data;
  const showZoomControls =
    document.type === 'PDF' || document.type === 'IMAGE' || !isFormattedView;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring' as const,
              damping: 30,
              stiffness: 300,
            }}
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50 w-full md:w-[600px] lg:w-[800px]',
              'bg-background border-l shadow-2xl',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold truncate">{document.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {document.type} {document.type === 'PDF' || document.type === 'IMAGE' ? 'Document' : ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
                aria-label="Close document viewer"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                {showZoomControls && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoom <= 50}
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[4ch] text-center">
                      {zoom}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoom >= 200}
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {document.url && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(document.url, '_blank')}
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrint}
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="h-full"
              >
                {isFormattedView ? (
                  <FormattedDocumentView data={document.data} type={document.type} />
                ) : document.type === 'PDF' && document.url ? (
                  <PDFViewer url={document.url} zoom={zoom} />
                ) : document.type === 'IMAGE' && document.url ? (
                  <ImageViewer url={document.url} zoom={zoom} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {document.url ? 'Unsupported document type' : 'No document available'}
                      </p>
                      {document.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="mt-4"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download to view
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
