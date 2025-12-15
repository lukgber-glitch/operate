'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import {
  InsuranceSummaryCards,
  InsurancePolicyCard,
  InsuranceExpiryAlert,
} from '@/components/insurance';
import { useInsurancePolicies, useExpiringPolicies } from '@/hooks/use-insurance';

export default function InsurancePage() {
  const { policies, fetchPolicies } = useInsurancePolicies();
  const { policies: expiringPolicies, fetchExpiringPolicies } = useExpiringPolicies(30);

  useEffect(() => {
    fetchPolicies();
    fetchExpiringPolicies();
  }, [fetchPolicies, fetchExpiringPolicies]);

  const upcomingPayments = [
    { id: '1', policy: 'Professional Liability Insurance', amount: 1200, date: '2025-01-01' },
    { id: '2', policy: 'Office Property Insurance', amount: 150, date: '2025-01-01' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Insurance</h1>
          <p className="text-gray-400">Manage your business insurance policies</p>
        </div>
        <Link href="/insurance/policies/new">
          <Button className="bg-white text-blue-900 hover:bg-gray-100">
            <Plus className="h-4 w-4 mr-2" />
            Add Policy
          </Button>
        </Link>
      </div>

      {/* Expiry Alert */}
      <InsuranceExpiryAlert />

      {/* Summary Cards */}
      <InsuranceSummaryCards />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Policies */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Active Policies</h2>
            <Link href="/insurance/policies">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {policies.slice(0, 4).map(policy => (
              <InsurancePolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Payments */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Upcoming Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingPayments.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{payment.policy}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(payment.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <span className="text-white font-semibold">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Expiring Policies */}
          {expiringPolicies.length > 0 && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expiringPolicies.slice(0, 3).map(policy => (
                  <Link key={policy.id} href={`/insurance/policies/${policy.id}`}>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                      <p className="text-white font-medium text-sm">{policy.name}</p>
                      <p className="text-xs text-yellow-400">
                        Expires {format(new Date(policy.endDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
