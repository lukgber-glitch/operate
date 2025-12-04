'use client';

import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  TrendingUp,
  Clock,
  DollarSign,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client, ClientMetrics } from '@/lib/api/crm';

interface ClientOverviewProps {
  client: Client;
  metrics?: ClientMetrics;
  isLoadingMetrics: boolean;
}

export function ClientOverview({ client, metrics, isLoadingMetrics }: ClientOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left Column - Contact & Address Info */}
      <div className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {client.email}
                </a>
              </div>
            </div>

            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
            )}

            {client.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              </div>
            )}

            {client.industry && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Industry</p>
                  <p className="text-sm text-muted-foreground">{client.industry}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Primary Address */}
        {client.address && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Primary Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  {client.address.street && <p>{client.address.street}</p>}
                  {(client.address.city || client.address.postalCode) && (
                    <p>
                      {client.address.postalCode} {client.address.city}
                    </p>
                  )}
                  <p className="text-muted-foreground">{client.address.countryCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {client.tags && client.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {client.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Metrics */}
      <div className="space-y-6">
        {isLoadingMetrics ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            {/* Revenue Metric */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(client.totalRevenue)}</div>
                {metrics && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">This Month</span>
                      <span className="font-medium">
                        {formatCurrency(metrics.revenue.thisMonth)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Month</span>
                      <span className="font-medium">
                        {formatCurrency(metrics.revenue.lastMonth)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Growth</span>
                      <span
                        className={`font-medium ${
                          metrics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {metrics.revenue.growth >= 0 ? '+' : ''}
                        {metrics.revenue.growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outstanding Balance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    (metrics?.invoices.pending || 0) + (metrics?.invoices.overdue || 0)
                  )}
                </div>
                {metrics && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending Invoices</span>
                      <span className="font-medium">{metrics.invoices.pending}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overdue Invoices</span>
                      <span className="font-medium text-red-600">{metrics.invoices.overdue}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Paid Invoices</span>
                      <span className="font-medium text-green-600">{metrics.invoices.paid}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Behavior */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Behavior</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.avgPaymentDays} days</div>
                <p className="text-xs text-muted-foreground mt-1">Average payment time</p>
                {metrics && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">On-Time Rate</span>
                      <span className="font-medium">
                        {metrics.payment.onTimeRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payment Terms</span>
                      <span className="font-medium">{client.paymentTerms || 30} days</span>
                    </div>
                    {client.creditLimit && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span className="font-medium">{formatCurrency(client.creditLimit)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
