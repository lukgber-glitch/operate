"use client"


import { Bell, Mail, Smartphone, Moon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useNotifications } from '@/hooks/use-notifications'

const notificationTypes = [
  { key: 'INVOICE_DUE', label: 'Invoice Due', description: 'When invoices are due or overdue' },
  { key: 'TASK_ASSIGNED', label: 'Task Assigned', description: 'When tasks are assigned to you' },
  { key: 'DOCUMENT_CLASSIFIED', label: 'Document Classified', description: 'When documents are automatically classified' },
  { key: 'TAX_DEADLINE', label: 'Tax Deadline', description: 'Upcoming tax filing deadlines' },
  { key: 'SYSTEM', label: 'System', description: 'System updates and maintenance' },
]

const channels = [
  { key: 'inApp', label: 'In-App', icon: Bell, description: 'Show notifications in the app' },
  { key: 'email', label: 'Email', icon: Mail, description: 'Send notifications via email' },
  { key: 'push', label: 'Push', icon: Smartphone, description: 'Send push notifications' },
]

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotifications()

  if (!preferences) {
    return <div>Loading preferences...</div>
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

  return (
    <div className="space-y-6">
      {/* Do Not Disturb */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            <CardTitle>Do Not Disturb</CardTitle>
          </div>
          <CardDescription>
            Temporarily disable all notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="dnd">Enable Do Not Disturb</Label>
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
          <CardTitle>Quiet Hours</CardTitle>
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
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive different types of notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map((type, index) => (
            <div key={type.key}>
              {index > 0 && <Separator className="my-4" />}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">{type.label}</h4>
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

                    return (
                      <div key={channel.key} className="flex items-center gap-3">
                        <Switch
                          id={`${type.key}-${channel.key}`}
                          checked={typePrefs[channel.key as keyof typeof typePrefs] || false}
                          onCheckedChange={(value) =>
                            handleToggle(type.key, channel.key, value)
                          }
                        />
                        <Label
                          htmlFor={`${type.key}-${channel.key}`}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <ChannelIcon className="h-4 w-4" />
                          <span className="text-sm">{channel.label}</span>
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
