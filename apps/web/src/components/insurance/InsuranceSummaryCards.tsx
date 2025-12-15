'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, DollarSign, FileText } from 'lucide-react';

import { useInsuranceSummary } from '@/hooks/use-insurance';

export function InsuranceSummaryCards() {
  const { summary, isLoading, fetchSummary } = useInsuranceSummary();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Policies',
      value: summary.totalPolicies,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Active Policies',
      value: summary.activePolicies,
      icon: Shield,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Expiring Soon',
      value: summary.expiringPolicies,
      icon: AlertCircle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      title: 'Annual Cost',
      value: formatCurrency(summary.annualCost),
      icon: DollarSign,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-8 w-8 bg-white/10 rounded-full animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
