import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MfaSetup } from '@/components/auth/mfa-setup';

export default function MfaSetupPage() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Set up two-factor authentication</CardTitle>
        <CardDescription>
          Secure your account with an additional layer of protection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MfaSetup />
      </CardContent>
    </Card>
  );
}
