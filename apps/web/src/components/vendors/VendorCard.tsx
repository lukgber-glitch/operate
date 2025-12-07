'use client';

import { Building2, Mail, Phone, Globe, MapPin, CreditCard, Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Vendor, VendorStatus } from '@/lib/api/vendors';

export interface VendorCardProps {
  vendor: Vendor;
}

const statusVariants: Record<VendorStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function VendorCard({ vendor }: VendorCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {vendor.displayName || vendor.name}
              </CardTitle>
              {vendor.displayName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Legal Name: {vendor.name}
                </p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className={statusVariants[vendor.status]}>
            {vendor.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <div className="space-y-2">
            {vendor.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                  {vendor.email}
                </a>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                  {vendor.phone}
                </a>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {vendor.website}
                </a>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Address */}
        {(vendor.addressLine1 || vendor.city || vendor.country) && (
          <>
            <div>
              <h3 className="font-semibold mb-3">Address</h3>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {vendor.addressLine1 && <div>{vendor.addressLine1}</div>}
                  {vendor.addressLine2 && <div>{vendor.addressLine2}</div>}
                  <div>
                    {vendor.city && <span>{vendor.city}</span>}
                    {vendor.state && <span>, {vendor.state}</span>}
                    {vendor.postalCode && <span> {vendor.postalCode}</span>}
                  </div>
                  {vendor.country && <div>{vendor.country}</div>}
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Payment Information */}
        <div>
          <h3 className="font-semibold mb-3">Payment Information</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment Terms</span>
              <span className="font-medium">{vendor.paymentTerms} days</span>
            </div>
            {vendor.preferredPaymentMethod && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Preferred Method</span>
                <span className="font-medium">{vendor.preferredPaymentMethod}</span>
              </div>
            )}
            {vendor.taxId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax ID</span>
                <span className="font-medium">
                  {vendor.taxId} ({vendor.taxIdType})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Banking Details */}
        {(vendor.bankIban || vendor.bankBic) && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Banking Details
              </h3>
              <div className="space-y-2">
                {vendor.bankAccountName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Account Holder</span>
                    <span className="font-medium">{vendor.bankAccountName}</span>
                  </div>
                )}
                {vendor.bankIban && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">IBAN</span>
                    <span className="font-mono text-xs">{vendor.bankIban}</span>
                  </div>
                )}
                {vendor.bankBic && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">BIC/SWIFT</span>
                    <span className="font-mono text-xs">{vendor.bankBic}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {vendor.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {vendor.notes}
              </p>
            </div>
          </>
        )}

        {/* Metadata */}
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created: {formatDate(vendor.createdAt)}</span>
          </div>
          <div>Updated: {formatDate(vendor.updatedAt)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
