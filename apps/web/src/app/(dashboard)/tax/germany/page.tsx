import { Metadata } from 'next';

import { Card, CardContent } from '@/components/ui/card';
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
          <h1 className="text-2xl font-semibold tracking-tight">German VAT Filing (USt-VA)</h1>
          <p className="text-muted-foreground">Submit your German VAT return (Umsatzsteuer-Voranmeldung) via ELSTER</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇩🇪</span>
        </div>
      </div>

      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <ELSTERWizard />
        </CardContent>
      </Card>
    </div>
  );
}
