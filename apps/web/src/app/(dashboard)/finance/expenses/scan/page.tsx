'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReceiptUpload } from '@/hooks/use-receipt-scanner';

export default function ReceiptScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadReceipt, isUploading, uploadProgress, error, reset } = useReceiptUpload();

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    reset();
  }, [reset]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    const scan = await uploadReceipt(selectedFile);
    if (scan) {
      // Redirect to review page
      router.push(`/finance/expenses/scan/${scan.id}`);
    }
  }, [selectedFile, uploadReceipt, router]);

  // Handle clear
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [reset]);

  // Check if file is PDF
  const isPDF = selectedFile?.type === 'application/pdf';

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Scan Receipt</h1>
        <p className="text-muted-foreground mt-2">
          Upload or capture a receipt photo to automatically extract expense details
        </p>
      </div>

      {/* Upload Area */}
      {!selectedFile && (
        <Card className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4 mb-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="p-4 rounded-full bg-primary/10">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium">Drop your receipt here</p>
                <p className="text-sm text-muted-foreground">
                  or click below to browse files
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-w-[200px]"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Choose File
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-w-[200px]"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Take Photo
                </Button>
              </div>

              <div className="mt-6 text-xs text-muted-foreground">
                <p>Accepted formats: JPEG, PNG, WebP, PDF</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </Card>
      )}

      {/* Preview & Upload */}
      {selectedFile && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Receipt Preview</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                disabled={isUploading}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Image/PDF Preview */}
            <div className="mb-6">
              {isPDF ? (
                <div className="bg-muted rounded-lg p-12 text-center">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <svg
                      className="h-12 w-12 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Preview not available
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={previewUrl || ''}
                    alt="Receipt preview"
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                  </span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Process Receipt
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleClear}
                disabled={isUploading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Tips for better results
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Ensure the receipt is well-lit and clearly visible</li>
              <li>Avoid shadows and reflections</li>
              <li>Capture the entire receipt including all details</li>
              <li>Keep the receipt flat and straight</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
