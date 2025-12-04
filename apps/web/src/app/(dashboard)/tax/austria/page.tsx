import { Metadata } from 'next';

import { UVAWizard } from './components/UVAWizard';

export const metadata: Metadata = {
  title: 'Austrian VAT Filing | Operate',
  description: 'Submit your Austrian VAT return (UVA) to FinanzOnline',
};

export default function AustrianTaxFilingPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Austrian VAT Filing (UVA)
          </h1>
          <p className="text-muted-foreground mt-2">
            Submit your Austrian VAT return (Umsatzsteuervoranmeldung) to FinanzOnline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇦🇹</span>
        </div>
      </div>

      {/* Filing Wizard */}
      <UVAWizard />
    </div>
  );
}
