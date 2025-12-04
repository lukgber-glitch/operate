import { Calculator, ShieldCheck, Globe } from 'lucide-react'
import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    icon: '📊',
    description: 'Popular cloud accounting software for German SMEs',
    countries: ['DE', 'AT', 'CH'],
    recommended: true,
  },
  {
    id: 'sevdesk',
    name: 'sevDesk',
    icon: '💼',
    description: 'Comprehensive accounting and invoicing solution',
    countries: ['DE', 'AT', 'CH'],
  },
  {
    id: 'datev',
    name: 'DATEV',
    icon: '🏢',
    description: 'Professional accounting software for tax advisors',
    countries: ['DE'],
  },
  {
    id: 'sage',
    name: 'Sage',
    icon: '🌿',
    description: 'Global accounting and business management',
    countries: ['DE', 'AT', 'FR', 'ES', 'IT'],
  },
  {
    id: 'xero',
    name: 'Xero',
    icon: '⚡',
    description: 'Cloud-based accounting platform',
    countries: ['DE', 'AT', 'CH', 'FR', 'NL', 'BE'],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    icon: '📗',
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
      <Card>
        <CardHeader>
          <CardTitle>Connect Accounting Software</CardTitle>
          <CardDescription>
            Sync with your existing accounting software to streamline your financial workflows.
            This step is optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {connectedAccounting ? (
            <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Accounting Software Connected</p>
                  <p className="text-sm text-muted-foreground">
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
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Secure data sync</p>
                  <p className="text-sm text-muted-foreground">
                    We use official APIs and OAuth for secure connections. Your data is encrypted
                    in transit and at rest.
                  </p>
                </div>
              </div>

              {/* Provider Options */}
              {filteredProviders.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Choose your accounting software</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredProviders.map((provider) => (
                      <Card
                        key={provider.id}
                        className="hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => handleConnectAccounting(provider.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{provider.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium">{provider.name}</h5>
                                {provider.recommended && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {provider.description}
                              </p>
                              <Button variant="outline" size="sm" className="w-full">
                                Connect
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Globe className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No accounting providers available for your selected country yet.
                  </p>
                </div>
              )}

              {/* Benefits */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium">Benefits of integration</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Automatic synchronization of invoices and expenses
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Unified view of your financial data
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Reduced manual data entry and errors
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Streamlined month-end closing process
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative Option */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Don&apos;t use accounting software?</p>
                <p className="text-sm text-muted-foreground">
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
        </CardContent>
      </Card>
    </div>
  )
}
