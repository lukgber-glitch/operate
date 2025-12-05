/**
 * Invoice Document Viewer Component
 * Displays PDF or image attachments inline
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceDocumentViewerProps {
  attachmentId: string;
  mimeType?: string;
  className?: string;
}

export function InvoiceDocumentViewer({
  attachmentId,
  mimeType,
  className,
}: InvoiceDocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    let isMounted = true;

    const fetchAttachment = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/v1/integrations/email-sync/extractions/${attachmentId}/attachment`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load document');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (isMounted) {
          setObjectUrl(url);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load document');
          setLoading(false);
        }
      }
    };

    fetchAttachment();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachmentId]);

  const handleDownload = () => {
    if (!objectUrl) return;

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `invoice-${attachmentId}.pdf`;
    link.click();
  };

  const handleOpenInNewTab = () => {
    if (!objectUrl) return;
    window.open(objectUrl, '_blank');
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  if (loading) {
    return (
      <Card className={cn('flex items-center justify-center h-full p-8', className)}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading document...</p>
        </div>
      </Card>
    );
  }

  if (error || !objectUrl) {
    return (
      <Card className={cn('flex items-center justify-center h-full p-8', className)}>
        <div className="flex flex-col items-center gap-2 text-destructive">
          <p className="text-sm font-medium">Failed to load document</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  const isPdf = mimeType?.includes('pdf') || objectUrl.includes('.pdf');
  const isImage = mimeType?.startsWith('image/');

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
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
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="flex items-center justify-center min-h-full p-4">
          {isPdf ? (
            <iframe
              src={objectUrl}
              className="w-full h-full border-0 rounded"
              style={{
                minHeight: '600px',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
              title="Invoice PDF"
            />
          ) : isImage ? (
            <img
              src={objectUrl}
              alt="Invoice"
              className="max-w-full h-auto rounded shadow-lg"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center',
              }}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Unsupported document type</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="mt-4"
              >
                <Download className="w-4 h-4 mr-2" />
                Download to view
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
