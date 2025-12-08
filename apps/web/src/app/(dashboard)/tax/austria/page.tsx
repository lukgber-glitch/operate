import { Metadata } from 'next';

import { Card, CardContent } from '@/components/ui/card';
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
          <h1 className="text-2xl font-semibold tracking-tight">Austrian VAT Filing (UVA)</h1>
          <p className="text-muted-foreground">Submit your Austrian VAT return (Umsatzsteuervoranmeldung) to FinanzOnline</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇦🇹</span>
        </div>
      </div>

      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <UVAWizard />
        </CardContent>
      </Card>
    </div>
  );
}
