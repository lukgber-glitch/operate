import { Metadata } from 'next';

import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { UVAWizard } from './components/UVAWizard';

export const metadata: Metadata = {
  title: 'Austrian VAT Filing | Operate',
  description: 'Submit your Austrian VAT return (UVA) to FinanzOnline',
};

export default function AustrianTaxFilingPage() {
  return (
    <div className="space-y-6">
      <HeadlineOutside
        subtitle="Submit your Austrian VAT return (Umsatzsteuervoranmeldung) to FinanzOnline"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇦🇹</span>
          </div>
        }
      >
        Austrian VAT Filing (UVA)
      </HeadlineOutside>

      <AnimatedCard variant="elevated" padding="lg">
        <UVAWizard />
      </AnimatedCard>
    </div>
  );
}
