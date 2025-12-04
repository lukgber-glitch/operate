/**
 * Export Utilities
 * Functions for exporting data to various formats
 */

import type { ExtractedInvoice } from '@/types/extracted-invoice';
import { format } from 'date-fns';

/**
 * Export extractions to CSV
 */
export function exportToCSV(
  extractions: ExtractedInvoice[],
  filename = 'extracted-invoices.csv'
): void {
  const headers = [
    'ID',
    'Vendor Name',
    'Invoice Number',
    'Invoice Date',
    'Due Date',
    'Total Amount',
    'Currency',
    'Review Status',
    'Overall Confidence',
    'Extracted At',
    'VAT ID',
    'Email',
    'PO Number',
    'Subtotal',
    'Tax Amount',
    'Tax Rate',
    'Line Items Count',
  ];

  const rows = extractions.map((ext) => [
    ext.id,
    ext.data.vendorName || '',
    ext.data.invoiceNumber || '',
    ext.data.invoiceDate
      ? format(new Date(ext.data.invoiceDate), 'yyyy-MM-dd')
      : '',
    ext.data.dueDate ? format(new Date(ext.data.dueDate), 'yyyy-MM-dd') : '',
    ext.data.total,
    ext.data.currency,
    ext.reviewStatus,
    (ext.overallConfidence * 100).toFixed(1) + '%',
    format(new Date(ext.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ext.data.vendorVatId || '',
    ext.data.vendorEmail || '',
    ext.data.purchaseOrderNumber || '',
    ext.data.subtotal,
    ext.data.taxAmount || '',
    ext.data.taxRate ? ext.data.taxRate + '%' : '',
    ext.data.lineItems.length,
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export extractions to JSON
 */
export function exportToJSON(
  extractions: ExtractedInvoice[],
  filename = 'extracted-invoices.json'
): void {
  const jsonContent = JSON.stringify(extractions, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

/**
 * Export single extraction to JSON (detailed)
 */
export function exportSingleToJSON(
  extraction: ExtractedInvoice,
  filename?: string
): void {
  const defaultFilename = `extraction-${extraction.id}.json`;
  const jsonContent = JSON.stringify(extraction, null, 2);
  downloadFile(jsonContent, filename || defaultFilename, 'application/json');
}

/**
 * Export field confidence scores to CSV
 */
export function exportConfidenceScores(
  extraction: ExtractedInvoice,
  filename?: string
): void {
  const defaultFilename = `confidence-scores-${extraction.id}.csv`;

  const headers = ['Field Name', 'Confidence', 'Extracted'];

  const rows = extraction.fieldConfidences.map((fc) => [
    fc.field,
    (fc.confidence * 100).toFixed(1) + '%',
    fc.extracted ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename || defaultFilename, 'text/csv');
}

/**
 * Export extraction statistics to CSV
 */
export function exportStatistics(
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    needsCorrection: number;
    averageConfidence: number;
    byVendor: Record<string, number>;
  },
  filename = 'extraction-statistics.csv'
): void {
  const summaryRows = [
    ['Metric', 'Value'],
    ['Total Extractions', stats.total],
    ['Pending Review', stats.pending],
    ['Approved', stats.approved],
    ['Rejected', stats.rejected],
    ['Needs Correction', stats.needsCorrection],
    ['Average Confidence', (stats.averageConfidence * 100).toFixed(1) + '%'],
    [''], // Empty row
    ['Vendor', 'Count'],
    ...Object.entries(stats.byVendor).map(([vendor, count]) => [vendor, count]),
  ];

  const csvContent = summaryRows.map((row) => row.map(escapeCSV).join(',')).join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Escape CSV value
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

/**
 * Download file to browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy extraction data to clipboard
 */
export async function copyToClipboard(extraction: ExtractedInvoice): Promise<void> {
  const text = `
Vendor: ${extraction.data.vendorName || 'N/A'}
Invoice Number: ${extraction.data.invoiceNumber || 'N/A'}
Invoice Date: ${extraction.data.invoiceDate ? format(new Date(extraction.data.invoiceDate), 'MMM d, yyyy') : 'N/A'}
Due Date: ${extraction.data.dueDate ? format(new Date(extraction.data.dueDate), 'MMM d, yyyy') : 'N/A'}
Total: ${extraction.data.total} ${extraction.data.currency}
Status: ${extraction.reviewStatus}
Confidence: ${(extraction.overallConfidence * 100).toFixed(1)}%
  `.trim();

  await navigator.clipboard.writeText(text);
}
