'use client';

import {
  Upload,
  FileText,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  type?: string;
}

interface RecentUpload {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

const mockRecentUploads: RecentUpload[] = [
  {
    id: '1',
    name: 'Contract_2024_Q4.pdf',
    type: 'CONTRACT',
    uploadedAt: '2024-12-10 14:30',
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Invoice_INV-2024-156.pdf',
    type: 'INVOICE',
    uploadedAt: '2024-12-10 12:15',
    size: '456 KB',
  },
  {
    id: '3',
    name: 'Receipt_Office_Equipment.jpg',
    type: 'RECEIPT',
    uploadedAt: '2024-12-09 16:45',
    size: '892 KB',
  },
];

const allowedFileTypes = [
  { label: 'PDF Documents', extension: '.pdf' },
  { label: 'Word Documents', extension: '.doc, .docx' },
  { label: 'Excel Spreadsheets', extension: '.xls, .xlsx' },
  { label: 'Images', extension: '.jpg, .jpeg, .png' },
];

export default function DocumentUploadPage() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Mock file upload handling
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploads: UploadedFile[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      progress: 0,
      status: 'uploading',
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    // Simulate upload progress
    newUploads.forEach(upload => {
      simulateUploadProgress(upload.id);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const simulateUploadProgress = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, progress: 100, status: 'completed' } : f
          )
        );
      } else {
        setUploadingFiles(prev =>
          prev.map(f => (f.id === fileId ? { ...f, progress } : f))
        );
      }
    }, 500);
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl text-white font-semibold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground">
          Upload new documents to your document library
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag and Drop Zone */}
          <Card className="rounded-[16px]">
            <CardContent className="p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-300 dark:border-slate-700 hover:border-primary'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG up to 10MB
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <Card className="rounded-[16px]">
              <CardHeader>
                <CardTitle>Uploading Files</CardTitle>
                <CardDescription>
                  {uploadingFiles.filter(f => f.status === 'uploading').length} file(s) in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadingFiles.map(file => (
                    <div key={file.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {file.status === 'uploading' && (
                            <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                          )}
                          {file.status === 'completed' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                          {file.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm text-muted-foreground">
                            {Math.round(file.progress)}%
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            file.status === 'completed'
                              ? 'bg-green-500'
                              : file.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Details Form */}
          <Card className="rounded-[16px]">
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>
                Add additional information about your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select>
                    <SelectTrigger id="document-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="INVOICE">Invoice</SelectItem>
                      <SelectItem value="RECEIPT">Receipt</SelectItem>
                      <SelectItem value="REPORT">Report</SelectItem>
                      <SelectItem value="POLICY">Policy</SelectItem>
                      <SelectItem value="FORM">Form</SelectItem>
                      <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folder">Folder</Label>
                  <Select>
                    <SelectTrigger id="folder">
                      <SelectValue placeholder="Select folder (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Root</SelectItem>
                      <SelectItem value="contracts">Contracts</SelectItem>
                      <SelectItem value="invoices">Invoices</SelectItem>
                      <SelectItem value="hr">HR Documents</SelectItem>
                      <SelectItem value="tax">Tax Returns</SelectItem>
                      <SelectItem value="reports">Reports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" placeholder="Add tags (comma separated)" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a description (optional)"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Allowed File Types */}
          <Card className="rounded-[16px]">
            <CardHeader>
              <CardTitle className="text-lg">Allowed File Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allowedFileTypes.map((type, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.extension}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card className="rounded-[16px]">
            <CardHeader>
              <CardTitle className="text-lg">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentUploads.map(upload => (
                  <div key={upload.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <File className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{upload.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {upload.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {upload.size}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {upload.uploadedAt}
                        </p>
                      </div>
                    </div>
                    {upload.id !== mockRecentUploads[mockRecentUploads.length - 1]?.id && (
                      <div className="border-t dark:border-slate-700 pt-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
