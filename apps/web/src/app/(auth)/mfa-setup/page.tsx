import { MfaSetup } from '@/components/auth/mfa-setup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
