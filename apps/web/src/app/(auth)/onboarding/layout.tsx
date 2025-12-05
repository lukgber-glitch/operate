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

  return <>{children}</>;
}
