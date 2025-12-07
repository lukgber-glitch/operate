import { Metadata } from 'next';

import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { TaxFilingWizard } from './components/tax-filing/TaxFilingWizard';

export const metadata: Metadata = {
  title: 'VAT Filing | Operate',
  description: 'Submit your VAT return (Umsatzsteuervoranmeldung) to ELSTER',
};

export default function TaxFilingPage() {
  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle="Submit your German VAT return (Umsatzsteuervoranmeldung) to ELSTER">
        VAT Filing (UStVA)
      </HeadlineOutside>

      <AnimatedCard variant="elevated" padding="lg">
        <TaxFilingWizard />
      </AnimatedCard>
    </div>
  );
}
