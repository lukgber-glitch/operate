import { Globe, Upload, Key, ShieldCheck, ExternalLink } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { TaxIntegration, TaxAuthType } from './TaxSoftwareStep'

interface TaxIntegrationCardProps {
  integration: TaxIntegration
  onConnect: () => void
  isConnecting?: boolean
}

// Map auth types to visual indicators
const AUTH_TYPE_CONFIG: Record<
  TaxAuthType,
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
    color: string
    bgColor: string
  }
> = {
  oauth: {
    icon: Globe,
    label: 'OAuth',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
  },
  certificate: {
    icon: Upload,
    label: 'Certificate',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
  },
  apiKey: {
    icon: Key,
    label: 'API Key',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950',
  },
  credentials: {
    icon: ShieldCheck,
    label: 'Credentials',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-950',
  },
}

export function TaxIntegrationCard({
  integration,
  onConnect,
  isConnecting = false,
}: TaxIntegrationCardProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const authConfig = AUTH_TYPE_CONFIG[integration.authType]

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Icon/Flag */}
              <div className="text-3xl flex-shrink-0">{integration.icon}</div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="font-medium">{integration.name}</h5>
                  {integration.recommended && (
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                  {/* Auth Type Badge */}
                  <Badge variant="outline" className="text-xs">
                    <div className={`w-2 h-2 rounded-full mr-1.5 ${authConfig.bgColor}`} />
                    {authConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>

                {/* Requirements Chips */}
                {(integration.requiresCertificate || integration.requiresApiKey) && (
                  <div className="flex items-center gap-2 mt-2">
                    {integration.requiresCertificate && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        <Upload className="w-3 h-3" />
                        Certificate required
                      </span>
                    )}
                    {integration.requiresApiKey && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        <Key className="w-3 h-3" />
                        API key required
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Connect Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onConnect}
              disabled={isConnecting}
              className="flex-shrink-0"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>

          {/* Expandable Details */}
          {integration.features.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-primary hover:underline"
              >
                {showDetails ? 'Hide features' : 'Show features'}
              </button>

              {showDetails && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  {integration.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <p className="text-xs text-muted-foreground">{feature}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documentation Link */}
          {integration.documentationUrl && showDetails && (
            <a
              href={integration.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View documentation
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
