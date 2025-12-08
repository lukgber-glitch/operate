import { Metadata } from 'next';

import { Card, CardContent } from '@/components/ui/card';
import { TaxFilingWizard } from './components/tax-filing/TaxFilingWizard';

export const metadata: Metadata = {
  title: 'VAT Filing | Operate',
  description: 'Submit your VAT return (Umsatzsteuervoranmeldung) to ELSTER',
};

export default function TaxFilingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">VAT Filing (UStVA)</h1>
        <p className="text-muted-foreground">Submit your German VAT return (Umsatzsteuervoranmeldung) to ELSTER</p>
      </div>

      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <TaxFilingWizard />
        </CardContent>
      </Card>
    </div>
  );
}
