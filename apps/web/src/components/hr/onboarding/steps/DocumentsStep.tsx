'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Upload, FileText, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { documentsSchema, type DocumentsFormData } from '@/lib/validations/employee-onboarding';
import type { Documents } from '@/types/employee-onboarding';

interface DocumentsStepProps {
  data?: Documents;
  onNext: (data: Documents) => void;
  onBack: () => void;
  onSaveDraft?: () => void;
}

export function DocumentsStep({ data, onNext, onBack, onSaveDraft }: DocumentsStepProps) {
  const [i9File, setI9File] = useState<File | null>(null);
  const [w4File, setW4File] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  const form = useForm<DocumentsFormData>({
    resolver: zodResolver(documentsSchema),
    defaultValues: data || {
      i9FormId: undefined,
      w4FormId: undefined,
      otherDocuments: [],
    },
  });

  const handleFileUpload = async (file: File, type: 'i9' | 'w4' | 'other') => {
    // In production, upload to server and get file ID
    // For now, simulate upload
    const mockFileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (type === 'i9') {
      setI9File(file);
      form.setValue('i9FormId', mockFileId);
    } else if (type === 'w4') {
      setW4File(file);
      form.setValue('w4FormId', mockFileId);
    } else {
      setOtherFiles((prev) => [...prev, file]);
      const currentDocs = form.getValues('otherDocuments') || [];
      form.setValue('otherDocuments', [...currentDocs, mockFileId]);
    }
  };

  const removeFile = (type: 'i9' | 'w4' | 'other', index?: number) => {
    if (type === 'i9') {
      setI9File(null);
      form.setValue('i9FormId', undefined);
    } else if (type === 'w4') {
      setW4File(null);
      form.setValue('w4FormId', undefined);
    } else if (index !== undefined) {
      setOtherFiles((prev) => prev.filter((_, i) => i !== index));
      const currentDocs = form.getValues('otherDocuments') || [];
      form.setValue('otherDocuments', currentDocs.filter((_, i) => i !== index));
    }
  };

  const onSubmit = (formData: DocumentsFormData) => {
    onNext(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Upload required employment documents. All files are securely encrypted and stored. Accepted formats: PDF, JPG, PNG (max 10MB each).
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Form I-9 - Employment Eligibility Verification</CardTitle>
            <CardDescription>
              Required by law to verify identity and employment authorization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!i9File ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <label htmlFor="i9-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">Upload Form I-9</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 10MB</p>
                  <input
                    id="i9-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'i9');
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{i9File.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(i9File.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('i9')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form W-4 - Tax Withholding Certificate</CardTitle>
            <CardDescription>
              Optional: Upload completed W-4 form if you have it pre-filled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!w4File ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <label htmlFor="w4-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">Upload Form W-4 (Optional)</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 10MB</p>
                  <input
                    id="w4-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'w4');
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{w4File.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(w4File.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('w4')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Documents</CardTitle>
            <CardDescription>
              Upload any other relevant documents (resume, certifications, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('other', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <label htmlFor="other-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Upload Additional Documents</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 10MB</p>
                <input
                  id="other-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach((file) => handleFileUpload(file, 'other'));
                  }}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <div className="flex gap-4">
            {onSaveDraft && (
              <Button type="button" variant="outline" onClick={onSaveDraft}>
                Save Draft
              </Button>
            )}
            <Button type="submit">Next</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
