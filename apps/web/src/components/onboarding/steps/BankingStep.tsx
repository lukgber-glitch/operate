'use client';

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { AlertCircle, Building2, CheckCircle2, ChevronRight, Loader2, Search, ShieldCheck, X } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { useBankConnections, useBanks } from '@/hooks/use-bank-connections'
import type { Bank, BankConnection } from '@/lib/api/bank-connections'

/**
 * Bank provider configuration based on country
 */
interface BankProvider {
  id: 'tink' | 'plaid' | 'truelayer'
  name: string
  description: string
  countries: string[]
  bankCount: string
  logo?: string
  recommended?: boolean
}

const BANK_PROVIDERS: BankProvider[] = [
  {
    id: 'tink',
    name: 'Tink Open Banking',
    description: 'Connect to 6000+ banks across Europe with PSD2-compliant security',
    countries: ['DE', 'AT', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'DK', 'NO', 'FI', 'IE', 'CH'],
    bankCount: '6000+',
    recommended: true,
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Secure connections to 12,000+ financial institutions in the US',
    countries: ['US'],
    bankCount: '12,000+',
  },
  {
    id: 'truelayer',
    name: 'TrueLayer',
    description: 'UK Open Banking for seamless bank account integration',
    countries: ['GB'],
    bankCount: '200+',
  },
]

/**
 * Get the appropriate provider based on country
 */
function getProviderForCountry(country: string): BankProvider | null {
  return BANK_PROVIDERS.find(provider => provider.countries.includes(country)) || null
}

/**
 * BankingStep Component
 * Allows users to connect their bank accounts during onboarding
 */
