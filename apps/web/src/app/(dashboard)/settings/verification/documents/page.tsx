'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { VerificationProgress } from '@/components/verification/VerificationProgress';
import { DocumentUploader } from '@/components/verification/DocumentUploader';
import { useVerification } from '@/hooks/use-verification';
import { useKycRequirements } from '@/hooks/use-kyc-requirements';
import { DocumentType, VerificationStatus, type VerificationDocument } from '@/types/verification';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const verificationSteps = [
  { id: 'start', title: 'Start', description: 'Choose verification level' },
  { id: 'documents', title: 'Documents', description: 'Upload required documents' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { verification, isLoading, refetch, submitVerification } = useVerification();
  const { requirements, refetch: refetchRequirements } = useKycRequirements(verification?.level);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if verification not started
    if (!isLoading && (!verification || verification.status === VerificationStatus.NOT_STARTED)) {
      router.push('/settings/verification/start');
    }
  }, [verification, isLoading, router]);

  const handleDocumentUpload = async (document: VerificationDocument) => {
    toast({
      title: 'Document uploaded',
      description: 'Your document has been successfully uploaded.',
    });
    // Refresh verification and requirements
    await Promise.all([refetch(), refetchRequirements(verification?.level)]);
  };

  const handleContinue = () => {
    router.push('/settings/verification/review');
  };

  const handleBack = () => {
    router.push('/settings/verification/start');
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  const requiredDocs = requirements.filter(r => r.required);
  const completedRequired = requiredDocs.filter(r => r.completed).length;
  const canContinue = completedRequired === requiredDocs.length;

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Progress */}
      <VerificationProgress
        steps={verificationSteps}
        currentStep={1}
        completedSteps={new Set([0])}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
        <p className="text-muted-foreground">
          Please upload the required documents to verify your identity
        </p>
      </div>

      {/* Progress Alert */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              {completedRequired} of {requiredDocs.length} required documents uploaded
            </span>
            {canContinue ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                <CheckCircle className="w-4 h-4" />
                Ready to continue
              </span>
            ) : (
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                {requiredDocs.length - completedRequired} remaining
              </span>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Documents Grid */}
      <div className="space-y-6">
        {requirements.map((requirement) => (
          <Card key={requirement.type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {requirement.label}
                    {requirement.completed && (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </CardTitle>
                  <CardDescription>{requirement.description}</CardDescription>
                </div>
                {!requirement.required && (
                  <span className="text-xs text-muted-foreground">Optional</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DocumentUploader
                documentType={requirement.type as DocumentType}
                onUploadComplete={handleDocumentUpload}
                acceptedFormats={requirement.acceptedFormats}
                maxSizeMB={requirement.maxSizeMB}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          size="lg"
          className="gap-2"
        >
          Continue to Review
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {!canContinue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please upload all required documents before continuing
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
