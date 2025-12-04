'use client';

import { FileSpreadsheet, FileCode, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportFormat } from '@/lib/api/exports';
import { cn } from '@/lib/utils';

interface ExportFormatSelectorProps {
  selectedFormat: ExportFormat | null;
  onSelectFormat: (format: ExportFormat) => void;
}

const formatOptions = [
  {
    format: ExportFormat.DATEV,
    icon: FileSpreadsheet,
    title: 'DATEV',
    description: 'German accounting standard (ASCII CSV)',
    features: ['SKR03/SKR04 support', 'Consultant & client numbers', 'German tax compliance'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    format: ExportFormat.SAFT,
    icon: FileCode,
    title: 'SAF-T',
    description: 'Standard Audit File for Tax (XML)',
    features: ['OECD standard', 'Multiple country variants', 'Full audit trail'],
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    format: ExportFormat.BMD,
    icon: FileText,
    title: 'BMD',
    description: 'Austrian accounting software (CSV)',
    features: ['Austrian standards', 'Multiple export types', 'EKR/BAB support'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
];

export function ExportFormatSelector({ selectedFormat, onSelectFormat }: ExportFormatSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {formatOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedFormat === option.format;

        return (
          <Card
            key={option.format}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isSelected && 'ring-2 ring-primary border-primary',
              !isSelected && 'hover:border-gray-400 dark:hover:border-gray-600'
            )}
            onClick={() => onSelectFormat(option.format)}
          >
            <CardHeader>
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center mb-3',
                  option.bgColor
                )}
              >
                <Icon className={cn('h-6 w-6', option.color)} />
              </div>
              <CardTitle className="text-lg">{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {option.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
