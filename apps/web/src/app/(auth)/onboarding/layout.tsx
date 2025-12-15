export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove wrapper - OnboardingWizard handles its own layout
  return <>{children}</>;
}
