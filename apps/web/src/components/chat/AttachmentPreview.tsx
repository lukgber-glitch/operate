'use client';

import { X, FileText, Image as ImageIcon, FileSpreadsheet, File } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AttachedFile } from '@/hooks/use-file-upload';

interface AttachmentPreviewProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
  className?: string;
}

/**
 * AttachmentPreview - Display attached files with preview and remove option
 *
 * Features:
 * - File type icons
 * - Image previews
 * - File size display
 * - Remove button per file
 * - Responsive layout
 */
export function AttachmentPreview({ files, onRemove, className }: AttachmentPreviewProps) {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: AttachedFile['type']) => {
    const iconClass = 'h-4 w-4';
    switch (type) {
      case 'pdf':
        return <FileText className={iconClass} />;
      case 'image':
        return <ImageIcon className={iconClass} />;
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const getFileTypeColor = (type: AttachedFile['type']): string => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'image':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'excel':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'csv':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2 pb-3', className)}>
      {files.map((attachedFile) => (
        <div
          key={attachedFile.id}
          className={cn(
            'group relative flex items-center gap-2 rounded-lg border p-2 pr-8',
            'transition-colors hover:bg-accent',
            getFileTypeColor(attachedFile.type)
          )}
        >
          {/* Image preview or icon */}
          <div className="flex-shrink-0">
            {attachedFile.type === 'image' && attachedFile.preview ? (
              <div className="h-10 w-10 rounded overflow-hidden bg-white border">
                <img
                  src={attachedFile.preview}
                  alt={attachedFile.file.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded bg-white border flex items-center justify-center">
                {getFileIcon(attachedFile.type)}
              </div>
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate max-w-[200px]" title={attachedFile.file.name}>
              {attachedFile.file.name}
            </p>
            <p className="text-xs opacity-70">{formatFileSize(attachedFile.file.size)}</p>
          </div>

          {/* Remove button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-destructive/10"
            onClick={() => onRemove(attachedFile.id)}
            aria-label={`Remove ${attachedFile.file.name}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * AttachmentCounter - Small badge showing number of attachments
 */
interface AttachmentCounterProps {
  count: number;
  className?: string;
}

export function AttachmentCounter({ count, className }: AttachmentCounterProps) {
  if (count === 0) return null;

  return (
    <Badge variant="secondary" className={cn('ml-1 h-5 px-1.5 text-xs', className)}>
      {count}
    </Badge>
  );
}