export function BankingStep() {
  const { setValue, watch } = useFormContext()
  const { toast } = useToast()
  const companyCountry = watch('companyInfo.country') || 'DE'

  const [searchQuery, setSearchQuery] = React.useState('')
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [selectedBank, setSelectedBank] = React.useState<Bank | null>(null)
  const [oauthWindow, setOauthWindow] = React.useState<Window | null>(null)

  const { connections, fetchConnections, startConnection, disconnectConnection } = useBankConnections()
  const { banks, isLoading: isLoadingBanks, fetchBanks } = useBanks()

  const provider = getProviderForCountry(companyCountry)
  const hasConnection = connections.length > 0

  // Load connections on mount
  React.useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  // Load banks when provider changes
  React.useEffect(() => {
    if (provider && companyCountry) {
      fetchBanks(companyCountry)
    }
  }, [provider, companyCountry, fetchBanks])

  // Filter banks based on search query
  const filteredBanks = React.useMemo(() => {
    if (!searchQuery.trim()) return banks
    const query = searchQuery.toLowerCase()
    return banks.filter(bank =>
      bank.name.toLowerCase().includes(query) ||
      bank.bic?.toLowerCase().includes(query)
    )
  }, [banks, searchQuery])

  // Listen for OAuth callback
  React.useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin (adjust based on your API domain)
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'BANK_CONNECTION_SUCCESS') {
        setIsConnecting(false)
        if (oauthWindow) {
          oauthWindow.close()
          setOauthWindow(null)
        }

        // Refresh connections
        await fetchConnections()

        // Update form state
        setValue('banking.connected', true)
        setValue('banking.provider', provider?.id || null)

        toast({
          title: 'Bank Connected',
          description: 'Your bank account has been connected successfully.',
        })
      } else if (event.data.type === 'BANK_CONNECTION_ERROR') {
        setIsConnecting(false)
        if (oauthWindow) {
          oauthWindow.close()
          setOauthWindow(null)
        }

        toast({
          title: 'Connection Failed',
          description: event.data.message || 'Failed to connect your bank account.',
          variant: 'destructive',
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [oauthWindow, fetchConnections, setValue, toast, provider])

  /**
   * Start bank connection OAuth flow
   */
  const handleConnectBank = async (bank: Bank) => {
    if (!provider) {
      toast({
        title: 'Provider Not Available',
        description: `Bank connections are not available for ${companyCountry}.`,
        variant: 'destructive',
      })
      return
    }

    setIsConnecting(true)
    setSelectedBank(bank)

    try {
      const redirectUrl = `${window.location.origin}/onboarding/banking/callback`

      const response = await startConnection({
        provider: 'TINK', // Currently only Tink is implemented
        country: companyCountry,
        bankId: bank.id,
        redirectUrl,
      })

      // Open OAuth flow in popup
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const popup = window.open(
        response.authorizationUrl,
        'BankConnection',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      )

      if (popup) {
        setOauthWindow(popup)

        // Check if popup was closed without completing
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            setIsConnecting(false)
            setOauthWindow(null)
          }
        }, 500)
      } else {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }
    } catch (error) {
      setIsConnecting(false)
      setSelectedBank(null)
      console.error('Failed to start bank connection:', error)
    }
  }

  /**
   * Disconnect a bank connection
   */
  const handleDisconnect = async (connectionId: string) => {
    try {
      await disconnectConnection(connectionId)
      setValue('banking.connected', false)
      setValue('banking.provider', null)
    } catch (error) {
      console.error('Failed to disconnect bank:', error)
    }
  }

  /**
   * Skip this step
   */
  const handleSkip = () => {
    setValue('banking.skipped', true)
    setValue('banking.connected', false)
  }

  if (!provider) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Bank Account</CardTitle>
            <CardDescription>
              Link your business bank account to automatically sync transactions and streamline your
              bookkeeping.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bank connections are not yet available for {companyCountry}. You can add bank
                accounts manually from your dashboard after completing onboarding.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center pt-6">
              <Button variant="ghost" onClick={handleSkip}>
                Continue without connecting
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Bank Account</CardTitle>
          <CardDescription>
            Link your business bank account to automatically sync transactions and streamline your
            bookkeeping. This step is optional but highly recommended.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Bank-level security</p>
              <p className="text-sm text-muted-foreground">
                Your credentials are encrypted and never stored. We use read-only access to fetch
                your transactions via {provider.name}.
              </p>
            </div>
          </div>

          {/* Connected Banks */}
          {hasConnection && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Connected Banks</h4>
                {connections.map((connection) => (
                  <ConnectedBankCard
                    key={connection.id}
                    connection={connection}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </div>
              <Separator />
            </>
          )}

          {/* Bank Provider Info */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{provider.name}</h5>
                    {provider.recommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {provider.bankCount} banks available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Search */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Select Your Bank</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for your bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Bank List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isLoadingBanks ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredBanks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No banks found matching "{searchQuery}"</p>
                </div>
              ) : (
                filteredBanks.map((bank) => (
                  <BankCard
                    key={bank.id}
                    bank={bank}
                    isConnecting={isConnecting && selectedBank?.id === bank.id}
                    onConnect={handleConnectBank}
                  />
                ))
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Why connect your bank?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <BenefitItem icon="💰" text="Automatic transaction import and categorization" />
              <BenefitItem icon="📊" text="Real-time cash flow monitoring" />
              <BenefitItem icon="🔄" text="Simplified reconciliation process" />
              <BenefitItem icon="📈" text="Better insights and tax preparation" />
            </div>
          </div>

          {/* Skip Option */}
          {!hasConnection && (
            <div className="flex justify-center pt-4">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * BankCard Component - Display individual bank in list
 */
interface BankCardProps {
  bank: Bank
  isConnecting: boolean
  onConnect: (bank: Bank) => void
}

function BankCard({ bank, isConnecting, onConnect }: BankCardProps) {
  return (
    <Card
      className={`hover:border-primary/50 transition-colors cursor-pointer ${
        isConnecting ? 'border-primary/50' : ''
      }`}
      onClick={() => !isConnecting && onConnect(bank)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              {bank.logo ? (
                <img src={bank.logo} alt={bank.name} className="w-8 h-8 object-contain" />
              ) : (
                <Building2 className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h5 className="font-medium">{bank.name}</h5>
              {bank.bic && (
                <p className="text-xs text-muted-foreground">BIC: {bank.bic}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isConnecting}
            onClick={(e) => {
              e.stopPropagation()
              onConnect(bank)
            }}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * ConnectedBankCard Component - Display connected bank
 */
interface ConnectedBankCardProps {
  connection: BankConnection
  onDisconnect: (connectionId: string) => void
}

function ConnectedBankCard({ connection, onDisconnect }: ConnectedBankCardProps) {
  const [isDisconnecting, setIsDisconnecting] = React.useState(false)

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      await onDisconnect(connection.id)
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              {connection.status === 'ACTIVE' ? (
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              ) : connection.status === 'ERROR' || connection.status === 'NEEDS_REAUTH' ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : (
                <Building2 className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{connection.bankName}</p>
                {connection.status === 'ACTIVE' && (
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    Connected
                  </Badge>
                )}
                {connection.status === 'NEEDS_REAUTH' && (
                  <Badge variant="outline" className="text-xs border-destructive text-destructive">
                    Needs Reauth
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {connection.accounts.length} {connection.accounts.length === 1 ? 'account' : 'accounts'}
                {connection.lastSyncAt && (
                  <> • Last synced {new Date(connection.lastSyncAt).toLocaleDateString()}</>
                )}
              </p>
              {connection.errorMessage && (
                <p className="text-xs text-destructive mt-1">{connection.errorMessage}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={isDisconnecting}
            onClick={handleDisconnect}
          >
            {isDisconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Connected Accounts */}
        {connection.accounts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
            {connection.accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium">{account.accountName}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.type} • {account.accountNumber.slice(-4).padStart(account.accountNumber.length, '•')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency,
                    }).format(account.balance)}
                  </p>
                  {account.availableBalance !== undefined && account.availableBalance !== account.balance && (
                    <p className="text-xs text-muted-foreground">
                      Available: {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: account.currency,
                      }).format(account.availableBalance)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * BenefitItem Component - Display a benefit with icon
 */
interface BenefitItemProps {
  icon: string
  text: string
}

function BenefitItem({ icon, text }: BenefitItemProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
