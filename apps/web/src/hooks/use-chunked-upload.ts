'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { apiClient } from '@/lib/api/client';
import type {
  DocumentUploadProgress,
  UploadStatus,
  ChunkedUploadConfig,
  Document,
  DocumentUploadRequest,
} from '@/types/documents';

// Default configuration for chunked uploads
const DEFAULT_CONFIG: ChunkedUploadConfig = {
  chunkSize: 1024 * 1024, // 1MB chunks
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  concurrentChunks: 3,
};

interface ChunkUploadState {
  chunkIndex: number;
  totalChunks: number;
  retries: number;
  aborted: boolean;
}

interface UseChunkedUploadOptions {
  config?: Partial<ChunkedUploadConfig>;
  onProgress?: (progress: DocumentUploadProgress) => void;
  onComplete?: (document: Document) => void;
  onError?: (error: Error, fileName: string) => void;
}

interface UseChunkedUploadResult {
  uploads: DocumentUploadProgress[];
  uploadFile: (request: DocumentUploadRequest) => Promise<Document>;
  uploadFiles: (requests: DocumentUploadRequest[]) => Promise<Document[]>;
  cancelUpload: (id: string) => void;
  cancelAll: () => void;
  retryUpload: (id: string) => Promise<Document | null>;
  clearCompleted: () => void;
  isUploading: boolean;
  totalProgress: number;
}

/**
 * Hook for chunked file uploads with progress tracking,
 * retry logic, and cancellation support.
 */
