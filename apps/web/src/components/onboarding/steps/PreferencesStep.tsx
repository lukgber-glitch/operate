'use client';

import { Bell, Globe, Brain, Shield, ExternalLink } from 'lucide-react'
import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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

  // AI consent
  const aiConsent = watch('preferences.aiConsent') ?? false

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 mb-8 mt-4">
        <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
          Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Preferences
          </span>
        </h1>
        <p className="text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
          Customize your experience with language, regional settings, and notification preferences.
        </p>
      </div>

      <Card className="rounded-[16px] bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
        <div className="space-y-6">
          {/* Regional Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-white/70" />
              <h4 className="text-sm font-medium text-white">Regional Settings</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="text-white">Language</Label>
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
                <Label htmlFor="timezone" className="text-white">Timezone</Label>
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
                <Label htmlFor="currency" className="text-white">Default Currency</Label>
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
                <Label htmlFor="dateFormat" className="text-white">Date Format</Label>
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
              <Bell className="w-4 h-4 text-white/70" />
              <h4 className="text-sm font-medium text-white">Notification Preferences</h4>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="emailNotifications" className="cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-white/60">
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
                  <p className="text-sm text-white/60">
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
                  <p className="text-sm text-white/60">
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
                  <p className="text-sm text-white/60">
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
                  <p className="text-sm text-white/60">
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

          <Separator />

          {/* AI Assistant Consent */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-white/70" />
              <h4 className="text-sm font-medium text-white">AI Assistant</h4>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-white/80">
                  Operate uses AI (Claude by Anthropic) to help manage your business.
                  By enabling AI features, you consent to:
                </p>
                <ul className="text-sm text-white/60 space-y-1.5 ml-4">
                  <li className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>AI processing of your business data (invoices, transactions, documents)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Data shared with Anthropic for AI assistance (encrypted, not used for training)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>You can revoke consent anytime in Settings</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="aiConsent"
                  checked={aiConsent}
                  onCheckedChange={(checked) =>
                    setValue('preferences.aiConsent', checked as boolean)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="aiConsent" className="cursor-pointer text-white font-medium">
                    Enable AI Assistant
                  </Label>
                  <p className="text-sm text-white/60">
                    I consent to AI processing of my business data as described above
                  </p>
                </div>
              </div>

              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/50 hover:text-white/70 flex items-center gap-1 transition-colors"
              >
                Read our Privacy Policy
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
