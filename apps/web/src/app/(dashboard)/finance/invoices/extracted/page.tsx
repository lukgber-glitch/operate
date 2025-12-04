/**
 * Extracted Invoices Page
 * Main page for reviewing AI-extracted invoices
 */

import React from 'react';
import { ExtractedInvoiceList } from '@/components/invoices/ExtractedInvoiceList';

export const metadata = {
  title: 'Extracted Invoices | Operate',
  description: 'Review and approve AI-extracted invoices from emails',
};

export default function ExtractedInvoicesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Extracted Invoices
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and approve invoices extracted from email attachments using AI
        </p>
      </div>

      <ExtractedInvoiceList />
    </div>
  );
}
