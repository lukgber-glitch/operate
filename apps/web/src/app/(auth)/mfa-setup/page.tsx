import { MfaSetup } from '@/components/auth/mfa-setup';
import { Card, CardContent } from '@/components/ui/card';

export default function MfaSetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Set up two-factor authentication</h1>
        <p className="text-muted-foreground">Secure your account with an additional layer of protection</p>
      </div>
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <div className="space-y-6">
            <MfaSetup />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
