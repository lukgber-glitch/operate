'use client';

import { CheckCircle2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { EmployeeOnboardingData, OnboardingStep } from '@/types/employee-onboarding';

interface ReviewStepProps {
  data: EmployeeOnboardingData;
  onBack: () => void;
  onEdit: (step: OnboardingStep) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function ReviewStep({ data, onBack, onEdit, onSubmit, isSubmitting }: ReviewStepProps) {
  const { personalInfo, employmentDetails, taxInfo, directDeposit, benefits, documents } = data;

  // Mask SSN
  const maskSSN = (ssn?: string) => {
    if (!ssn) return 'Not provided';
    return `***-**-${ssn.slice(-4)}`;
  };

  // Mask account number
  const maskAccount = (account?: string) => {
    if (!account) return 'Not provided';
    return `****${account.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic personal details</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('personal-info')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-sm">
                {personalInfo?.firstName} {personalInfo?.middleName} {personalInfo?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p className="text-sm">{personalInfo?.dateOfBirth || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{personalInfo?.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-sm">{personalInfo?.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">SSN</p>
              <p className="text-sm">{maskSSN(personalInfo?.ssn)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-sm">
                {personalInfo?.street1}, {personalInfo?.city}, {personalInfo?.state} {personalInfo?.zipCode}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Employment Details</CardTitle>
            <CardDescription>Job title and compensation</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('employment-details')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Job Title</p>
              <p className="text-sm">{employmentDetails?.jobTitle || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-sm">{employmentDetails?.department || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p className="text-sm">{employmentDetails?.startDate || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
              <Badge variant="secondary">
                {employmentDetails?.employmentType?.replace('-', ' ').toUpperCase() || 'Not provided'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Compensation</p>
              <p className="text-sm">
                ${employmentDetails?.compensationAmount?.toLocaleString()} / {employmentDetails?.paymentUnit}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">FLSA Status</p>
              <p className="text-sm">{employmentDetails?.flsaStatus || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Tax Information</CardTitle>
            <CardDescription>W-4 withholding details</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('tax-info')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Filing Status</p>
              <p className="text-sm">
                {taxInfo?.filingStatus?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Multiple Jobs</p>
              <p className="text-sm">{taxInfo?.multipleJobs ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dependents Amount</p>
              <p className="text-sm">${taxInfo?.dependentsAmount || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Extra Withholding</p>
              <p className="text-sm">${taxInfo?.extraWithholding || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Direct Deposit</CardTitle>
            <CardDescription>Bank account information</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('direct-deposit')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
              <p className="text-sm">{directDeposit?.bankName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Type</p>
              <Badge variant="secondary">
                {directDeposit?.accountType?.toUpperCase() || 'Not provided'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Routing Number</p>
              <p className="text-sm">{directDeposit?.routingNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Number</p>
              <p className="text-sm">{maskAccount(directDeposit?.accountNumber)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Benefits</CardTitle>
            <CardDescription>Health insurance and 401k</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('benefits')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Health Insurance</p>
              {benefits?.enrollInHealthInsurance ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm">
                    Enrolled - Plan ID: {benefits.healthPlanId} ({benefits.dependentsCovered} dependents)
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not enrolled</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">401(k) Plan</p>
              {benefits?.enrollIn401k ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm">
                    Enrolled - {benefits.contributionPercentage ? `${benefits.contributionPercentage}%` : `$${benefits.contributionAmount}`} per paycheck
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not enrolled</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Uploaded forms and files</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('documents')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            {documents?.i9FormId ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted" />
            )}
            <p className="text-sm">Form I-9 {documents?.i9FormId ? 'uploaded' : 'not uploaded'}</p>
          </div>
          <div className="flex items-center gap-2">
            {documents?.w4FormId ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted" />
            )}
            <p className="text-sm">Form W-4 {documents?.w4FormId ? 'uploaded' : 'not uploaded (optional)'}</p>
          </div>
          {documents?.otherDocuments && documents.otherDocuments.length > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm">{documents.otherDocuments.length} additional document(s)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
        </Button>
      </div>
    </div>
  );
}
