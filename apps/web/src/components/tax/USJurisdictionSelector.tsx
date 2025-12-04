'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { US_STATES, type TaxAddress, useUSTax } from '@/hooks/useUSTax';

interface USJurisdictionSelectorProps {
  value?: TaxAddress;
  onChange: (address: TaxAddress) => void;
  showValidation?: boolean;
  disabled?: boolean;
}

export function USJurisdictionSelector({
  value,
  onChange,
  showValidation = false,
  disabled = false,
}: USJurisdictionSelectorProps) {
  const { validateAddress } = useUSTax();
  const [address, setAddress] = useState<Partial<TaxAddress>>(
    value || {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    }
  );

  useEffect(() => {
    if (value) {
      setAddress(value);
    }
  }, [value]);

  const handleFieldChange = (field: keyof TaxAddress, fieldValue: string) => {
    const updated = { ...address, [field]: fieldValue };
    setAddress(updated);

    // Notify parent if all required fields are filled
    if (
      updated.line1 &&
      updated.city &&
      updated.state &&
      updated.postalCode &&
      updated.country
    ) {
      onChange(updated as TaxAddress);
    }
  };

  const handleValidate = async () => {
    if (!address.state || !address.postalCode) return;

    try {
      const result = await validateAddress.mutateAsync(address);
      if (result.validatedAddress) {
        setAddress(result.validatedAddress);
        onChange(result.validatedAddress);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>US Tax Jurisdiction</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* State Selector */}
        <div className="space-y-2">
          <Label htmlFor="state">
            State <span className="text-destructive">*</span>
          </Label>
          <Select
            value={address.state || ''}
            onValueChange={(val) => handleFieldChange('state', val)}
            disabled={disabled}
          >
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {US_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ZIP Code */}
        <div className="space-y-2">
          <Label htmlFor="postalCode">
            ZIP Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="postalCode"
            value={address.postalCode || ''}
            onChange={(e) => handleFieldChange('postalCode', e.target.value)}
            placeholder="12345"
            maxLength={10}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="line1">
          Street Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="line1"
          value={address.line1 || ''}
          onChange={(e) => handleFieldChange('line1', e.target.value)}
          placeholder="123 Main St"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="line2">Address Line 2</Label>
        <Input
          id="line2"
          value={address.line2 || ''}
          onChange={(e) => handleFieldChange('line2', e.target.value)}
          placeholder="Suite 100"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">
          City <span className="text-destructive">*</span>
        </Label>
        <Input
          id="city"
          value={address.city || ''}
          onChange={(e) => handleFieldChange('city', e.target.value)}
          placeholder="New York"
          disabled={disabled}
        />
      </div>

      {showValidation && (
        <button
          type="button"
          onClick={handleValidate}
          disabled={
            !address.state ||
            !address.postalCode ||
            disabled ||
            validateAddress.isPending
          }
          className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-4 w-4" />
          {validateAddress.isPending ? 'Validating...' : 'Validate Address'}
        </button>
      )}
    </div>
  );
}

export function USJurisdictionSelectorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
