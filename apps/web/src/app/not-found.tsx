'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, MessageSquare, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * Custom 404 Page - Not Found
 *
 * Displays when users navigate to non-existent routes.
 * Provides helpful navigation options back to the app.
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <GlassCard intensity="medium" animate={false} className="max-w-md w-full text-center p-8 space-y-8">
        <div className="space-y-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <span className="text-4xl font-bold text-blue-600">404</span>
          </div>
          <h1 className="text-2xl font-semibold text-blue-700">Page Not Found</h1>
          <p className="text-base text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/">
                <MessageSquare className="mr-2 h-5 w-5" />
                Go to Chat
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Home className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
