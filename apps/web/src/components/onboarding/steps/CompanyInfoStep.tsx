import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const COUNTRIES = [
  { code: 'DE', name: 'Germany' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
]

const LEGAL_FORMS = [
  { value: 'gmbh', label: 'GmbH' },
  { value: 'ag', label: 'AG' },
  { value: 'ug', label: 'UG (haftungsbeschränkt)' },
  { value: 'einzelunternehmen', label: 'Einzelunternehmen' },
  { value: 'gbr', label: 'GbR' },
  { value: 'og', label: 'OG (Austria)' },
  { value: 'kg', label: 'KG' },
  { value: 'sa', label: 'SA (Switzerland)' },
  { value: 'sarl', label: 'SARL' },
  { value: 'other', label: 'Other' },
]

export function CompanyInfoStep() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext()

  const selectedCountry = watch('companyInfo.country')
  const selectedLegalForm = watch('companyInfo.legalForm')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Tell us about your business. This information will be used to set up your account and
            configure country-specific tax settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="e.g., Acme GmbH"
              {...register('companyInfo.name', {
                required: 'Company name is required',
              })}
            />
            {errors.companyInfo && typeof errors.companyInfo === 'object' && 'name' in errors.companyInfo && errors.companyInfo.name && (
              <p className="text-sm text-destructive">
                {(errors.companyInfo.name as { message?: string }).message}
              </p>
            )}
          </div>

          {/* Country and Legal Form Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={(value) => setValue('companyInfo.country', value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyInfo && typeof errors.companyInfo === 'object' && 'country' in errors.companyInfo && errors.companyInfo.country && (
                <p className="text-sm text-destructive">
                  {(errors.companyInfo.country as { message?: string }).message}
                </p>
              )}
            </div>

            {/* Legal Form */}
            <div className="space-y-2">
              <Label htmlFor="legalForm">
                Legal Form <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedLegalForm}
                onValueChange={(value) => setValue('companyInfo.legalForm', value)}
              >
                <SelectTrigger id="legalForm">
                  <SelectValue placeholder="Select legal form" />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_FORMS.map((form) => (
                    <SelectItem key={form.value} value={form.value}>
                      {form.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyInfo && typeof errors.companyInfo === 'object' && 'legalForm' in errors.companyInfo && errors.companyInfo.legalForm && (
                <p className="text-sm text-destructive">
                  {(errors.companyInfo.legalForm as { message?: string }).message}
                </p>
              )}
            </div>
          </div>

          {/* Tax ID */}
          <div className="space-y-2">
            <Label htmlFor="taxId">
              Tax ID / VAT Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="taxId"
              placeholder="e.g., DE123456789"
              {...register('companyInfo.taxId', {
                required: 'Tax ID is required',
              })}
            />
            <p className="text-xs text-muted-foreground">
              Enter your company&apos;s tax identification number or VAT registration number
            </p>
            {errors.companyInfo && typeof errors.companyInfo === 'object' && 'taxId' in errors.companyInfo && errors.companyInfo.taxId && (
              <p className="text-sm text-destructive">
                {(errors.companyInfo.taxId as { message?: string }).message}
              </p>
            )}
          </div>

          {/* Address Section */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Business Address</h4>

            {/* Street and Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">
                  Street <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="street"
                  placeholder="e.g., Hauptstraße"
                  {...register('companyInfo.address.street', {
                    required: 'Street is required',
                  })}
                />
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'address' in errors.companyInfo && errors.companyInfo.address && typeof errors.companyInfo.address === 'object' && 'street' in errors.companyInfo.address && errors.companyInfo.address.street && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.address.street as { message?: string }).message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetNumber">
                  Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="streetNumber"
                  placeholder="e.g., 123"
                  {...register('companyInfo.address.streetNumber', {
                    required: 'Street number is required',
                  })}
                />
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'address' in errors.companyInfo && errors.companyInfo.address && typeof errors.companyInfo.address === 'object' && 'streetNumber' in errors.companyInfo.address && errors.companyInfo.address.streetNumber && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.address.streetNumber as { message?: string }).message}
                  </p>
                )}
              </div>
            </div>

            {/* Postal Code and City */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  Postal Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="postalCode"
                  placeholder="e.g., 10115"
                  {...register('companyInfo.address.postalCode', {
                    required: 'Postal code is required',
                  })}
                />
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'address' in errors.companyInfo && errors.companyInfo.address && typeof errors.companyInfo.address === 'object' && 'postalCode' in errors.companyInfo.address && errors.companyInfo.address.postalCode && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.address.postalCode as { message?: string }).message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="e.g., Berlin"
                  {...register('companyInfo.address.city', {
                    required: 'City is required',
                  })}
                />
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'address' in errors.companyInfo && errors.companyInfo.address && typeof errors.companyInfo.address === 'object' && 'city' in errors.companyInfo.address && errors.companyInfo.address.city && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.address.city as { message?: string }).message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
