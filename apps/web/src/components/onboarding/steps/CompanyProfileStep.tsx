'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { Upload, X, Info } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

/**
 * Country configurations with currency, VAT settings, and locale defaults
 */
const COUNTRIES = [
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    vatLabel: 'VAT Number (USt-IdNr)',
    vatPlaceholder: 'DE123456789',
    vatPattern: /^DE\d{9}$/,
    requiresState: false,
  },
  {
    code: 'AT',
    name: 'Austria',
    currency: 'EUR',
    vatLabel: 'VAT Number (UID)',
    vatPlaceholder: 'ATU12345678',
    vatPattern: /^ATU\d{8}$/,
    requiresState: false,
  },
  {
    code: 'CH',
    name: 'Switzerland',
    currency: 'CHF',
    vatLabel: 'VAT Number (MWST/TVA/IVA)',
    vatPlaceholder: 'CHE123456789',
    vatPattern: /^CHE\d{9}$/,
    requiresState: false,
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    vatLabel: 'VAT Number (N° TVA)',
    vatPlaceholder: 'FRXX123456789',
    vatPattern: /^FR[A-Z0-9]{2}\d{9}$/,
    requiresState: false,
  },
  {
    code: 'IT',
    name: 'Italy',
    currency: 'EUR',
    vatLabel: 'VAT Number (Partita IVA)',
    vatPlaceholder: 'IT12345678901',
    vatPattern: /^IT\d{11}$/,
    requiresState: false,
  },
  {
    code: 'ES',
    name: 'Spain',
    currency: 'EUR',
    vatLabel: 'VAT Number (CIF/NIF)',
    vatPlaceholder: 'ESX12345678',
    vatPattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
    requiresState: false,
  },
  {
    code: 'NL',
    name: 'Netherlands',
    currency: 'EUR',
    vatLabel: 'VAT Number (BTW)',
    vatPlaceholder: 'NL123456789B01',
    vatPattern: /^NL\d{9}B\d{2}$/,
    requiresState: false,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    vatLabel: 'VAT Registration Number',
    vatPlaceholder: 'GB123456789',
    vatPattern: /^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
    requiresState: false,
  },
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    vatLabel: 'EIN (Employer Identification Number)',
    vatPlaceholder: '12-3456789',
    vatPattern: /^\d{2}-?\d{7}$/,
    requiresState: true,
  },
]

/**
 * Legal forms available across different countries
 */
const LEGAL_FORMS = [
  { value: 'gmbh', label: 'GmbH (Germany)', country: 'DE' },
  { value: 'ug', label: 'UG (haftungsbeschränkt) (Germany)', country: 'DE' },
  { value: 'ag', label: 'AG (Germany/Switzerland)', country: ['DE', 'CH'] },
  { value: 'einzelunternehmen', label: 'Einzelunternehmen (Germany)', country: 'DE' },
  { value: 'gbr', label: 'GbR (Germany)', country: 'DE' },
  { value: 'kg', label: 'KG (Germany/Austria)', country: ['DE', 'AT'] },
  { value: 'ohg', label: 'OHG (Germany)', country: 'DE' },
  { value: 'og', label: 'OG (Austria)', country: 'AT' },
  { value: 'kg_at', label: 'KG (Austria)', country: 'AT' },
  { value: 'sarl', label: 'SARL (France/Switzerland)', country: ['FR', 'CH'] },
  { value: 'sa', label: 'SA (France/Switzerland)', country: ['FR', 'CH'] },
  { value: 'sas', label: 'SAS (France)', country: 'FR' },
  { value: 'eirl', label: 'EIRL (France)', country: 'FR' },
  { value: 'srl', label: 'SRL (Italy)', country: 'IT' },
  { value: 'spa', label: 'SpA (Italy)', country: 'IT' },
  { value: 'sl', label: 'SL (Spain)', country: 'ES' },
  { value: 'sa_es', label: 'SA (Spain)', country: 'ES' },
  { value: 'bv', label: 'BV (Netherlands)', country: 'NL' },
  { value: 'nv', label: 'NV (Netherlands)', country: 'NL' },
  { value: 'ltd', label: 'Ltd (UK)', country: 'GB' },
  { value: 'plc', label: 'PLC (UK)', country: 'GB' },
  { value: 'llp', label: 'LLP (UK)', country: 'GB' },
  { value: 'llc', label: 'LLC (US)', country: 'US' },
  { value: 'corporation', label: 'Corporation (US)', country: 'US' },
  { value: 's_corp', label: 'S Corporation (US)', country: 'US' },
  { value: 'c_corp', label: 'C Corporation (US)', country: 'US' },
  { value: 'partnership', label: 'Partnership (US)', country: 'US' },
  { value: 'sole_proprietor', label: 'Sole Proprietor', country: null },
  { value: 'freelancer', label: 'Freelancer/Self-Employed', country: null },
  { value: 'other', label: 'Other', country: null },
]

/**
 * Common industry sectors
 */
