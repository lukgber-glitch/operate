'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { InsurancePolicy } from '@/hooks/use-insurance';
import { InsuranceTypeIcon, getInsuranceTypeLabel } from './InsuranceTypeIcon';
import { InsuranceStatusBadge } from './InsuranceStatusBadge';
import { getExpiryColor, getDaysUntilExpiry } from './utils';

interface InsurancePolicyCardProps {
  policy: InsurancePolicy;
}

export function InsurancePolicyCard({ policy }: InsurancePolicyCardProps) {
  const daysUntilExpiry = getDaysUntilExpiry(policy.endDate);
  const expiryColor = getExpiryColor(daysUntilExpiry);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <InsuranceTypeIcon type={policy.type} className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-medium text-white">
              {policy.name}
            </CardTitle>
            <p className="text-sm text-gray-400">{getInsuranceTypeLabel(policy.type)}</p>
          </div>
        </div>
        <InsuranceStatusBadge status={policy.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Provider</p>
            <p className="text-sm font-medium text-white">{policy.provider}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Policy Number</p>
            <p className="text-sm font-medium text-white">{policy.policyNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-white font-medium">
            {formatCurrency(policy.premiumAmount)}
          </span>
          <span className="text-gray-400">/ {policy.paymentFrequency.toLowerCase()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={`${expiryColor} font-medium`}>
              {daysUntilExpiry > 0
                ? `Expires in ${daysUntilExpiry} days`
                : daysUntilExpiry === 0
                ? 'Expires today'
                : 'Expired'}
            </span>
          </div>
          <Link href={`/insurance/policies/${policy.id}`}>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
