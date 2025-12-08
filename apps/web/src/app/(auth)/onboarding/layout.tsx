import { GradientBackground } from '@/components/animation/gradient-background';
// import { redirect } from 'next/navigation';
// import { getServerSession } from '@/lib/auth'; // TODO: Implement server auth check

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Check if user is authenticated
  // const session = await getServerSession();
  // if (!session) redirect('/login');

  // TODO: Check if onboarding is already complete
  // if (session.user.onboardingComplete) redirect('/dashboard');

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: 'var(--color-background-light)',
      }}
    >
      <GradientBackground intensity="subtle" />

      {/* Content - Onboarding max-width ~560px */}
      <div className="relative z-10 w-full px-4" style={{ maxWidth: '560px' }}>
        {children}
      </div>
    </div>
  );
}
