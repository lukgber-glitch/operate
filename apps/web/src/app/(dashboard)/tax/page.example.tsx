// Example Tax Page with Filing Warning
// Copy this pattern to your actual tax page

'use client';

import { useState } from 'react';
import { TaxFilingWarning } from '@/components/tax/TaxFilingWarning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Send } from 'lucide-react';

export default function TaxPage() {
  const [showFilingWarning, setShowFilingWarning] = useState(false);

  const handleStartFiling = () => {
    setShowFilingWarning(true);
  };

  const handleProceedWithFiling = () => {
    // User acknowledged disclaimer, proceed with tax filing
    console.log('User acknowledged tax filing disclaimer');

    // Navigate to tax filing wizard or initiate filing process
    window.location.href = '/dashboard/tax/file';
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tax Filing</h1>
        <p className="text-muted-foreground">
          Prepare and file your tax returns with AI assistance
        </p>
      </div>

      {/* Tax Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Annual Tax Return</CardTitle>
            <CardDescription>File your yearly tax return</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              All your income, expenses, and deductions are ready. Review and file your return
              with confidence.
            </p>
            <Button onClick={handleStartFiling} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Start Filing
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Documents</CardTitle>
            <CardDescription>View and download tax forms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access all your tax-related documents, receipts, and reports in one place.
            </p>
            <Button variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              View Documents
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tax Filing Warning Modal */}
      <TaxFilingWarning
        isOpen={showFilingWarning}
        onCancel={() => setShowFilingWarning(false)}
        onProceed={handleProceedWithFiling}
      />

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
          Important Tax Information
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Review all information carefully before filing</li>
          <li>Consult a tax professional for complex situations</li>
          <li>Keep copies of all submitted documents</li>
          <li>File before the deadline to avoid penalties</li>
        </ul>
      </div>
    </div>
  );
}
