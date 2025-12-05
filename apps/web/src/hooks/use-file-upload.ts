'use client';

import { useState, useCallback } from 'react';

export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'pdf' | 'image' | 'excel' | 'csv' | 'other';
}

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
}

interface UseFileUploadResult {
  attachedFiles: AttachedFile[];
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  isValidFile: (file: File) => boolean;
  error: string | null;
  clearError: () => void;
}

const DEFAULT_MAX_SIZE_MB = 10;
const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * Hook for managing file uploads in chat
 * Supports drag-and-drop and click-to-browse
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadResult {
  const {
    maxFiles = 5,
    maxSizeInMB = DEFAULT_MAX_SIZE_MB,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  } = options;

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const getFileType = (file: File): AttachedFile['type'] => {
    const type = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
    if (type.includes('sheet') || ext === 'xlsx' || ext === 'xls') return 'excel';
    if (type === 'text/csv' || ext === 'csv') return 'csv';
    return 'other';
  };

  const isValidFile = useCallback(
    (file: File): boolean => {
      // Check file size
      if (file.size > maxSizeInBytes) {
        setError(`File "${file.name}" exceeds ${maxSizeInMB}MB limit`);
        return false;
      }

      // Check file type
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isAcceptedType =
        acceptedTypes.includes(file.type) ||
        (ext && acceptedTypes.some((type) => type.endsWith(ext)));

      if (!isAcceptedType) {
        setError(`File type "${file.type || ext}" is not supported`);
        return false;
      }

      return true;
    },
    [maxSizeInBytes, maxSizeInMB, acceptedTypes]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Check max files limit
      if (attachedFiles.length + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validFiles: AttachedFile[] = [];

      for (const file of fileArray) {
        if (!isValidFile(file)) {
          return; // Error already set in isValidFile
        }

        const attachedFile: AttachedFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          type: getFileType(file),
        };

        // Generate preview for images
        if (attachedFile.type === 'image') {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAttachedFiles((prev) =>
              prev.map((f) =>
                f.id === attachedFile.id ? { ...f, preview: reader.result as string } : f
              )
            );
          };
          reader.readAsDataURL(file);
        }

        validFiles.push(attachedFile);
      }

      setAttachedFiles((prev) => [...prev, ...validFiles]);
      setError(null);
    },
    [attachedFiles.length, maxFiles, isValidFile]
  );

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
    setError(null);
  }, []);

  const clearFiles = useCallback(() => {
    setAttachedFiles([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    attachedFiles,
    addFiles,
    removeFile,
    clearFiles,
    isValidFile,
    error,
    clearError,
  };
}
