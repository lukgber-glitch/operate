import { Metadata } from 'next';

import { TaxFilingWizard } from './components/tax-filing/TaxFilingWizard';

export const metadata: Metadata = {
  title: 'VAT Filing | Operate',
  description: 'Submit your VAT return (Umsatzsteuervoranmeldung) to ELSTER',
};

export default function TaxFilingPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">VAT Filing (UStVA)</h1>
        <p className="text-muted-foreground mt-2">
          Submit your German VAT return (Umsatzsteuervoranmeldung) to ELSTER
        </p>
      </div>

      {/* Filing Wizard */}
      <TaxFilingWizard />
    </div>
  );
}
