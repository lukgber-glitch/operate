'use client';

import { Calculator, ShieldCheck, Globe, FileSpreadsheet, Building2 } from 'lucide-react'
import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AccountingProvider {
  id: string
  name: string
  icon: string
  description: string
  countries: string[]
  recommended?: boolean
}

const ACCOUNTING_PROVIDERS: AccountingProvider[] = [
  {
    id: 'lexoffice',
    name: 'lexoffice',
    icon: 'FileSpreadsheet',
    description: 'Popular cloud accounting software for German SMEs',
    countries: ['DE', 'AT', 'CH'],
    recommended: true,
  },
  {
    id: 'sevdesk',
    name: 'sevDesk',
    icon: 'Calculator',
    description: 'Comprehensive accounting and invoicing solution',
    countries: ['DE', 'AT', 'CH'],
  },
  {
    id: 'datev',
    name: 'DATEV',
    icon: 'Building2',
    description: 'Professional accounting software for tax advisors',
    countries: ['DE'],
  },
  {
    id: 'sage',
    name: 'Sage',
    icon: 'FileSpreadsheet',
    description: 'Global accounting and business management',
    countries: ['DE', 'AT', 'FR', 'ES', 'IT'],
  },
  {
    id: 'xero',
    name: 'Xero',
    icon: 'Calculator',
    description: 'Cloud-based accounting platform',
    countries: ['DE', 'AT', 'CH', 'FR', 'NL', 'BE'],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    icon: 'FileSpreadsheet',
    description: 'Intuit popular accounting software',
    countries: ['DE', 'FR', 'NL', 'BE'],
  },
]

export function AccountingStep() {
  const { setValue, watch } = useFormContext()
  const selectedProvider = watch('accounting.provider')
  const connectedAccounting = watch('accounting.connected')
  const companyCountry = watch('companyInfo.country')

  const handleConnectAccounting = (providerId: string) => {
    setValue('accounting.provider', providerId)
    // In a real implementation, this would initiate OAuth/API connection flow
    console.log(`Initiating connection for accounting provider: ${providerId}`)
    // Simulate connection for demo purposes
    setValue('accounting.connected', true)
  }

  const handleSkip = () => {
    setValue('accounting.skipped', true)
  }

  const filteredProviders = ACCOUNTING_PROVIDERS.filter(
    (provider) => !companyCountry || provider.countries.includes(companyCountry)
  )

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 mb-8 mt-4">
        <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
          Accounting{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Software
          </span>
        </h1>
        <p className="text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
          Sync with your existing accounting software to streamline your financial workflows. This step is optional.
        </p>
      </div>
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
        <div className="space-y-6">
          {connectedAccounting ? (
            <div className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="font-medium text-white">Accounting Software Connected</p>
                  <p className="text-sm text-white/60">
                    {ACCOUNTING_PROVIDERS.find((p) => p.id === selectedProvider)?.name}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue('accounting.connected', false)
                  setValue('accounting.provider', null)
                }}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <>
              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-white/10 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white/70 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Secure data sync</p>
                  <p className="text-sm text-white/60">
                    We use official APIs and OAuth for secure connections. Your data is encrypted
                    in transit and at rest.
                  </p>
                </div>
              </div>

              {/* Provider Options */}
              {filteredProviders.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Choose your accounting software</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredProviders.map((provider) => {
                      const IconComponent = provider.icon === 'FileSpreadsheet' ? FileSpreadsheet : provider.icon === 'Building2' ? Building2 : Calculator;
                      return (
                      <Card
                        key={provider.id}
                        className="hover:border-white/30 transition-colors cursor-pointer"
                        onClick={() => handleConnectAccounting(provider.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-white/70" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-white">{provider.name}</h5>
                                {provider.recommended && (
                                  <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-white/60 mb-3">
                                {provider.description}
                              </p>
                              <Button variant="outline" size="sm" className="w-full">
                                Connect
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )})}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Globe className="w-12 h-12 text-white/70 mb-3" />
                  <p className="text-sm text-white/60">
                    No accounting providers available for your selected country yet.
                  </p>
                </div>
              )}

              {/* Benefits */}
              <div className="space-y-3 pt-6 border-t">
                <h4 className="text-sm font-medium text-white">Benefits of integration</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/60">
                      Automatic synchronization of invoices and expenses
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/60">
                      Unified view of your financial data
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/60">
                      Reduced manual data entry and errors
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/60">
                      Streamlined month-end closing process
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative Option */}
              <div className="p-4 bg-white/10 rounded-lg">
                <p className="text-sm font-medium mb-2 text-white">Don&apos;t use accounting software?</p>
                <p className="text-sm text-white/60">
                  No problem! Operate includes built-in accounting features to manage your
                  bookkeeping, invoicing, and financial reporting.
                </p>
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
        </CardContent>
      </Card>
    </div>
  )
}
