export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-muted">
      {/* Content - Onboarding max-width ~560px */}
      <div className="relative z-10 w-full px-4" style={{ maxWidth: '560px' }}>
        {children}
      </div>
    </div>
  );
}
