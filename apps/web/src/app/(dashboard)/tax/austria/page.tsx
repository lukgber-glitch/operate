import { Metadata } from 'next';

import { GlassCard } from '@/components/ui/glass-card';
import { UVAWizard } from './components/UVAWizard';

export const metadata: Metadata = {
  title: 'Austrian VAT Filing | Operate',
  description: 'Submit your Austrian VAT return (UVA) to FinanzOnline',
};

export default function AustrianTaxFilingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Austrian VAT Filing (UVA)</h1>
          <p className="text-white/70">Submit your Austrian VAT return (Umsatzsteuervoranmeldung) to FinanzOnline</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl text-white">🇦🇹</span>
        </div>
      </div>

      <GlassCard padding="lg">
        <UVAWizard />
      </GlassCard>
    </div>
  );
}
