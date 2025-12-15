import { Metadata } from 'next';

import { GlassCard } from '@/components/ui/glass-card';
import { CardContent } from '@/components/ui/card';
import { TaxFilingWizard } from './components/tax-filing/TaxFilingWizard';

export const metadata: Metadata = {
  title: 'VAT Filing | Operate',
  description: 'Submit your VAT return (Umsatzsteuervoranmeldung) to ELSTER',
};

export default function TaxFilingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-white font-semibold tracking-tight">VAT Filing (UStVA)</h1>
        <p className="text-white/70">Submit your German VAT return (Umsatzsteuervoranmeldung) to ELSTER</p>
      </div>

      <GlassCard padding="lg">
          <TaxFilingWizard />
      </GlassCard>
    </div>
  );
}
