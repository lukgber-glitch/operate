'use client';

import { useState, useEffect } from 'react';
import { FileText, FileCheck, FileCode } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type EInvoiceFormat = 'standard' | 'zugferd' | 'xrechnung';
export type ZugferdProfile = 'MINIMUM' | 'BASIC' | 'EN16931' | 'EXTENDED';
export type XRechnungSyntax = 'UBL' | 'CII';

export interface EInvoiceOptions {
  zugferdProfile?: ZugferdProfile;
  xrechnungSyntax?: XRechnungSyntax;
}

export interface EInvoiceFormatSelectorProps {
  value: EInvoiceFormat;
  onChange: (format: EInvoiceFormat, options?: EInvoiceOptions) => void;
  className?: string;
  disabled?: boolean;
  showDescription?: boolean;
}

const formatDescriptions: Record<EInvoiceFormat, string> = {
  standard: 'Traditional PDF invoice without electronic data',
  zugferd: 'PDF with embedded XML data (hybrid format)',
  xrechnung: 'Pure XML format for automated processing',
};

const zugferdProfileDescriptions: Record<ZugferdProfile, string> = {
  MINIMUM: 'Basic invoice data only',
  BASIC: 'Standard business invoices',
  EN16931: 'EU standard (recommended)',
  EXTENDED: 'Full feature set with additional data',
};

const xrechnungSyntaxDescriptions: Record<XRechnungSyntax, string> = {
  UBL: 'Universal Business Language (default)',
  CII: 'Cross Industry Invoice',
};

export function EInvoiceFormatSelector({
  value,
  onChange,
  className,
  disabled = false,
  showDescription = true,
}: EInvoiceFormatSelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState<EInvoiceFormat>(value);
  const [zugferdProfile, setZugferdProfile] =
    useState<ZugferdProfile>('EN16931');
  const [xrechnungSyntax, setXrechnungSyntax] = useState<XRechnungSyntax>('UBL');

  // Update parent when format or options change
  useEffect(() => {
    const options: EInvoiceOptions = {};

    if (selectedFormat === 'zugferd') {
      options.zugferdProfile = zugferdProfile;
    } else if (selectedFormat === 'xrechnung') {
      options.xrechnungSyntax = xrechnungSyntax;
    }

    onChange(selectedFormat, Object.keys(options).length > 0 ? options : undefined);
  }, [selectedFormat, zugferdProfile, xrechnungSyntax, onChange]);

  const handleFormatChange = (newFormat: string) => {
    setSelectedFormat(newFormat as EInvoiceFormat);
  };

  const handleZugferdProfileChange = (newProfile: string) => {
    setZugferdProfile(newProfile as ZugferdProfile);
  };

  const handleXRechnungSyntaxChange = (newSyntax: string) => {
    setXrechnungSyntax(newSyntax as XRechnungSyntax);
  };

  const getFormatIcon = (format: EInvoiceFormat) => {
    switch (format) {
      case 'standard':
        return <FileText className="h-4 w-4" />;
      case 'zugferd':
        return <FileCheck className="h-4 w-4" />;
      case 'xrechnung':
        return <FileCode className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="invoice-format">Invoice Format</Label>
        <Select
          value={selectedFormat}
          onValueChange={handleFormatChange}
          disabled={disabled}
        >
          <SelectTrigger id="invoice-format" className="w-full">
            <div className="flex items-center gap-2">
              {getFormatIcon(selectedFormat)}
              <SelectValue placeholder="Select format" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Standard PDF</span>
              </div>
            </SelectItem>
            <SelectItem value="zugferd">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                <span>ZUGFeRD</span>
              </div>
            </SelectItem>
            <SelectItem value="xrechnung">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                <span>XRechnung</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {showDescription && (
          <p className="text-sm text-muted-foreground">
            {formatDescriptions[selectedFormat]}
          </p>
        )}
      </div>

      {selectedFormat === 'zugferd' && (
        <div className="space-y-2 animate-in fade-in-50 duration-200">
          <Label htmlFor="zugferd-profile">ZUGFeRD Profile</Label>
          <Select
            value={zugferdProfile}
            onValueChange={handleZugferdProfileChange}
            disabled={disabled}
          >
            <SelectTrigger id="zugferd-profile" className="w-full">
              <SelectValue placeholder="Select profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MINIMUM">MINIMUM</SelectItem>
              <SelectItem value="BASIC">BASIC</SelectItem>
              <SelectItem value="EN16931">EN16931 (Recommended)</SelectItem>
              <SelectItem value="EXTENDED">EXTENDED</SelectItem>
            </SelectContent>
          </Select>
          {showDescription && (
            <p className="text-sm text-muted-foreground">
              {zugferdProfileDescriptions[zugferdProfile]}
            </p>
          )}
        </div>
      )}

      {selectedFormat === 'xrechnung' && (
        <div className="space-y-2 animate-in fade-in-50 duration-200">
          <Label htmlFor="xrechnung-syntax">XRechnung Syntax</Label>
          <Select
            value={xrechnungSyntax}
            onValueChange={handleXRechnungSyntaxChange}
            disabled={disabled}
          >
            <SelectTrigger id="xrechnung-syntax" className="w-full">
              <SelectValue placeholder="Select syntax" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UBL">UBL (Universal Business Language)</SelectItem>
              <SelectItem value="CII">CII (Cross Industry Invoice)</SelectItem>
            </SelectContent>
          </Select>
          {showDescription && (
            <p className="text-sm text-muted-foreground">
              {xrechnungSyntaxDescriptions[xrechnungSyntax]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
