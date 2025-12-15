import { PortalHeader } from '@/components/portal/PortalHeader';
import { PortalFooter } from '@/components/portal/PortalFooter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <PortalHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
      <PortalFooter />
    </div>
  );
}
