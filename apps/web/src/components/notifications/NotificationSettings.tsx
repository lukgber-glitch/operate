"use client"

import { Bell, Mail, Smartphone, Moon, TestTube, Shield, Volume2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useNotifications } from '@/hooks/use-notifications'
import { usePushNotifications } from '@/hooks/usePushNotifications'

const notificationTypes = [
  {
    key: 'INVOICE_DUE',
    label: 'Invoice Reminders',
    description: 'When invoices are due or overdue',
    category: 'Financial'
  },
  {
    key: 'PAYMENT_RECEIVED',
    label: 'Payment Received',
    description: 'When payments are received from clients',
    category: 'Financial'
  },
  {
    key: 'TASK_ASSIGNED',
    label: 'Task Assigned',
    description: 'When tasks are assigned to you',
    category: 'Productivity'
  },
  {
    key: 'DOCUMENT_CLASSIFIED',
    label: 'Document Classified',
    description: 'When documents are automatically classified',
    category: 'Documents'
  },
  {
    key: 'TAX_DEADLINE',
    label: 'Tax Deadlines',
    description: 'Upcoming tax filing deadlines',
    category: 'Tax & Compliance'
  },
  {
    key: 'SYSTEM_UPDATE',
    label: 'System Updates',
    description: 'New features and platform updates',
    category: 'System'
  },
]

const channels = [
  {
    key: 'inApp',
    label: 'In-App',
    icon: Bell,
    description: 'Show notifications in the app'
  },
  {
    key: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Send notifications via email'
  },
  {
    key: 'push',
    label: 'Push',
    icon: Smartphone,
    description: 'Send push notifications to your device'
  },
]

export function NotificationSettings() {
  const { preferences, updatePreferences } = useNotifications()
  const {
    permissionState,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification,
    requestPermission
  } = usePushNotifications()

  if (!preferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    )
  }

  const handleToggle = (type: string, channel: string, value: boolean) => {
    const currentPrefs = preferences[type]
    const currentChannel = typeof currentPrefs === 'object' && currentPrefs !== null ? currentPrefs : {
      inApp: true,
      email: false,
      push: false,
    }

    updatePreferences({
      [type]: {
        ...currentChannel,
        [channel]: value,
      },
    })
  }

  const handleDoNotDisturbToggle = (value: boolean) => {
    updatePreferences({
      doNotDisturb: value,
    })
  }

  const handleQuietHoursChange = (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    updatePreferences({
      [field]: value,
    })
  }

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      if (permissionState === 'default') {
        const granted = await requestPermission()
        if (granted) {
          await subscribe()
        }
      } else if (permissionState === 'granted') {
        await subscribe()
      }
    }
  }

  // Group notifications by category
  const groupedNotifications = notificationTypes.reduce((acc, type) => {
    const category = type.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(type)
    return acc
  }, {} as Record<string, typeof notificationTypes>)

  return (
    <div className="space-y-6">
      {/* Push Notifications Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <CardTitle>Push Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive real-time notifications on your device even when the app is closed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled">Enable push notifications</Label>
              <p className="text-sm text-muted-foreground">
                Status: {' '}
                {permissionState === 'granted' && isSubscribed && (
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                )}
                {permissionState === 'granted' && !isSubscribed && (
                  <Badge variant="secondary">Permission granted</Badge>
                )}
                {permissionState === 'denied' && (
                  <Badge variant="destructive">Blocked</Badge>
                )}
                {permissionState === 'default' && (
                  <Badge variant="outline">Not configured</Badge>
                )}
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={isSubscribed}
              onCheckedChange={handlePushToggle}
              disabled={isLoading || permissionState === 'denied'}
            />
          </div>

          {permissionState === 'denied' && (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Push notifications are blocked. To enable them, please allow notifications in your browser settings.
              </AlertDescription>
            </Alert>
          )}

          {isSubscribed && (
            <Button
              onClick={testNotification}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <TestTube className="h-4 w-4" />
              Send test notification
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            <CardTitle>Do Not Disturb</CardTitle>
          </div>
          <CardDescription>
            Temporarily silence all notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dnd">Enable Do Not Disturb</Label>
              <p className="text-sm text-muted-foreground">
                Mutes all notifications until disabled
              </p>
            </div>
            <Switch
              id="dnd"
              checked={preferences.doNotDisturb || false}
              onCheckedChange={handleDoNotDisturbToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>
            Set specific hours when notifications will be muted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={preferences.quietHoursStart || '22:00'}
                onChange={(e) => handleQuietHoursChange('quietHoursStart', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={preferences.quietHoursEnd || '08:00'}
                onChange={(e) => handleQuietHoursChange('quietHoursEnd', e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Notifications will be silenced between these hours
          </p>
        </CardContent>
      </Card>

      {/* Notification Preferences by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive different types of notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedNotifications).map(([category, types], categoryIndex) => (
            <div key={category}>
              {categoryIndex > 0 && <Separator className="my-6" />}

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-muted-foreground">{category}</h4>
              </div>

              <div className="space-y-6">
                {types.map((type) => (
                  <div key={type.key} className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium">{type.label}</h5>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <div className="grid gap-4 pl-4 sm:grid-cols-3">
                      {channels.map((channel) => {
                        const ChannelIcon = channel.icon
                        const typePrefs = preferences[type.key] || {
                          inApp: true,
                          email: false,
                          push: false,
                        }

                        const isDisabled = channel.key === 'push' && !isSubscribed

                        return (
                          <div key={channel.key} className="flex items-center gap-3">
                            <Switch
                              id={`${type.key}-${channel.key}`}
                              checked={typePrefs[channel.key as keyof typeof typePrefs] || false}
                              onCheckedChange={(value) =>
                                handleToggle(type.key, channel.key, value)
                              }
                              disabled={isDisabled}
                            />
                            <Label
                              htmlFor={`${type.key}-${channel.key}`}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <ChannelIcon className={`h-4 w-4 ${isDisabled ? 'text-muted-foreground' : ''}`} />
                              <span className={`text-sm ${isDisabled ? 'text-muted-foreground' : ''}`}>
                                {channel.label}
                                {isDisabled && ' (disabled)'}
                              </span>
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
