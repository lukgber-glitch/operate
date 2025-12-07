'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  FileText,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { USJurisdictionSelector } from '@/components/tax/USJurisdictionSelector';
import { TaxRateDisplay } from '@/components/tax/TaxRateDisplay';
import { TaxBreakdownCard } from '@/components/tax/TaxBreakdownCard';
import { useUSTax, type TaxAddress } from '@/hooks/useUSTax';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';

export default function TaxSettingsPage() {
  const [selectedAddress, setSelectedAddress] = useState<TaxAddress | null>(null);
  const { useTaxRate } = useUSTax();

  const { data: taxRate, isLoading } = useTaxRate(selectedAddress, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">US Tax Settings</h1>
        <p className="text-muted-foreground">
          Manage US sales tax configuration, nexus registrations, and exemption
          certificates
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              Avalara AvaTax Integration
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your account is connected to Avalara AvaTax for automated US sales tax
              calculations. Tax rates are updated in real-time based on jurisdiction
              rules.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Nexus Registration
            </CardTitle>
            <CardDescription>
              Configure states where you have sales tax nexus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/tax/nexus">
              <Button className="w-full">
                Manage Nexus
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Exemption Certificates
            </CardTitle>
            <CardDescription>
              Manage customer tax exemption certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/tax/exemptions">
              <Button className="w-full">
                Manage Exemptions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Tax Compliance
            </CardTitle>
            <CardDescription>View compliance status and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tax/reports">
              <Button className="w-full" variant="outline">
                View Reports
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tax Rate Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tax Rate Calculator
          </CardTitle>
          <CardDescription>
            Preview tax rates for any US jurisdiction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <USJurisdictionSelector
                value={selectedAddress || undefined}
                onChange={setSelectedAddress}
                showValidation
              />
            </div>
            <div>
              <TaxRateDisplay taxRate={taxRate} isLoading={isLoading} />
            </div>
          </div>

          {taxRate && taxRate.jurisdictions && (
            <div className="mt-6">
              <TaxBreakdownCard
                jurisdictions={taxRate.jurisdictions}
                totalRate={taxRate.totalRate}
                sampleAmount={100}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
          <CardDescription>
            Review your current tax settings and compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Avalara Integration</div>
                <div className="text-sm text-muted-foreground">
                  Connected and operational
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Nexus Registrations</div>
                <div className="text-sm text-muted-foreground">
                  States where you collect tax
                </div>
              </div>
              <Link href="/settings/tax/nexus">
                <Button variant="ghost" size="sm">
                  Configure
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Exemption Certificates</div>
                <div className="text-sm text-muted-foreground">
                  Customer tax exemptions
                </div>
              </div>
              <Link href="/settings/tax/exemptions">
                <Button variant="ghost" size="sm">
                  Manage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">Tax Reporting</div>
                <div className="text-sm text-muted-foreground">
                  Generate tax reports and filings
                </div>
              </div>
              <Link href="/tax/reports">
                <Button variant="ghost" size="sm">
                  View Reports
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
