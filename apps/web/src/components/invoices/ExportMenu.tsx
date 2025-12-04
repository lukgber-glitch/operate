/**
 * Export Menu Component
 * Dropdown menu for exporting extraction data
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Copy,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  exportToCSV,
  exportToJSON,
  exportSingleToJSON,
  exportConfidenceScores,
  exportStatistics,
  copyToClipboard,
} from '@/lib/utils/export';
import type { ExtractedInvoice } from '@/types/extracted-invoice';

interface ExportMenuProps {
  extractions?: ExtractedInvoice[];
  singleExtraction?: ExtractedInvoice;
  statistics?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    needsCorrection: number;
    averageConfidence: number;
    byVendor: Record<string, number>;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export function ExportMenu({
  extractions,
  singleExtraction,
  statistics,
  variant = 'outline',
  size = 'default',
  disabled = false,
}: ExportMenuProps) {
  const handleExportCSV = () => {
    if (extractions && extractions.length > 0) {
      exportToCSV(extractions);
      toast.success(`Exported ${extractions.length} extractions to CSV`);
    } else {
      toast.error('No extractions to export');
    }
  };

  const handleExportJSON = () => {
    if (extractions && extractions.length > 0) {
      exportToJSON(extractions);
      toast.success(`Exported ${extractions.length} extractions to JSON`);
    } else if (singleExtraction) {
      exportSingleToJSON(singleExtraction);
      toast.success('Exported extraction to JSON');
    } else {
      toast.error('No extractions to export');
    }
  };

  const handleExportConfidence = () => {
    if (singleExtraction) {
      exportConfidenceScores(singleExtraction);
      toast.success('Exported confidence scores');
    } else {
      toast.error('No extraction selected');
    }
  };

  const handleExportStatistics = () => {
    if (statistics) {
      exportStatistics(statistics);
      toast.success('Exported statistics');
    } else {
      toast.error('No statistics available');
    }
  };

  const handleCopyToClipboard = async () => {
    if (singleExtraction) {
      try {
        await copyToClipboard(singleExtraction);
        toast.success('Copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy to clipboard');
      }
    } else {
      toast.error('No extraction selected');
    }
  };

  const hasMultiple = extractions && extractions.length > 0;
  const hasSingle = !!singleExtraction;
  const hasStatistics = !!statistics;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Data</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {hasMultiple && (
          <>
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export to CSV
              <span className="ml-auto text-xs text-muted-foreground">
                {extractions.length} items
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON}>
              <FileJson className="w-4 h-4 mr-2" />
              Export to JSON
            </DropdownMenuItem>
          </>
        )}

        {hasSingle && (
          <>
            {hasMultiple && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={handleExportJSON}>
              <FileJson className="w-4 h-4 mr-2" />
              Export Current (JSON)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportConfidence}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Export Confidence Scores
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </DropdownMenuItem>
          </>
        )}

        {hasStatistics && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportStatistics}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Export Statistics
            </DropdownMenuItem>
          </>
        )}

        {!hasMultiple && !hasSingle && !hasStatistics && (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            No data available to export
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
