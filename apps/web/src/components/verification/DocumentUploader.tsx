'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentUpload } from '@/hooks/use-document-upload';
import { DocumentType, type VerificationDocument } from '@/types/verification';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface DocumentUploaderProps {
  documentType: DocumentType;
  onUploadComplete?: (document: VerificationDocument) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  className?: string;
}

export function DocumentUploader({
  documentType,
  onUploadComplete,
  acceptedFormats = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeMB = 10,
  className,
}: DocumentUploaderProps) {
  const { uploadDocument, progress, isUploading } = useDocumentUpload();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProgress = progress.find(p => p.documentType === documentType);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setError(null);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
        } else {
          setSelectedFile(file);
        }
      }
    },
    [acceptedFormats, maxSizeMB]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setError(null);

      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
        } else {
          setSelectedFile(file);
        }
      }
    },
    [acceptedFormats, maxSizeMB]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      const document = await uploadDocument(selectedFile, documentType);

      toast({
        title: 'Upload successful',
        description: 'Your document has been uploaded successfully.',
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete?.(document);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      toast({
        title: 'Upload failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [selectedFile, documentType, uploadDocument, onUploadComplete, toast]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          dragActive && 'border-primary bg-primary/5',
          error && 'border-destructive',
          currentProgress?.status === 'complete' && 'border-green-500 bg-green-50 dark:bg-green-900/10'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedFormats.join(',')}
            onChange={handleChange}
            disabled={isUploading}
          />

          {!selectedFile && !currentProgress && (
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Upload Document
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <Button onClick={openFileDialog} variant="outline">
                Select File
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: {acceptedFormats.map(f => f.split('/')[1]).join(', ')} (max {maxSizeMB}MB)
              </p>
            </div>
          )}

          {selectedFile && !currentProgress && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <File className="w-8 h-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                Upload Document
              </Button>
            </div>
          )}

          {currentProgress && (
            <div className="space-y-4">
              {currentProgress.status === 'uploading' && (
                <>
                  <div className="flex items-center gap-3">
                    <Upload className="w-8 h-8 text-primary animate-pulse" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Uploading...</p>
                      <p className="text-xs text-muted-foreground">
                        {currentProgress.progress}% complete
                      </p>
                    </div>
                  </div>
                  <Progress value={currentProgress.progress} />
                </>
              )}

              {currentProgress.status === 'processing' && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div>
                    <p className="text-sm font-medium">Processing...</p>
                    <p className="text-xs text-muted-foreground">
                      Validating your document
                    </p>
                  </div>
                </div>
              )}

              {currentProgress.status === 'complete' && (
                <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <p className="text-sm font-medium">Upload Complete</p>
                    <p className="text-xs opacity-80">
                      Document uploaded successfully
                    </p>
                  </div>
                </div>
              )}

              {currentProgress.status === 'error' && (
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="w-8 h-8" />
                  <div>
                    <p className="text-sm font-medium">Upload Failed</p>
                    <p className="text-xs opacity-80">
                      {currentProgress.error || 'An error occurred'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
