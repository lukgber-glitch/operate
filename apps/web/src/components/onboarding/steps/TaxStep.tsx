'use client';

import { FileText, ShieldCheck, Globe } from 'lucide-react'
import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface TaxProvider {
  id: string
  name: string
  icon: string
  description: string
  countries: string[]
  recommended?: boolean
}

const TAX_PROVIDERS: TaxProvider[] = [
  {
    id: 'elster',
    name: 'ELSTER',
    icon: 'Globe',
    description: 'Official German tax filing system',
    countries: ['DE'],
    recommended: true,
  },
  {
    id: 'finanzonline',
    name: 'FinanzOnline',
    icon: 'Globe',
    description: 'Austrian tax authority portal',
    countries: ['AT'],
    recommended: true,
  },
  {
    id: 'estv',
    name: 'ESTV',
    icon: 'Globe',
    description: 'Swiss Federal Tax Administration',
    countries: ['CH'],
  },
  {
    id: 'impots-gouv',
    name: 'impots.gouv.fr',
    icon: 'Globe',
    description: 'French tax authority portal',
    countries: ['FR'],
  },
]

export function TaxStep() {
  const { setValue, watch } = useFormContext()
  const selectedProvider = watch('tax.provider')
  const connectedTax = watch('tax.connected')
  const companyCountry = watch('companyInfo.country')

  const handleConnectTax = (providerId: string) => {
    setValue('tax.provider', providerId)
    // In a real implementation, this would initiate connection flow
    console.log(`Initiating connection for tax provider: ${providerId}`)
    // Simulate connection for demo purposes
    setValue('tax.connected', true)
  }

  const handleSkip = () => {
    setValue('tax.skipped', true)
  }

  const filteredProviders = TAX_PROVIDERS.filter(
    (provider) => !companyCountry || provider.countries.includes(companyCountry)
  )

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 mb-8 mt-4">
        <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
          Tax{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Software
          </span>
        </h1>
        <p className="text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
          Connect to your country&apos;s tax authority portal to streamline tax filing and VAT returns. This step is optional.
        </p>
      </div>
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
        <div className="space-y-6">
          {connectedTax ? (
            <div className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="font-medium text-white">Tax Software Connected</p>
                  <p className="text-sm text-white/60">
                    {TAX_PROVIDERS.find((p) => p.id === selectedProvider)?.name}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue('tax.connected', false)
                  setValue('tax.provider', null)
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
                  <p className="text-sm font-medium text-white">Secure and compliant</p>
                  <p className="text-sm text-white/60">
                    Your tax credentials are encrypted and stored securely. We comply with all
                    data protection regulations.
                  </p>
                </div>
              </div>

              {/* Provider Options */}
              {filteredProviders.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Choose your tax software</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {filteredProviders.map((provider) => (
                      <Card
                        key={provider.id}
                        className="hover:border-white/30 transition-colors cursor-pointer"
                        onClick={() => handleConnectTax(provider.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                <Globe className="w-5 h-5 text-white/70" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-white">{provider.name}</h5>
                                  {provider.recommended && (
                                    <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">
                                      Recommended
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-white/60 mt-1">
                                  {provider.description}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Connect
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Globe className="w-12 h-12 text-white/70 mb-3" />
                  <p className="text-sm text-white/60">
                    No tax providers available for your selected country yet.
                  </p>
                </div>
              )}

              {/* Benefits */}
              <div className="space-y-3 pt-6 border-t">
                <h4 className="text-sm font-medium text-white">Benefits of connecting tax software</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/60">
                      Automated VAT return preparation
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/60">
                      Direct submission to tax authorities
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/60">
                      Real-time tax liability calculations
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/60">
                      Compliance monitoring and alerts
                    </p>
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
        </CardContent>
      </Card>
    </div>
  )
}