export function useChunkedUpload(
  options: UseChunkedUploadOptions = {}
): UseChunkedUploadResult {
  const { config: userConfig, onProgress, onComplete, onError } = options;
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);

  const [uploads, setUploads] = useState<DocumentUploadProgress[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const uploadStatesRef = useRef<Map<string, ChunkUploadState>>(new Map());
  const pendingRequestsRef = useRef<Map<string, DocumentUploadRequest>>(new Map());

  // Update upload progress
  const updateUpload = useCallback(
    (id: string, updates: Partial<DocumentUploadProgress>) => {
      setUploads((prev) => {
        const updated = prev.map((u) =>
          u.id === id ? { ...u, ...updates } : u
        );
        const upload = updated.find((u) => u.id === id);
        if (upload && onProgress) {
          onProgress(upload);
        }
        return updated;
      });
    },
    [onProgress]
  );

  // Calculate upload speed and ETA
  const calculateMetrics = useCallback(
    (startTime: number, bytesUploaded: number, totalBytes: number) => {
      const elapsedMs = Date.now() - startTime;
      const uploadSpeed = elapsedMs > 0 ? (bytesUploaded / elapsedMs) * 1000 : 0;
      const remainingBytes = totalBytes - bytesUploaded;
      const estimatedTimeRemaining =
        uploadSpeed > 0 ? Math.ceil(remainingBytes / uploadSpeed) * 1000 : undefined;
      return { uploadSpeed, estimatedTimeRemaining };
    },
    []
  );

  // Upload a single chunk with retry logic
  const uploadChunk = useCallback(
    async (
      uploadId: string,
      file: File,
      chunkIndex: number,
      totalChunks: number,
      uploadUrl: string,
      abortController: AbortController
    ): Promise<boolean> => {
      const state = uploadStatesRef.current.get(uploadId);
      if (!state || state.aborted) return false;

      const start = chunkIndex * config.chunkSize;
      const end = Math.min(start + config.chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', String(chunkIndex));
      formData.append('totalChunks', String(totalChunks));
      formData.append('fileName', file.name);
      formData.append('fileSize', String(file.size));
      formData.append('mimeType', file.type);

      let retries = 0;
      while (retries <= config.maxRetries) {
        try {
          await apiClient.post(uploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal: abortController.signal,
          });
          return true;
        } catch (error: any) {
          if (error.name === 'AbortError' || state.aborted) {
            return false;
          }
          retries++;
          if (retries > config.maxRetries) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, config.retryDelay * retries));
        }
      }
      return false;
    },
    [config]
  );

  // Upload file with chunked upload support
  const uploadFile = useCallback(
    async (request: DocumentUploadRequest): Promise<Document> => {
      const { file, name, description, folderId, tags, autoClassify = true } = request;
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const startTime = Date.now();

      // Store request for potential retry
      pendingRequestsRef.current.set(uploadId, request);

      // Initialize upload state
      const totalChunks = Math.ceil(file.size / config.chunkSize);
      const abortController = new AbortController();
      abortControllersRef.current.set(uploadId, abortController);
      uploadStatesRef.current.set(uploadId, {
        chunkIndex: 0,
        totalChunks,
        retries: 0,
        aborted: false,
      });

      // Initialize progress
      const initialProgress: DocumentUploadProgress = {
        id: uploadId,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        bytesUploaded: 0,
        status: 'pending' as UploadStatus,
        startTime,
      };
      setUploads((prev) => [...prev, initialProgress]);

      try {
        // Check if we should use chunked upload (files > 5MB)
        const useChunkedUpload = file.size > 5 * 1024 * 1024;

        if (useChunkedUpload) {
          // Update status
          updateUpload(uploadId, { status: 'uploading' });

          // Upload chunks
          const uploadUrl = '/api/documents/chunk';
          for (let i = 0; i < totalChunks; i++) {
            const state = uploadStatesRef.current.get(uploadId);
            if (!state || state.aborted) {
              throw new Error('Upload cancelled');
            }

            const success = await uploadChunk(
              uploadId,
              file,
              i,
              totalChunks,
              uploadUrl,
              abortController
            );

            if (!success) {
              throw new Error('Chunk upload failed');
            }

            // Update progress
            const bytesUploaded = Math.min((i + 1) * config.chunkSize, file.size);
            const progress = Math.round((bytesUploaded / file.size) * 100);
            const metrics = calculateMetrics(startTime, bytesUploaded, file.size);

            updateUpload(uploadId, {
              progress,
              bytesUploaded,
              ...metrics,
            });

            state.chunkIndex = i + 1;
          }

          // Finalize upload
          updateUpload(uploadId, { status: 'processing' });
          const response = await apiClient.post<Document>('/api/documents/finalize', {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            name: name || file.name,
            description,
            folderId,
            tags,
            autoClassify,
          });

          const document = response.data;

          // Update to classifying if auto-classify enabled
          if (autoClassify) {
            updateUpload(uploadId, { status: 'classifying' });
            // Wait briefly for classification (in reality this would be async)
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // Mark complete
          updateUpload(uploadId, { status: 'completed', progress: 100 });

          if (onComplete) {
            onComplete(document);
          }

          // Cleanup
          abortControllersRef.current.delete(uploadId);
          uploadStatesRef.current.delete(uploadId);
          pendingRequestsRef.current.delete(uploadId);

          return document;
        } else {
          // Standard single-request upload for smaller files
          updateUpload(uploadId, { status: 'uploading' });

          const formData = new FormData();
          formData.append('file', file);
          if (name) formData.append('name', name);
          if (description) formData.append('description', description);
          if (folderId) formData.append('folderId', folderId);
          if (tags) formData.append('tags', JSON.stringify(tags));
          formData.append('autoClassify', String(autoClassify));

          const response = await apiClient.post<Document>(
            '/api/documents/upload',
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              signal: abortController.signal,
              onUploadProgress: (progressEvent) => {
                const bytesUploaded = progressEvent.loaded;
                const progress = progressEvent.total
                  ? Math.round((bytesUploaded * 100) / progressEvent.total)
                  : 0;
                const metrics = calculateMetrics(startTime, bytesUploaded, file.size);

                updateUpload(uploadId, {
                  progress,
                  bytesUploaded,
                  ...metrics,
                });
              },
            }
          );

          const document = response.data;

          // Update statuses
          updateUpload(uploadId, { status: 'processing', progress: 95 });
          if (autoClassify) {
            updateUpload(uploadId, { status: 'classifying' });
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          updateUpload(uploadId, { status: 'completed', progress: 100 });

          if (onComplete) {
            onComplete(document);
          }

          // Cleanup
          abortControllersRef.current.delete(uploadId);
          uploadStatesRef.current.delete(uploadId);
          pendingRequestsRef.current.delete(uploadId);

          return document;
        }
      } catch (error: any) {
        const message = error.message || 'Upload failed';
        updateUpload(uploadId, { status: 'error', error: message });

        if (onError) {
          onError(error, file.name);
        }

        throw error;
      }
    },
    [config, uploadChunk, updateUpload, calculateMetrics, onComplete, onError]
  );

  // Upload multiple files
  const uploadFiles = useCallback(
    async (requests: DocumentUploadRequest[]): Promise<Document[]> => {
      const results = await Promise.allSettled(requests.map(uploadFile));
      return results
        .filter((r): r is PromiseFulfilledResult<Document> => r.status === 'fulfilled')
        .map((r) => r.value);
    },
    [uploadFile]
  );

  // Cancel a specific upload
  const cancelUpload = useCallback((id: string) => {
    const controller = abortControllersRef.current.get(id);
    const state = uploadStatesRef.current.get(id);

    if (controller) {
      controller.abort();
    }
    if (state) {
      state.aborted = true;
    }

    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'cancelled' as UploadStatus } : u))
    );

    // Cleanup
    abortControllersRef.current.delete(id);
    uploadStatesRef.current.delete(id);
    pendingRequestsRef.current.delete(id);
  }, []);

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort());
    uploadStatesRef.current.forEach((state) => {
      state.aborted = true;
    });

    setUploads((prev) =>
      prev.map((u) =>
        u.status === 'uploading' || u.status === 'pending'
          ? { ...u, status: 'cancelled' as UploadStatus }
          : u
      )
    );

    abortControllersRef.current.clear();
    uploadStatesRef.current.clear();
    pendingRequestsRef.current.clear();
  }, []);

  // Retry a failed upload
  const retryUpload = useCallback(
    async (id: string): Promise<Document | null> => {
      const request = pendingRequestsRef.current.get(id);
      if (!request) return null;

      // Remove the old upload entry
      setUploads((prev) => prev.filter((u) => u.id !== id));

      try {
        return await uploadFile(request);
      } catch (error) {
        return null;
      }
    },
    [uploadFile]
  );

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setUploads((prev) =>
      prev.filter((u) => u.status !== 'completed' && u.status !== 'cancelled')
    );
  }, []);

  // Calculate total progress
  const totalProgress = useMemo(() => {
    if (uploads.length === 0) return 0;
    const total = uploads.reduce((sum, u) => sum + u.progress, 0);
    return Math.round(total / uploads.length);
  }, [uploads]);

  // Check if any upload is in progress
  const isUploading = useMemo(() => {
    return uploads.some(
      (u) =>
        u.status === 'pending' ||
        u.status === 'uploading' ||
        u.status === 'processing' ||
        u.status === 'classifying'
    );
  }, [uploads]);

  return {
    uploads,
    uploadFile,
    uploadFiles,
    cancelUpload,
    cancelAll,
    retryUpload,
    clearCompleted,
    isUploading,
    totalProgress,
  };
}

/**
 * Format upload speed for display
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

/**
 * Format remaining time for display
 */
export function formatTimeRemaining(ms: number | undefined): string {
  if (!ms) return 'Calculating...';
  if (ms < 1000) return 'Less than 1s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s remaining`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s remaining`;
}
