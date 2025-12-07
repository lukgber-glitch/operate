import { Metadata } from 'next';

import { ELSTERWizard } from '@/components/tax/elster';

export const metadata: Metadata = {
  title: 'German VAT Filing | Operate',
  description: 'Submit your German VAT return (USt-VA) via ELSTER',
};

export default function GermanTaxFilingPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            German VAT Filing (USt-VA)
          </h1>
          <p className="text-muted-foreground mt-2">
            Submit your German VAT return (Umsatzsteuer-Voranmeldung) via ELSTER
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇩🇪</span>
        </div>
      </div>

      {/* Filing Wizard */}
      <ELSTERWizard />
    </div>
  );
}
