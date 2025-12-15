'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import {
  InsuranceStatusBadge,
  InsuranceTypeIcon,
  getInsuranceTypeLabel,
  InsurancePaymentSchedule,
  InsuranceDocumentUpload,
  getDaysUntilExpiry,
  getExpiryColor,
} from '@/components/insurance';
import { useInsurancePolicy, useInsurancePolicies } from '@/hooks/use-insurance';

export default function InsurancePolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { policy, documents, payments, fetchPolicy, isLoading } = useInsurancePolicy(id);
  const { deletePolicy } = useInsurancePolicies();

  useEffect(() => {
    if (id) {
      fetchPolicy();
    }
  }, [id, fetchPolicy]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this policy?')) {
      await deletePolicy(id);
      router.push('/insurance/policies');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (isLoading || !policy) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(policy.endDate);
  const expiryColor = getExpiryColor(daysUntilExpiry);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/insurance/policies">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <InsuranceTypeIcon type={policy.type} className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{policy.name}</h1>
                <p className="text-gray-400">{getInsuranceTypeLabel(policy.type)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InsuranceStatusBadge status={policy.status} />
          <Link href={`/insurance/policies/${id}/edit`}>
            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-400 border-red-500/50 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Expiry Warning */}
      {daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div>
            <p className="text-yellow-400 font-medium">Policy Expiring Soon</p>
            <p className="text-yellow-300 text-sm">
              This policy expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'} on{' '}
              {format(new Date(policy.endDate), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Details */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Policy Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Provider</p>
                  <p className="text-white font-medium">{policy.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Policy Number</p>
                  <p className="text-white font-medium">{policy.policyNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Coverage Amount</p>
                  <p className="text-white font-medium">{formatCurrency(policy.coverageAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Deductible</p>
                  <p className="text-white font-medium">{formatCurrency(policy.deductible)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Information */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Premium Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Premium Amount</p>
                  <p className="text-white font-medium text-xl">
                    {formatCurrency(policy.premiumAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Payment Frequency</p>
                  <p className="text-white font-medium capitalize">
                    {policy.paymentFrequency.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Next Payment Due</span>
                  <span className="text-white font-medium">
                    {payments.find(p => p.status === 'PENDING')
                      ? format(
                          new Date(payments.find(p => p.status === 'PENDING')!.dueDate),
                          'MMM dd, yyyy'
                        )
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <InsurancePaymentSchedule payments={payments} onPaymentUpdated={fetchPolicy} />

          {/* Documents */}
          <InsuranceDocumentUpload
            policyId={id}
            documents={documents}
            onDocumentUploaded={fetchPolicy}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Coverage Period */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Coverage Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Start Date</p>
                <p className="text-white font-medium">
                  {format(new Date(policy.startDate), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">End Date</p>
                <p className="text-white font-medium">
                  {format(new Date(policy.endDate), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Days Until Expiry</p>
                <p className={`${expiryColor} font-medium text-lg`}>
                  {daysUntilExpiry >= 0
                    ? `${daysUntilExpiry} days`
                    : `Expired ${Math.abs(daysUntilExpiry)} days ago`}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Auto-Renew</span>
                  <Badge
                    variant="default"
                    className={
                      policy.autoRenew
                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                    }
                  >
                    {policy.autoRenew ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(policy.contactName || policy.contactPhone || policy.contactEmail) && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {policy.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-white">{policy.contactName}</span>
                  </div>
                )}
                {policy.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a
                      href={`tel:${policy.contactPhone}`}
                      className="text-blue-400 hover:underline"
                    >
                      {policy.contactPhone}
                    </a>
                  </div>
                )}
                {policy.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${policy.contactEmail}`}
                      className="text-blue-400 hover:underline"
                    >
                      {policy.contactEmail}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {policy.notes && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{policy.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
