'use client';

import { FileText, ShieldCheck, Globe, Upload, Key, CheckCircle2, XCircle } from 'lucide-react'
import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { AnimatedCard } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { HeadlineOutside } from '@/components/ui/headline-outside'
import { TaxIntegrationCard } from './TaxIntegrationCard'

export type TaxAuthType = 'oauth' | 'certificate' | 'apiKey' | 'credentials'

export interface TaxIntegration {
  id: string
  name: string
  description: string
  countries: string[]
  icon: string
  authType: TaxAuthType
  connectUrl?: string
  features: string[]
  recommended?: boolean
  requiresCertificate?: boolean
  requiresApiKey?: boolean
  documentationUrl?: string
}

// Comprehensive list of available tax integrations
const TAX_INTEGRATIONS: TaxIntegration[] = [
  // Germany - ELSTER
  {
    id: 'elster',
    name: 'ELSTER',
    description: 'Official German tax filing system for VAT returns and advance notifications',
    countries: ['DE'],
    icon: '🇩🇪',
    authType: 'certificate',
    features: ['UStVA (VAT return)', 'ZM (Advance notification)', 'GoBD compliance'],
    recommended: true,
    requiresCertificate: true,
    documentationUrl: 'https://www.elster.de',
  },
  // Austria - FinanzOnline
  {
    id: 'finanzonline',
    name: 'FinanzOnline',
    description: 'Austrian Federal Ministry of Finance portal for VAT and tax filing',
    countries: ['AT'],
    icon: '🇦🇹',
    authType: 'credentials',
    features: ['UVA (VAT return)', 'ZM (Advance notification)', 'U30 submissions'],
    recommended: true,
    documentationUrl: 'https://finanzonline.bmf.gv.at',
  },
  // UK - HMRC MTD
  {
    id: 'hmrc-mtd',
    name: 'HMRC MTD',
    description: 'Making Tax Digital for VAT - UK tax authority integration',
    countries: ['GB', 'UK'],
    icon: '🇬🇧',
    authType: 'oauth',
    connectUrl: '/api/integrations/hmrc/auth',
    features: ['VAT returns', 'Obligations tracking', 'Fraud prevention headers'],
    recommended: true,
    documentationUrl: 'https://developer.service.hmrc.gov.uk',
  },
  // Spain - SII
  {
    id: 'spain-sii',
    name: 'AEAT SII',
    description: 'Real-time VAT reporting system for Spanish Tax Agency',
    countries: ['ES'],
    icon: '🇪🇸',
    authType: 'certificate',
    features: ['Real-time invoice submission', 'Book types A1-A3, B1-B4', '4-day submission window'],
    recommended: true,
    requiresCertificate: true,
    documentationUrl: 'https://www.agenciatributaria.es/AEAT.internet/SII.html',
  },
  // France - Chorus Pro
  {
    id: 'chorus-pro',
    name: 'Chorus Pro',
    description: 'French government e-invoicing platform for public sector',
    countries: ['FR'],
    icon: '🇫🇷',
    authType: 'credentials',
    features: ['Public sector invoicing', 'Factur-X support', 'SIRET validation'],
    documentationUrl: 'https://chorus-pro.gouv.fr',
  },
  // Italy - SDI
  {
    id: 'sdi',
    name: 'Sistema di Interscambio',
    description: 'Italian tax authority invoice exchange system',
    countries: ['IT'],
    icon: '🇮🇹',
    authType: 'certificate',
    features: ['FatturaPA format', 'Real-time validation', 'Digital signature'],
    requiresCertificate: true,
    documentationUrl: 'https://www.fatturapa.gov.it',
  },
  // Switzerland - ESTV
  {
    id: 'estv',
    name: 'ESTV ePortal',
    description: 'Swiss Federal Tax Administration VAT portal',
    countries: ['CH'],
    icon: '🇨🇭',
    authType: 'credentials',
    features: ['VAT return filing', 'Quarterly submissions', 'Multi-language support'],
    documentationUrl: 'https://www.estv.admin.ch',
  },
  // Netherlands - Belastingdienst
  {
    id: 'belastingdienst',
    name: 'Belastingdienst',
    description: 'Dutch Tax Authority portal for VAT and corporate tax',
    countries: ['NL'],
    icon: '🇳🇱',
    authType: 'credentials',
    features: ['VAT returns', 'ICP declarations', 'XBRL filing'],
    documentationUrl: 'https://www.belastingdienst.nl',
  },
  // Belgium - InterVAT
  {
    id: 'intervat',
    name: 'InterVAT',
    description: 'Belgian VAT return submission system',
    countries: ['BE'],
    icon: '🇧🇪',
    authType: 'certificate',
    features: ['VAT returns', 'Listing submissions', 'PLDA integration'],
    requiresCertificate: true,
    documentationUrl: 'https://financien.belgium.be',
  },
  // EU-wide - Peppol
  {
    id: 'peppol',
    name: 'Peppol Network',
    description: 'Pan-European e-invoicing and procurement network',
    countries: ['DE', 'AT', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI'],
    icon: '🇪🇺',
    authType: 'apiKey',
    features: ['E-invoicing', 'Cross-border transactions', 'UBL format'],
    requiresApiKey: true,
    documentationUrl: 'https://peppol.eu',
  },
  // Australia - ATO
  {
    id: 'ato',
    name: 'ATO (Australian Tax Office)',
    description: 'Australian tax authority BAS and STP reporting',
    countries: ['AU'],
    icon: '🇦🇺',
    authType: 'oauth',
    connectUrl: '/api/integrations/ato/auth',
    features: ['BAS (Business Activity Statement)', 'STP (Single Touch Payroll)', 'TPAR reporting'],
    documentationUrl: 'https://www.ato.gov.au',
  },
  // Canada - CRA
  {
    id: 'cra',
    name: 'CRA My Business Account',
    description: 'Canada Revenue Agency GST/HST filing',
    countries: ['CA'],
    icon: '🇨🇦',
    authType: 'credentials',
    features: ['GST/HST returns', 'Payroll remittances', 'T4 submissions'],
    documentationUrl: 'https://www.canada.ca/en/revenue-agency',
  },
  // India - GST IRP
  {
    id: 'gst-irp',
    name: 'GST IRP',
    description: 'Indian Goods and Services Tax Invoice Registration Portal',
    countries: ['IN'],
    icon: '🇮🇳',
    authType: 'apiKey',
    features: ['E-invoice generation', 'IRN issuance', 'GSTR filing'],
    requiresApiKey: true,
    documentationUrl: 'https://einvoice1.gst.gov.in',
  },
  // Singapore - IRAS
  {
    id: 'iras',
    name: 'IRAS myTax Portal',
    description: 'Singapore Inland Revenue Authority tax filing',
    countries: ['SG'],
    icon: '🇸🇬',
    authType: 'credentials',
    features: ['GST F5 returns', 'Corporate tax filing', 'IRAS e-Filing'],
    documentationUrl: 'https://www.iras.gov.sg',
  },
  // UAE - ZATCA
  {
    id: 'zatca',
    name: 'ZATCA (Fatoora)',
    description: 'Saudi Arabia Zakat, Tax and Customs Authority e-invoicing',
    countries: ['SA', 'AE'],
    icon: '🇸🇦',
    authType: 'certificate',
    features: ['Phase 1 & 2 compliance', 'QR code generation', 'XML invoicing'],
    requiresCertificate: true,
    documentationUrl: 'https://zatca.gov.sa',
  },
]

export function TaxSoftwareStep() {
  const { setValue, watch } = useFormContext()
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [connectionError, setConnectionError] = React.useState<string | null>(null)

  const selectedProvider = watch('tax.provider')
  const connectedTax = watch('tax.connected')
  const companyCountry = watch('companyInfo.country')

  const handleConnectTax = async (integration: TaxIntegration) => {
    setIsConnecting(true)
    setConnectionError(null)

    try {
      console.log(`Initiating connection for tax provider: ${integration.id}`)

      // Handle different authentication types
      if (integration.authType === 'oauth' && integration.connectUrl) {
        // OAuth flow: redirect to provider's auth page
        const response = await fetch(integration.connectUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: integration.id }),
        })

        if (!response.ok) {
          throw new Error('Failed to initiate OAuth flow')
        }

        const { authUrl } = await response.json()
        // In real implementation, redirect to authUrl
        window.location.href = authUrl
      } else if (integration.authType === 'certificate') {
        // Certificate-based: Show certificate upload modal
        console.log('Opening certificate upload modal for', integration.name)
        // In real implementation, open modal for certificate upload
        // For demo, simulate connection
        setValue('tax.provider', integration.id)
        setValue('tax.connected', true)
      } else if (integration.authType === 'apiKey') {
        // API Key: Show API key input modal
        console.log('Opening API key input modal for', integration.name)
        // In real implementation, open modal for API key input
        // For demo, simulate connection
        setValue('tax.provider', integration.id)
        setValue('tax.connected', true)
      } else if (integration.authType === 'credentials') {
        // Credentials: Show username/password form
        console.log('Opening credentials form for', integration.name)
        // In real implementation, open credentials form
        // For demo, simulate connection
        setValue('tax.provider', integration.id)
        setValue('tax.connected', true)
      }
    } catch (error) {
      console.error('Connection error:', error)
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setValue('tax.connected', false)
    setValue('tax.provider', null)
    setConnectionError(null)
  }

  const handleSkip = () => {
    setValue('tax.skipped', true)
  }

  // Filter integrations by company country
  const filteredIntegrations = TAX_INTEGRATIONS.filter(
    (integration) => !companyCountry || integration.countries.includes(companyCountry)
  )

  // Get connected integration details
  const connectedIntegration = selectedProvider
    ? TAX_INTEGRATIONS.find((i) => i.id === selectedProvider)
    : null

  return (
    <div className="space-y-6">
      <HeadlineOutside subtitle="Connect to your tax filing system to automate VAT returns, tax submissions, and compliance reporting. This step is optional but highly recommended for tax automation.">
        Connect Tax Software
      </HeadlineOutside>
      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-6">
          {connectedTax && connectedIntegration ? (
            // Connected State
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Tax Software Connected</p>
                    <p className="text-sm text-muted-foreground">
                      {connectedIntegration.icon} {connectedIntegration.name}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>

              {/* Connected Integration Details */}
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="text-sm font-medium">Connected Features</h4>
                <div className="grid grid-cols-1 gap-2">
                  {connectedIntegration.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                      <p className="text-sm text-muted-foreground">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Not Connected State
            <>
              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Bank-level security</p>
                  <p className="text-sm text-muted-foreground">
                    Your credentials are encrypted end-to-end. Certificates and API keys are stored
                    with AES-256 encryption. We comply with all tax authority security requirements.
                  </p>
                </div>
              </div>

              {/* Connection Error Alert */}
              {connectionError && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Connection failed</p>
                    <p className="text-sm text-muted-foreground">{connectionError}</p>
                  </div>
                </div>
              )}

              {/* Available Integrations */}
              {filteredIntegrations.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">
                    Available tax integrations for {companyCountry || 'your country'}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {filteredIntegrations.map((integration) => (
                      <TaxIntegrationCard
                        key={integration.id}
                        integration={integration}
                        onConnect={() => handleConnectTax(integration)}
                        isConnecting={isConnecting}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // No integrations available
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Globe className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-2">No tax integrations available</p>
                  <p className="text-sm text-muted-foreground">
                    {companyCountry
                      ? `We don't have tax integrations for ${companyCountry} yet.`
                      : 'Please select your company country first.'}
                  </p>
                </div>
              )}

              {/* Why Connect Section */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium">Why connect tax software?</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Automated VAT return preparation and submission
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Real-time tax liability calculations and forecasting
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Compliance monitoring with deadline alerts
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Direct submission to tax authorities (no manual entry)
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Audit trail and GoBD-compliant documentation
                    </p>
                  </div>
                </div>
              </div>

              {/* Auth Type Legend */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium">Connection types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-950 rounded flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">OAuth</p>
                      <p className="text-xs text-muted-foreground">
                        Secure web login with tax authority
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-950 rounded flex items-center justify-center">
                      <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Certificate</p>
                      <p className="text-xs text-muted-foreground">Upload digital certificate</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-950 rounded flex items-center justify-center">
                      <Key className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">API Key</p>
                      <p className="text-xs text-muted-foreground">Enter API credentials</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-orange-100 dark:bg-orange-950 rounded flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Credentials</p>
                      <p className="text-xs text-muted-foreground">Username and password</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skip Option */}
              <div className="flex justify-center pt-4">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              </div>
            </>
          )}
        </div>
      </AnimatedCard>
    </div>
  )
}
