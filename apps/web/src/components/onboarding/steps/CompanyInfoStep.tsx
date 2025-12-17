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
      <div className="text-center space-y-4 mb-8 mt-4">
        <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
          Company{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Information
          </span>
        </h1>
        <p className="text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
          Tell us about your business to set up your account and configure country-specific tax settings.
        </p>
      </div>
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
        <div className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="sr-only">
              Company Name
            </Label>
            <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              id="companyName"
              placeholder="Company Name *"
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
              <Label htmlFor="country" className="sr-only">
                Country
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={(value) => setValue('companyInfo.country', value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Country *" />
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
              <Label htmlFor="legalForm" className="sr-only">
                Legal Form
              </Label>
              <Select
                value={selectedLegalForm}
                onValueChange={(value) => setValue('companyInfo.legalForm', value)}
              >
                <SelectTrigger id="legalForm">
                  <SelectValue placeholder="Legal Form *" />
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
            <Label htmlFor="taxId" className="sr-only">
              Tax ID / VAT Number
            </Label>
            <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              id="taxId"
              placeholder="Tax ID / VAT Number *"
              {...register('companyInfo.taxId', {
                required: 'Tax ID is required',
              })}
            />
            <p className="text-xs text-white/60">
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
            <Label htmlFor="industry" className="sr-only">
              Industry
            </Label>
            <Select
              value={selectedIndustry}
              onValueChange={(value) => setValue('companyInfo.industry', value)}
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder="Industry *" />
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

          {/* Business Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="businessModel" className="sr-only">
              Who are your customers?
            </Label>
            <Select
              value={watch('companyInfo.businessModel') || ''}
              onValueChange={(value) => setValue('companyInfo.businessModel', value)}
            >
              <SelectTrigger id="businessModel">
                <SelectValue placeholder="Who are your customers? *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B2B">
                  Other Businesses (B2B)
                </SelectItem>
                <SelectItem value="B2C">
                  Individual Consumers (B2C)
                </SelectItem>
                <SelectItem value="HYBRID">
                  Both Businesses & Consumers
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-white/60">
              This helps us customize how we process your business emails
            </p>
            {errors.companyInfo && typeof errors.companyInfo === 'object' && 'businessModel' in errors.companyInfo && errors.companyInfo.businessModel && (
              <p className="text-sm text-destructive">
                {(errors.companyInfo.businessModel as { message?: string }).message}
              </p>
            )}
          </div>

          {/* Address Section */}
          <div className="space-y-4 pt-6">
            <h4 className="text-sm font-medium text-white">Business Address</h4>

            {/* Street and Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street" className="sr-only">
                  Street
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="street"
                  placeholder="Street *"
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
                <Label htmlFor="streetNumber" className="sr-only">
                  Number
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="streetNumber"
                  placeholder="No. *"
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
                <Label htmlFor="postalCode" className="sr-only">
                  Postal Code
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="postalCode"
                  placeholder="Postal Code *"
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
                <Label htmlFor="city" className="sr-only">
                  City
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="city"
                  placeholder="City *"
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
          <div className="space-y-4 pt-6">
            <h4 className="text-sm font-medium text-white">Business Contact</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Email */}
              <div className="space-y-2">
                <Label htmlFor="businessEmail" className="sr-only">
                  Business Email
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="businessEmail"
                  type="email"
                  placeholder="Business Email *"
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
                <Label htmlFor="businessPhone" className="sr-only">
                  Business Phone
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="businessPhone"
                  type="tel"
                  placeholder="Business Phone *"
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
          <div className="space-y-4 pt-6">
            <h4 className="text-sm font-medium text-white">Financial Settings</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="sr-only">
                  Currency
                </Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setValue('companyInfo.currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Currency *" />
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
                <Label htmlFor="fiscalYearStart" className="sr-only">
                  Fiscal Year Starts
                </Label>
                <Select
                  value={selectedFiscalYearStart}
                  onValueChange={(value) => setValue('companyInfo.fiscalYearStart', value)}
                >
                  <SelectTrigger id="fiscalYearStart">
                    <SelectValue placeholder="Fiscal Year Starts *" />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_YEAR_MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/60">
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
