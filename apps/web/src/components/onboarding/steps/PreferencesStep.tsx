import { Bell, Globe } from 'lucide-react'
import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'nl', name: 'Nederlands (Dutch)' },
]

const TIMEZONES = [
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
  { value: 'Europe/Vienna', label: 'Vienna (UTC+1)' },
  { value: 'Europe/Zurich', label: 'Zurich (UTC+1)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (UTC+1)' },
  { value: 'Europe/Brussels', label: 'Brussels (UTC+1)' },
  { value: 'Europe/Rome', label: 'Rome (UTC+1)' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
]

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CHF', symbol: 'Fr.', name: 'Swiss Franc' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
]

const DATE_FORMATS = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD (2024-12-31)' },
]

export function PreferencesStep() {
  const { setValue, watch } = useFormContext()
  const selectedLanguage = watch('preferences.language') || 'en'
  const selectedTimezone = watch('preferences.timezone') || 'Europe/Berlin'
  const selectedCurrency = watch('preferences.currency') || 'EUR'
  const selectedDateFormat = watch('preferences.dateFormat') || 'dd/mm/yyyy'

  // Notification preferences
  const emailNotifications = watch('preferences.notifications.email') ?? true
  const invoiceReminders = watch('preferences.notifications.invoiceReminders') ?? true
  const taxDeadlines = watch('preferences.notifications.taxDeadlines') ?? true
  const bankTransactions = watch('preferences.notifications.bankTransactions') ?? false
  const weeklyReports = watch('preferences.notifications.weeklyReports') ?? true

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>
            Customize your experience with language, regional settings, and notification
            preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Regional Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium">Regional Settings</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={selectedLanguage}
                  onValueChange={(value) => setValue('preferences.language', value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={selectedTimezone}
                  onValueChange={(value) => setValue('preferences.timezone', value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setValue('preferences.currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Format */}
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={selectedDateFormat}
                  onValueChange={(value) => setValue('preferences.dateFormat', value)}
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium">Notification Preferences</h4>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="emailNotifications" className="cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) =>
                    setValue('preferences.notifications.email', checked)
                  }
                />
              </div>

              {/* Invoice Reminders */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="invoiceReminders" className="cursor-pointer">
                    Invoice Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about pending and overdue invoices
                  </p>
                </div>
                <Switch
                  id="invoiceReminders"
                  checked={invoiceReminders}
                  onCheckedChange={(checked) =>
                    setValue('preferences.notifications.invoiceReminders', checked)
                  }
                />
              </div>

              {/* Tax Deadlines */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="taxDeadlines" className="cursor-pointer">
                    Tax Deadline Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Never miss VAT returns and tax filing deadlines
                  </p>
                </div>
                <Switch
                  id="taxDeadlines"
                  checked={taxDeadlines}
                  onCheckedChange={(checked) =>
                    setValue('preferences.notifications.taxDeadlines', checked)
                  }
                />
              </div>

              {/* Bank Transactions */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="bankTransactions" className="cursor-pointer">
                    Bank Transaction Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new bank transactions
                  </p>
                </div>
                <Switch
                  id="bankTransactions"
                  checked={bankTransactions}
                  onCheckedChange={(checked) =>
                    setValue('preferences.notifications.bankTransactions', checked)
                  }
                />
              </div>

              {/* Weekly Reports */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="weeklyReports" className="cursor-pointer">
                    Weekly Summary Reports
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly financial summaries and insights
                  </p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={weeklyReports}
                  onCheckedChange={(checked) =>
                    setValue('preferences.notifications.weeklyReports', checked)
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
