import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

const INDUSTRIES = [
  { value: 'technology', label: 'Technology & Software' },
  { value: 'consulting', label: 'Consulting & Professional Services' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'healthcare', label: 'Healthcare & Medical' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'construction', label: 'Construction' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'education', label: 'Education & Training' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'logistics', label: 'Logistics & Transportation' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'creative', label: 'Creative & Design' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'other', label: 'Other' },
]

const CURRENCIES = [
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
  { code: 'CHF', name: 'Swiss Franc (CHF)', symbol: 'CHF' },
]

const FISCAL_YEAR_MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
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
  const selectedIndustry = watch('companyInfo.industry')
  const selectedCurrency = watch('companyInfo.currency')
  const selectedFiscalYearStart = watch('companyInfo.fiscalYearStart')
  const vatRegistered = watch('companyInfo.vatRegistered')

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Company Information</h2>
        <p className="text-muted-foreground">Tell us about your business. This information will be used to set up your account and configure country-specific tax settings.</p>
      </div>
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
        <div className="space-y-6">
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

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">
              Industry <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedIndustry}
              onValueChange={(value) => setValue('companyInfo.industry', value)}
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companyInfo && typeof errors.companyInfo === 'object' && 'industry' in errors.companyInfo && errors.companyInfo.industry && (
              <p className="text-sm text-destructive">
                {(errors.companyInfo.industry as { message?: string }).message}
              </p>
            )}
          </div>

          {/* Address Section */}
          <div className="space-y-4 pt-6 border-t">
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

          {/* Business Contact Section */}
          <div className="space-y-4 pt-6 border-t">
            <h4 className="text-sm font-medium">Business Contact</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Email */}
              <div className="space-y-2">
                <Label htmlFor="businessEmail">
                  Business Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="e.g., info@company.com"
                  {...register('companyInfo.businessEmail', {
                    required: 'Business email is required',
                  })}
                />
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'businessEmail' in errors.companyInfo && errors.companyInfo.businessEmail && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.businessEmail as { message?: string }).message}
                  </p>
                )}
              </div>

              {/* Business Phone */}
              <div className="space-y-2">
                <Label htmlFor="businessPhone">
                  Business Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="e.g., +49 30 123456"
                  {...register('companyInfo.businessPhone', {
                    required: 'Business phone is required',
                  })}
                />
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'businessPhone' in errors.companyInfo && errors.companyInfo.businessPhone && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.businessPhone as { message?: string }).message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Settings Section */}
          <div className="space-y-4 pt-6 border-t">
            <h4 className="text-sm font-medium">Financial Settings</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setValue('companyInfo.currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'currency' in errors.companyInfo && errors.companyInfo.currency && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.currency as { message?: string }).message}
                  </p>
                )}
              </div>

              {/* Fiscal Year Start */}
              <div className="space-y-2">
                <Label htmlFor="fiscalYearStart">
                  Fiscal Year Starts <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedFiscalYearStart}
                  onValueChange={(value) => setValue('companyInfo.fiscalYearStart', value)}
                >
                  <SelectTrigger id="fiscalYearStart">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_YEAR_MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Most companies start their fiscal year in January
                </p>
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'fiscalYearStart' in errors.companyInfo && errors.companyInfo.fiscalYearStart && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.fiscalYearStart as { message?: string }).message}
                  </p>
                )}
              </div>
            </div>

            {/* VAT Registered Checkbox */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="vatRegistered"
                checked={vatRegistered}
                onCheckedChange={(checked) => setValue('companyInfo.vatRegistered', checked === true)}
              />
              <Label htmlFor="vatRegistered" className="text-sm font-normal cursor-pointer">
                My company is VAT registered
              </Label>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
