'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import type { DocumentType, VerificationDocument, DocumentUploadProgress } from '@/types/verification';

interface UseDocumentUploadResult {
  uploadDocument: (file: File, documentType: DocumentType) => Promise<VerificationDocument>;
  deleteDocument: (documentId: string) => Promise<void>;
  progress: DocumentUploadProgress[];
  isUploading: boolean;
}

export function useDocumentUpload(): UseDocumentUploadResult {
  const [progress, setProgress] = useState<DocumentUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocument = useCallback(async (file: File, documentType: DocumentType): Promise<VerificationDocument> => {
    setIsUploading(true);

    // Initialize progress tracking
    setProgress(prev => [
      ...prev.filter(p => p.documentType !== documentType),
      { documentType, progress: 0, status: 'uploading' }
    ]);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      // Upload with progress tracking
      const response = await apiClient.post<VerificationDocument>(
        '/api/kyc/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;

            setProgress(prev =>
              prev.map(p =>
                p.documentType === documentType
                  ? { ...p, progress: percentCompleted }
                  : p
              )
            );
          },
        }
      );

      // Update progress to processing
      setProgress(prev =>
        prev.map(p =>
          p.documentType === documentType
            ? { ...p, status: 'processing', progress: 100 }
            : p
        )
      );

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update progress to complete
      setProgress(prev =>
        prev.map(p =>
          p.documentType === documentType
            ? { ...p, status: 'complete' }
            : p
        )
      );

      // Clear progress after 2 seconds
      setTimeout(() => {
        setProgress(prev => prev.filter(p => p.documentType !== documentType));
      }, 2000);

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';

      setProgress(prev =>
        prev.map(p =>
          p.documentType === documentType
            ? { ...p, status: 'error', error: message }
            : p
        )
      );

      // Clear error after 5 seconds
      setTimeout(() => {
        setProgress(prev => prev.filter(p => p.documentType !== documentType));
      }, 5000);

      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/kyc/documents/${documentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      throw new Error(message);
    }
  }, []);

  return {
    uploadDocument,
    deleteDocument,
    progress,
    isUploading,
  };
}
