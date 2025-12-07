// Example Dashboard Layout with Legal Components Integration
// Copy this pattern to your actual dashboard layout

'use client';

import { useEffect, useState } from 'react';
import { FirstTimeConsent } from '@/components/legal/FirstTimeConsent';
import { Footer } from '@/components/layout/Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user needs to consent
    async function checkConsent() {
      try {
        const response = await fetch('/api/v1/user/profile');
        const data = await response.json();

        // Show consent modal if user hasn't consented yet
        if (!data.consentedAt) {
          setShowConsent(true);
        }
      } catch (error) {
        console.error('Failed to check consent status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkConsent();
  }, []);

  const handleConsent = () => {
    setShowConsent(false);
    // The FirstTimeConsent component handles saving consent to the API
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* First-time user consent modal */}
      <FirstTimeConsent isOpen={showConsent} onConsent={handleConsent} />

      {/* Main dashboard content */}
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>

        {/* Footer with legal links */}
        <Footer />
      </div>
    </>
  );
}
