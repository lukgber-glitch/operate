import { Metadata } from 'next';

import { GlassCard } from '@/components/ui/glass-card';
import { ELSTERWizard } from '@/components/tax/elster';

export const metadata: Metadata = {
  title: 'German VAT Filing | Operate',
  description: 'Submit your German VAT return (USt-VA) via ELSTER',
};

export default function GermanTaxFilingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">German VAT Filing (USt-VA)</h1>
          <p className="text-white/70">Submit your German VAT return (Umsatzsteuer-Voranmeldung) via ELSTER</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl text-white">🇩🇪</span>
        </div>
      </div>

      <GlassCard padding="lg">
        <ELSTERWizard />
      </GlassCard>
    </div>
  );
}