const INDUSTRIES = [
  { value: 'consulting', label: 'Consulting & Professional Services' },
  { value: 'it_software', label: 'IT & Software Development' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'ecommerce', label: 'E-commerce & Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'construction', label: 'Construction & Real Estate' },
  { value: 'healthcare', label: 'Healthcare & Medical' },
  { value: 'education', label: 'Education & Training' },
  { value: 'hospitality', label: 'Hospitality & Food Services' },
  { value: 'finance', label: 'Finance & Insurance' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'transportation', label: 'Transportation & Logistics' },
  { value: 'creative', label: 'Creative & Design' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'nonprofit', label: 'Non-Profit Organization' },
  { value: 'other', label: 'Other' },
]

/**
 * Fiscal year start months
 */
const FISCAL_MONTHS = [
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

/**
 * US States
 */
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

export function CompanyProfileStep() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useFormContext()

  const { toast } = useToast()

  const selectedCountry = watch('companyInfo.country')
  const selectedLegalForm = watch('companyInfo.legalForm')
  const selectedIndustry = watch('companyInfo.industry')
  const fiscalYearStart = watch('companyInfo.fiscalYearStart')
  const currency = watch('companyInfo.currency')
  const vatRegistered = watch('companyInfo.vatRegistered')

  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Get country configuration
  const countryConfig = COUNTRIES.find((c) => c.code === selectedCountry)

  // Filter legal forms based on selected country
  const availableLegalForms = React.useMemo(() => {
    if (!selectedCountry) return LEGAL_FORMS

    return LEGAL_FORMS.filter((form) => {
      if (form.country === null) return true
      if (Array.isArray(form.country)) {
        return form.country.includes(selectedCountry)
      }
      return form.country === selectedCountry
    })
  }, [selectedCountry])

  // Auto-populate currency when country changes
  React.useEffect(() => {
    if (countryConfig && !currency) {
      setValue('companyInfo.currency', countryConfig.currency)
    }
  }, [countryConfig, currency, setValue])

  // Handle logo file selection
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG, or SVG file',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 2MB',
        variant: 'destructive',
      })
      return
    }

    setLogoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
      setValue('companyInfo.logoUrl', reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setValue('companyInfo.logoUrl', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Manually trigger file processing
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileInputRef.current.files = dataTransfer.files
        handleLogoChange({
          target: fileInputRef.current,
        } as React.ChangeEvent<HTMLInputElement>)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Company Information</h2>
        <p className="text-muted-foreground">Tell us about your business. This information will be used to set up your account and configure country-specific tax settings.</p>
      </div>
      <Card className="rounded-[24px] bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
        <div className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-white">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="e.g., Acme GmbH"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              {...register('companyInfo.name', {
                required: 'Company name is required',
                minLength: { value: 2, message: 'Company name must be at least 2 characters' },
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
              <Label htmlFor="country" className="text-white">
                Country <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={(value) => {
                  setValue('companyInfo.country', value)
                  // Clear legal form if it's not valid for new country
                  if (selectedLegalForm) {
                    const isValidForNewCountry = LEGAL_FORMS.find(
                      (f) => f.value === selectedLegalForm &&
                      (f.country === null ||
                       f.country === value ||
                       (Array.isArray(f.country) && f.country.includes(value)))
                    )
                    if (!isValidForNewCountry) {
                      setValue('companyInfo.legalForm', '')
                    }
                  }
                  trigger('companyInfo.country')
                }}
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
              <Label htmlFor="legalForm" className="text-white">
                Legal Form <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedLegalForm}
                onValueChange={(value) => {
                  setValue('companyInfo.legalForm', value)
                  trigger('companyInfo.legalForm')
                }}
                disabled={!selectedCountry}
              >
                <SelectTrigger id="legalForm">
                  <SelectValue placeholder={selectedCountry ? "Select legal form" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableLegalForms.map((form) => (
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

          {/* Industry/Sector */}
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-white">
              Industry/Sector <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedIndustry}
              onValueChange={(value) => {
                setValue('companyInfo.industry', value)
                trigger('companyInfo.industry')
              }}
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
            <p className="text-xs text-muted-foreground">
              This helps us provide industry-specific features and recommendations
            </p>
            {errors.companyInfo && typeof errors.companyInfo === 'object' && 'industry' in errors.companyInfo && errors.companyInfo.industry && (
              <p className="text-sm text-destructive">
                {(errors.companyInfo.industry as { message?: string }).message}
              </p>
            )}
          </div>

          {/* Tax ID / VAT Number */}
          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-white">
              {countryConfig?.vatLabel || 'Tax ID / VAT Number'} <span className="text-destructive">*</span>
            </Label>
            <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              id="taxId"
              placeholder={countryConfig?.vatPlaceholder || 'e.g., DE123456789'}
              {...register('companyInfo.taxId', {
                required: 'Tax ID is required',
                pattern: countryConfig?.vatPattern ? {
                  value: countryConfig.vatPattern,
                  message: `Invalid format for ${countryConfig.name}. Expected format: ${countryConfig.vatPlaceholder}`,
                } : undefined,
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

          {/* Trade Register Number (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="tradeRegister" className="text-white">Trade Register Number (Optional)</Label>
            <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              id="tradeRegister"
              placeholder="e.g., HRB 12345"
              {...register('companyInfo.tradeRegisterNumber')}
            />
            <p className="text-xs text-muted-foreground">
              Commercial register number (if applicable)
            </p>
          </div>

          {/* Address Section */}
          <div className="space-y-4 pt-6 border-t">
            <h4 className="text-sm font-medium">Business Address</h4>

            {/* Street and Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street" className="text-white">
                  Street <span className="text-destructive">*</span>
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
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
                <Label htmlFor="streetNumber" className="text-white">
                  Number <span className="text-destructive">*</span>
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
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
                <Label htmlFor="postalCode" className="text-white">
                  Postal Code <span className="text-destructive">*</span>
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="postalCode"
                  placeholder={selectedCountry === 'US' ? 'e.g., 10001' : 'e.g., 10115'}
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
                <Label htmlFor="city" className="text-white">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
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

            {/* State/Region (conditional for US) */}
            {countryConfig?.requiresState && (
              <div className="space-y-2">
                <Label htmlFor="state" className="text-white">
                  State <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('companyInfo.address.state')}
                  onValueChange={(value) => {
                    setValue('companyInfo.address.state', value)
                    trigger('companyInfo.address.state')
                  }}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'address' in errors.companyInfo && errors.companyInfo.address && typeof errors.companyInfo.address === 'object' && 'state' in errors.companyInfo.address && errors.companyInfo.address.state && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.address.state as { message?: string }).message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4 pt-6 border-t">
            <h4 className="text-sm font-medium">Contact Information</h4>

            {/* Business Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessEmail" className="text-white">
                  Business Email <span className="text-destructive">*</span>
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="businessEmail"
                  type="email"
                  placeholder="contact@company.com"
                  {...register('companyInfo.businessEmail', {
                    required: 'Business email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email format',
                    },
                  })}
                />
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'businessEmail' in errors.companyInfo && errors.companyInfo.businessEmail && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.businessEmail as { message?: string }).message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone" className="text-white">
                  Business Phone <span className="text-destructive">*</span>
                </Label>
                <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  id="businessPhone"
                  type="tel"
                  placeholder="+49 30 12345678"
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

            {/* Website (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-white">Website (Optional)</Label>
              <Input className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                id="website"
                type="url"
                placeholder="https://www.company.com"
                {...register('companyInfo.website', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Invalid URL format (must start with http:// or https://)',
                  },
                })}
              />
              {errors.companyInfo && typeof errors.companyInfo === 'object' && 'website' in errors.companyInfo && errors.companyInfo.website && (
                <p className="text-sm text-destructive">
                  {(errors.companyInfo.website as { message?: string }).message}
                </p>
              )}
            </div>
          </div>

          {/* Fiscal Settings Section */}
          <div className="space-y-4 pt-6 border-t">
            <h4 className="text-sm font-medium">Fiscal Settings</h4>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These settings determine your accounting periods and tax reporting requirements.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fiscal Year Start */}
              <div className="space-y-2">
                <Label htmlFor="fiscalYearStart" className="text-white">
                  Fiscal Year Start Month <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={fiscalYearStart}
                  onValueChange={(value) => {
                    setValue('companyInfo.fiscalYearStart', value)
                    trigger('companyInfo.fiscalYearStart')
                  }}
                >
                  <SelectTrigger id="fiscalYearStart">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Most companies use January (calendar year)
                </p>
                {errors.companyInfo && typeof errors.companyInfo === 'object' && 'fiscalYearStart' in errors.companyInfo && errors.companyInfo.fiscalYearStart && (
                  <p className="text-sm text-destructive">
                    {(errors.companyInfo.fiscalYearStart as { message?: string }).message}
                  </p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-white">
                  Default Currency <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="currency"
                  value={currency || ''}
                  readOnly
                  className="bg-muted"
                  placeholder="Select country first"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled based on country selection
                </p>
              </div>
            </div>

            {/* VAT Registration Status */}
            <div className="space-y-2">
              <Label htmlFor="vatRegistered" className="text-white">VAT Registration Status</Label>
              <Select
                value={vatRegistered?.toString() || 'false'}
                onValueChange={(value) => {
                  setValue('companyInfo.vatRegistered', value === 'true')
                  trigger('companyInfo.vatRegistered')
                }}
              >
                <SelectTrigger id="vatRegistered">
                  <SelectValue placeholder="Select VAT status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes, VAT registered</SelectItem>
                  <SelectItem value="false">No, not VAT registered</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Indicates whether your company is registered for VAT/sales tax
              </p>
            </div>
          </div>

          {/* Company Logo Upload Section */}
          <div className="space-y-4 pt-6 border-t">
            <h4 className="text-sm font-medium">Company Logo (Optional)</h4>

            <div className="space-y-4">
              {!logoPreview ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Drag and drop your logo here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, or SVG (max 2MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded flex items-center justify-center border">
                      <img
                        src={logoPreview}
                        alt="Company logo preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {logoFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Your logo will appear on invoices, quotes, and other documents
            </p>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
