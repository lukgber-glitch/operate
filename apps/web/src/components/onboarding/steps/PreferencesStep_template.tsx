import { Bell, Bot, Globe, LayoutDashboard } from 'lucide-react'
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

import { AutomationModeCard, type AutomationMode } from './AutomationModeCard'

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

const TIME_FORMATS = [
  { value: '12h', label: '12-hour (02:30 PM)' },
  { value: '24h', label: '24-hour (14:30)' },
]

const NUMBER_FORMATS = [
  { value: 'us', label: '1,234.56 (US/UK)' },
  { value: 'eu', label: '1.234,56 (EU)' },
]

const DASHBOARD_VIEWS = [
  { value: 'overview', label: 'Overview Dashboard' },
  { value: 'financial', label: 'Financial Dashboard' },
  { value: 'hr', label: 'HR Dashboard' },
]

export function PreferencesStep() {
  const { setValue, watch } = useFormContext()

  // Automation mode
  const automationMode = (watch('preferences.automationMode') || 'SEMI_AUTO') as AutomationMode

  // Regional settings
  const selectedLanguage = watch('preferences.language') || 'en'
  const selectedTimezone = watch('preferences.timezone') || 'Europe/Berlin'
  const selectedCurrency = watch('preferences.currency') || 'EUR'
  const selectedDateFormat = watch('preferences.dateFormat') || 'dd/mm/yyyy'
  const selectedTimeFormat = watch('preferences.timeFormat') || '24h'
  const selectedNumberFormat = watch('preferences.numberFormat') || 'eu'

  // Notification preferences
  const emailNotifications = watch('preferences.notifications.email') ?? true
  const inAppRealtime = watch('preferences.notifications.inApp.realtime') ?? true
  const inAppTasks = watch('preferences.notifications.inApp.tasks') ?? true
  const inAppSystem = watch('preferences.notifications.inApp.system') ?? true
  const pushNotifications = watch('preferences.notifications.push') ?? false

  // Email notification details
  const emailInvoices = watch('preferences.notifications.email.invoices') ?? true
  const emailReminders = watch('preferences.notifications.email.reminders') ?? true
  const emailTax = watch('preferences.notifications.email.tax') ?? true
  const emailWeekly = watch('preferences.notifications.email.weekly') ?? true

  // Dashboard preferences
  const dashboardView = watch('preferences.dashboard.defaultView') || 'overview'
  const compactMode = watch('preferences.dashboard.compactMode') ?? false

  return (
    <div className="space-y-6">PLACEHOLDER_CONTENT</div>
  )
}
