import { Metadata } from 'next';

import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { ELSTERWizard } from '@/components/tax/elster';

export const metadata: Metadata = {
  title: 'German VAT Filing | Operate',
  description: 'Submit your German VAT return (USt-VA) via ELSTER',
};

export default function GermanTaxFilingPage() {
  return (
    <div className="space-y-6">
      <HeadlineOutside
        subtitle="Submit your German VAT return (Umsatzsteuer-Voranmeldung) via ELSTER"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇩🇪</span>
          </div>
        }
      >
        German VAT Filing (USt-VA)
      </HeadlineOutside>

      <AnimatedCard variant="elevated" padding="lg">
        <ELSTERWizard />
      </AnimatedCard>
    </div>
  );
}
