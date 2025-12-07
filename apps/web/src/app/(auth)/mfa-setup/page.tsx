import { MfaSetup } from '@/components/auth/mfa-setup';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';

export default function MfaSetupPage() {
  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle="Secure your account with an additional layer of protection">
        Set up two-factor authentication
      </HeadlineOutside>
      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-6">
          <MfaSetup />
        </div>
      </AnimatedCard>
    </div>
  );
}
