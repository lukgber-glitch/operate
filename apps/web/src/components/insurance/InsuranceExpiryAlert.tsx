'use client';

import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { useExpiringPolicies } from '@/hooks/use-insurance';

export function InsuranceExpiryAlert() {
  const { policies, isLoading, fetchExpiringPolicies } = useExpiringPolicies(30);

  useEffect(() => {
    fetchExpiringPolicies();
  }, [fetchExpiringPolicies]);

  if (isLoading || policies.length === 0) {
    return null;
  }

  return (
    <Alert className="bg-yellow-500/10 border-yellow-500/50">
      <AlertCircle className="h-4 w-4 text-yellow-400" />
      <AlertTitle className="text-yellow-400">Policies Expiring Soon</AlertTitle>
      <AlertDescription className="text-yellow-300">
        You have {policies.length} {policies.length === 1 ? 'policy' : 'policies'} expiring in the next 30 days.
        <div className="mt-2">
          <Link href="/insurance/policies?expiringSoon=true">
            <Button variant="outline" size="sm" className="text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/20">
              View Expiring Policies
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
