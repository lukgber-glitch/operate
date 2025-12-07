/**
 * DocumentViewer Example Usage
 *
 * This file demonstrates how to use the DocumentViewer component
 * in the chat interface for previewing documents without leaving the conversation.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Image, Receipt } from 'lucide-react';
import { DocumentViewer, DocumentViewerProps } from './DocumentViewer';

export function DocumentViewerExample() {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    document: DocumentViewerProps['document'] | null;
  }>({
    isOpen: false,
    document: null,
  });

  const openDocument = (document: DocumentViewerProps['document']) => {
    setViewerState({
      isOpen: true,
      document,
    });
  };

  const closeDocument = () => {
    setViewerState({
      isOpen: false,
      document: viewerState.document,
    });
  };

  // Example documents
  const examplePDF = {
    id: 'pdf-1',
    type: 'PDF' as const,
    title: 'Company Annual Report 2024',
    url: 'https://example.com/annual-report-2024.pdf',
  };

  const exampleImage = {
    id: 'img-1',
    type: 'IMAGE' as const,
    title: 'Receipt from Office Supplies',
    url: 'https://example.com/receipt-image.jpg',
  };

  const exampleInvoice = {
    id: 'inv-1',
    type: 'INVOICE' as const,
    title: 'Invoice #INV-2024-001',
    data: {
      number: 'INV-2024-001',
      status: 'Paid',
      date: '2024-12-01',
      dueDate: '2024-12-15',
      from: {
        name: 'Acme Corporation',
        address: '123 Business St, Suite 100\nSan Francisco, CA 94102',
        email: 'billing@acme.com',
        phone: '+1 (415) 555-1234',
      },
      to: {
        name: 'Client Company LLC',
        address: '456 Customer Ave\nNew York, NY 10001',
        email: 'accounts@client.com',
        phone: '+1 (212) 555-5678',
      },
      items: [
        {
          description: 'Website Design & Development',
          notes: 'Custom responsive website with CMS',
          quantity: 1,
          price: 5000,
          total: 5000,
        },
        {
          description: 'Monthly Maintenance',
          notes: '12 months prepaid',
          quantity: 12,
          price: 200,
          total: 2400,
        },
        {
          description: 'SEO Optimization',
          quantity: 1,
          price: 1500,
          total: 1500,
        },
      ],
      subtotal: 8900,
      tax: 801,
      discount: 0,
      total: 9701,
      amountPaid: 9701,
      amountDue: 0,
      paymentTerms: 'Net 15',
      notes: 'Thank you for your business! Payment received via ACH on 2024-12-10.',
    },
  };

  const exampleBill = {
    id: 'bill-1',
    type: 'BILL' as const,
    title: 'AWS Cloud Services - November 2024',
    data: {
      number: 'AWS-NOV-2024',
      status: 'Due',
      date: '2024-11-30',
      dueDate: '2024-12-15',
      from: {
        name: 'Amazon Web Services',
        address: 'Seattle, WA',
        email: 'aws-billing@amazon.com',
      },
      to: {
        name: 'Your Company',
        address: '123 Main St\nYour City, ST 12345',
      },
      items: [
        {
          description: 'EC2 Instances',
          notes: 't3.medium instances - 720 hours',
          quantity: 3,
          price: 42.34,
          total: 127.02,
        },
        {
          description: 'S3 Storage',
          notes: '500 GB standard storage',
          quantity: 500,
          price: 0.023,
          total: 11.50,
        },
        {
          description: 'RDS Database',
          notes: 'PostgreSQL db.t3.small - 720 hours',
          quantity: 1,
          price: 58.32,
          total: 58.32,
        },
        {
          description: 'Data Transfer',
          notes: 'Outbound data transfer',
          quantity: 100,
          price: 0.09,
          total: 9.00,
        },
      ],
      subtotal: 205.84,
      tax: 0,
      discount: 0,
      total: 205.84,
      amountPaid: 0,
      amountDue: 205.84,
      paymentTerms: 'Net 15',
      notes: 'Payment will be automatically charged to your card on file.',
    },
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">DocumentViewer Example</h2>
        <p className="text-muted-foreground">
          Click any button below to open the document viewer panel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PDF Example */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">PDF Document</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            View PDF files with zoom controls and download options.
          </p>
          <Button onClick={() => openDocument(examplePDF)} className="w-full">
            Open PDF Example
          </Button>
        </div>

        {/* Image Example */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Image Document</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            View images with zoom capability and download options.
          </p>
          <Button onClick={() => openDocument(exampleImage)} className="w-full">
            Open Image Example
          </Button>
        </div>

        {/* Invoice Example */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Invoice (Formatted)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            View invoices with formatted layout showing line items and totals.
          </p>
          <Button onClick={() => openDocument(exampleInvoice)} className="w-full">
            Open Invoice Example
          </Button>
        </div>

        {/* Bill Example */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">Bill (Formatted)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            View bills with formatted layout and payment details.
          </p>
          <Button onClick={() => openDocument(exampleBill)} className="w-full">
            Open Bill Example
          </Button>
        </div>
      </div>

      {/* Document Viewer */}
      {viewerState.document && (
        <DocumentViewer
          isOpen={viewerState.isOpen}
          onClose={closeDocument}
          document={viewerState.document}
        />
      )}
    </div>
  );
}

/**
 * Integration Example: Using DocumentViewer in Chat Messages
 */
export function ChatIntegrationExample() {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    document: DocumentViewerProps['document'] | null;
  }>({
    isOpen: false,
    document: null,
  });

  const handleViewDocument = (document: DocumentViewerProps['document']) => {
    setViewerState({ isOpen: true, document });
  };

  const handleCloseViewer = () => {
    setViewerState({ isOpen: false, document: viewerState.document });
  };

  return (
    <div className="space-y-4">
      {/* Example Chat Message with Document Link */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-sm mb-3">
          I found your invoice for November 2024. Here are the details:
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleViewDocument({
              id: 'inv-nov-2024',
              type: 'INVOICE',
              title: 'Invoice #INV-2024-011',
              data: {
                number: 'INV-2024-011',
                status: 'Paid',
                total: 1250.0,
                // ... other invoice data
              },
            })
          }
        >
          <FileText className="w-4 h-4 mr-2" />
          View Invoice Details
        </Button>
      </div>

      {/* Document Viewer */}
      {viewerState.document && (
        <DocumentViewer
          isOpen={viewerState.isOpen}
          onClose={handleCloseViewer}
          document={viewerState.document}
        />
      )}
    </div>
  );
}

/**
 * Usage Notes:
 *
 * 1. PDF Documents:
 *    - Provide a `url` to the PDF file
 *    - Supports zoom controls
 *    - Uses iframe for display
 *
 * 2. Image Documents:
 *    - Provide a `url` to the image file
 *    - Supports zoom controls
 *    - Uses img tag with zoom transforms
 *
 * 3. Formatted Documents (Invoice/Bill/Expense):
 *    - Provide `data` object with document details
 *    - Displays formatted HTML preview
 *    - Optionally provide `url` for download/print
 *
 * 4. Animations:
 *    - Panel slides in from right
 *    - Backdrop fades in
 *    - Content fades in after panel animation
 *
 * 5. Responsive:
 *    - Full-screen on mobile
 *    - Side panel (600-800px) on desktop
 *
 * 6. Keyboard:
 *    - ESC key closes the viewer
 *
 * 7. Actions:
 *    - Download button (all types)
 *    - Print button (all types with URL)
 *    - Share button (uses Web Share API or clipboard fallback)
 *    - Open in new tab (all types with URL)
 */
