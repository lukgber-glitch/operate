import { Suspense } from 'react';
import CallbackClient from './CallbackClient';

// Force dynamic rendering - never cache this page
// This is critical for OAuth callback to work properly
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Loading fallback while React hydrates
function LoadingFallback() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
        <div className="space-y-1 mb-4">
          <h2 className="text-2xl font-bold">Processing...</h2>
          <p className="text-sm text-muted-foreground">Completing your sign in...</p>
        </div>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackClient />
    </Suspense>
  );
}
