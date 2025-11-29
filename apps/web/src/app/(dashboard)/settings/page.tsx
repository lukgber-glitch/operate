'use client';

import { useState } from 'react';
import { Building2, Receipt, Bell, Link2, Users, Save, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

// Mock data for organization settings
const initialOrgData = {
  name: 'Acme Corporation',
  legalName: 'Acme Corporation GmbH',
  email: 'contact@acme.com',
  phone: '+49 30 12345678',
  website: 'www.acme.com',
  address: 'Hauptstrasse 123',
  city: 'Berlin',
  postalCode: '10115',
  country: 'DE',
};

const initialTaxData = {
  vatId: 'DE123456789',
  taxNumber: '12/345/67890',
  fiscalYearStart: '01',
  fiscalYearEnd: '12',
  taxRegime: 'standard',
  vatRate: '19',
};

const initialInvoiceData = {
  prefix: 'INV',
  nextNumber: '2024-001',
  paymentTerms: '30',
  currency: 'EUR',
  footer: 'Thank you for your business. Payment is due within 30 days.',
  bankName: 'Deutsche Bank',
  iban: 'DE89 3704 0044 0532 0130 00',
  bic: 'COBADEFFXXX',
};

const initialNotificationData = {
  emailNotifications: true,
  invoiceReminders: true,
  expenseApprovals: true,
  leaveRequests: true,
  payrollReminders: false,
  taxDeadlines: true,
  weeklyDigest: true,
};

const initialAutomationData = {
  classification: { mode: 'SEMI_AUTO', confidenceThreshold: 0.9, amountThreshold: 5000, enabled: true },
  expense: { mode: 'SEMI_AUTO', confidenceThreshold: 0.85, amountThreshold: 500, enabled: true },
  deduction: { mode: 'SEMI_AUTO', confidenceThreshold: 0.9, amountThreshold: 1000, enabled: true },
  invoice: { mode: 'MANUAL', confidenceThreshold: 0.95, amountThreshold: 10000, enabled: false },
};

const integrations = [
  {
    id: 'elster',
    name: 'ELSTER',
    description: 'German tax authority integration',
    status: 'connected',
    lastSync: '2024-11-28',
  },
  {
    id: 'datev',
    name: 'DATEV',
    description: 'Accounting software integration',
    status: 'disconnected',
    lastSync: null,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing',
    status: 'connected',
    lastSync: '2024-11-29',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Financial management',
    status: 'disconnected',
    lastSync: null,
  },
];

export default function SettingsPage() {
  const [orgData, setOrgData] = useState(initialOrgData);
  const [taxData, setTaxData] = useState(initialTaxData);
  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);
  const [notificationData, setNotificationData] = useState(initialNotificationData);
  const [automationSettings, setAutomationSettings] = useState(initialAutomationData);

  const handleSaveOrganization = () => {
    toast({
      title: 'Settings saved',
      description: 'Organization settings have been updated successfully.',
    });
  };

  const handleSaveTax = () => {
    toast({
      title: 'Settings saved',
      description: 'Tax configuration has been updated successfully.',
    });
  };

  const handleSaveInvoice = () => {
    toast({
      title: 'Settings saved',
      description: 'Invoice settings have been updated successfully.',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Settings saved',
      description: 'Notification preferences have been updated successfully.',
    });
  };

  const handleConnectIntegration = (id: string) => {
    toast({
      title: 'Integration connected',
      description: `Successfully connected to ${id.toUpperCase()}.`,
    });
  };

  const handleDisconnectIntegration = (id: string) => {
    toast({
      title: 'Integration disconnected',
      description: `Successfully disconnected from ${id.toUpperCase()}.`,
    });
  };

  const handleSaveAutomation = () => {
    toast({
      title: 'Automation settings saved',
      description: 'Your automation preferences have been updated successfully.',
    });
  };

  const updateAutomationSetting = (
    feature: keyof typeof automationSettings,
    updates: Partial<typeof automationSettings[keyof typeof automationSettings]>
  ) => {
    setAutomationSettings({
      ...automationSettings,
      [feature]: { ...automationSettings[feature], ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="organization">
            <Building2 className="mr-2 h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="tax">
            <Receipt className="mr-2 h-4 w-4" />
            Tax
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="mr-2 h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Sparkles className="mr-2 h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Link2 className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>
                Update your organization's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgData.name}
                    onChange={(e) =>
                      setOrgData({ ...orgData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal-name">Legal Name</Label>
                  <Input
                    id="legal-name"
                    value={orgData.legalName}
                    onChange={(e) =>
                      setOrgData({ ...orgData, legalName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={orgData.email}
                    onChange={(e) =>
                      setOrgData({ ...orgData, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={orgData.phone}
                    onChange={(e) =>
                      setOrgData({ ...orgData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={orgData.website}
                    onChange={(e) =>
                      setOrgData({ ...orgData, website: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={orgData.country}
                    onValueChange={(value) =>
                      setOrgData({ ...orgData, country: value })
                    }
                  >
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="AT">Austria</SelectItem>
                      <SelectItem value="CH">Switzerland</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="NL">Netherlands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={orgData.address}
                  onChange={(e) =>
                    setOrgData({ ...orgData, address: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={orgData.city}
                    onChange={(e) =>
                      setOrgData({ ...orgData, city: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input
                    id="postal-code"
                    value={orgData.postalCode}
                    onChange={(e) =>
                      setOrgData({ ...orgData, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveOrganization}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Configuration */}
        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
              <CardDescription>
                Configure your tax settings and compliance information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vat-id">VAT ID</Label>
                  <Input
                    id="vat-id"
                    value={taxData.vatId}
                    onChange={(e) =>
                      setTaxData({ ...taxData, vatId: e.target.value })
                    }
                    placeholder="DE123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-number">Tax Number</Label>
                  <Input
                    id="tax-number"
                    value={taxData.taxNumber}
                    onChange={(e) =>
                      setTaxData({ ...taxData, taxNumber: e.target.value })
                    }
                    placeholder="12/345/67890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiscal-year-start">Fiscal Year Start</Label>
                  <Select
                    value={taxData.fiscalYearStart}
                    onValueChange={(value) =>
                      setTaxData({ ...taxData, fiscalYearStart: value })
                    }
                  >
                    <SelectTrigger id="fiscal-year-start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem
                          key={month}
                          value={month.toString().padStart(2, '0')}
                        >
                          {new Date(2024, month - 1).toLocaleString('default', {
                            month: 'long',
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiscal-year-end">Fiscal Year End</Label>
                  <Select
                    value={taxData.fiscalYearEnd}
                    onValueChange={(value) =>
                      setTaxData({ ...taxData, fiscalYearEnd: value })
                    }
                  >
                    <SelectTrigger id="fiscal-year-end">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem
                          key={month}
                          value={month.toString().padStart(2, '0')}
                        >
                          {new Date(2024, month - 1).toLocaleString('default', {
                            month: 'long',
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-regime">Tax Regime</Label>
                  <Select
                    value={taxData.taxRegime}
                    onValueChange={(value) =>
                      setTaxData({ ...taxData, taxRegime: value })
                    }
                  >
                    <SelectTrigger id="tax-regime">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="small-business">
                        Small Business Exemption
                      </SelectItem>
                      <SelectItem value="reverse-charge">
                        Reverse Charge
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat-rate">Default VAT Rate (%)</Label>
                  <Select
                    value={taxData.vatRate}
                    onValueChange={(value) =>
                      setTaxData({ ...taxData, vatRate: value })
                    }
                  >
                    <SelectTrigger id="vat-rate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exempt)</SelectItem>
                      <SelectItem value="7">7% (Reduced)</SelectItem>
                      <SelectItem value="19">19% (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveTax}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>
                Configure your invoice defaults and payment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
                  <Input
                    id="invoice-prefix"
                    value={invoiceData.prefix}
                    onChange={(e) =>
                      setInvoiceData({ ...invoiceData, prefix: e.target.value })
                    }
                    placeholder="INV"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next-number">Next Invoice Number</Label>
                  <Input
                    id="next-number"
                    value={invoiceData.nextNumber}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        nextNumber: e.target.value,
                      })
                    }
                    placeholder="2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-terms">
                    Default Payment Terms (Days)
                  </Label>
                  <Select
                    value={invoiceData.paymentTerms}
                    onValueChange={(value) =>
                      setInvoiceData({ ...invoiceData, paymentTerms: value })
                    }
                  >
                    <SelectTrigger id="payment-terms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={invoiceData.currency}
                    onValueChange={(value) =>
                      setInvoiceData({ ...invoiceData, currency: value })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                      <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-footer">Invoice Footer</Label>
                <Textarea
                  id="invoice-footer"
                  value={invoiceData.footer}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, footer: e.target.value })
                  }
                  placeholder="Add terms and conditions or payment instructions"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bank Details</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      value={invoiceData.bankName}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          bankName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bic">BIC/SWIFT</Label>
                    <Input
                      id="bic"
                      value={invoiceData.bic}
                      onChange={(e) =>
                        setInvoiceData({ ...invoiceData, bic: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={invoiceData.iban}
                      onChange={(e) =>
                        setInvoiceData({ ...invoiceData, iban: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveInvoice}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Preferences */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificationData.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="invoice-reminders">Invoice Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about overdue invoices
                    </p>
                  </div>
                  <Switch
                    id="invoice-reminders"
                    checked={notificationData.invoiceReminders}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        invoiceReminders: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="expense-approvals">Expense Approvals</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when expenses need approval
                    </p>
                  </div>
                  <Switch
                    id="expense-approvals"
                    checked={notificationData.expenseApprovals}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        expenseApprovals: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="leave-requests">Leave Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about employee leave requests
                    </p>
                  </div>
                  <Switch
                    id="leave-requests"
                    checked={notificationData.leaveRequests}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        leaveRequests: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="payroll-reminders">Payroll Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about payroll deadlines
                    </p>
                  </div>
                  <Switch
                    id="payroll-reminders"
                    checked={notificationData.payrollReminders}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        payrollReminders: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="tax-deadlines">Tax Deadlines</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerts for upcoming tax filing deadlines
                    </p>
                  </div>
                  <Switch
                    id="tax-deadlines"
                    checked={notificationData.taxDeadlines}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        taxDeadlines: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-digest">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of activities
                    </p>
                  </div>
                  <Switch
                    id="weekly-digest"
                    checked={notificationData.weeklyDigest}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        weeklyDigest: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Settings */}
        <TabsContent value="automation" className="space-y-6">
          {/* Info Banner */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Automation Modes Explained
                </h3>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>
                    <strong>Full Automatic:</strong> AI processes items without human review when confidence is high
                  </li>
                  <li>
                    <strong>Semi-Automatic:</strong> AI suggests actions, you approve or reject
                  </li>
                  <li>
                    <strong>Manual:</strong> All items require manual processing
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Transaction Classification */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction Classification</CardTitle>
                  <CardDescription>
                    Automatically classify transactions into tax categories
                  </CardDescription>
                </div>
                <Badge variant={automationSettings.classification.enabled ? 'default' : 'secondary'}>
                  {automationSettings.classification.mode === 'FULL_AUTO' ? 'Full Auto' :
                   automationSettings.classification.mode === 'SEMI_AUTO' ? 'Semi Auto' : 'Manual'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="classification-enabled">Enable Automation</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on AI-powered transaction classification
                  </p>
                </div>
                <Switch
                  id="classification-enabled"
                  checked={automationSettings.classification.enabled}
                  onCheckedChange={(checked) =>
                    updateAutomationSetting('classification', { enabled: checked })
                  }
                />
              </div>

              {automationSettings.classification.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="classification-mode">Automation Mode</Label>
                    <Select
                      value={automationSettings.classification.mode}
                      onValueChange={(value) =>
                        updateAutomationSetting('classification', { mode: value })
                      }
                    >
                      <SelectTrigger id="classification-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_AUTO">Full Automatic - AI handles everything automatically</SelectItem>
                        <SelectItem value="SEMI_AUTO">Semi-Automatic - AI suggests, you approve</SelectItem>
                        <SelectItem value="MANUAL">Manual - You handle everything</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {automationSettings.classification.mode === 'FULL_AUTO' && (
                    <div className="space-y-2">
                      <Label htmlFor="classification-confidence">
                        Confidence Threshold: {(automationSettings.classification.confidenceThreshold * 100).toFixed(0)}%
                      </Label>
                      <Input
                        id="classification-confidence"
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={automationSettings.classification.confidenceThreshold * 100}
                        onChange={(e) =>
                          updateAutomationSetting('classification', {
                            confidenceThreshold: parseInt(e.target.value) / 100,
                          })
                        }
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground">
                        Only auto-classify when AI is at least {(automationSettings.classification.confidenceThreshold * 100).toFixed(0)}% confident
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="classification-amount">Auto-approve transactions under (EUR)</Label>
                    <Input
                      id="classification-amount"
                      type="number"
                      value={automationSettings.classification.amountThreshold}
                      onChange={(e) =>
                        updateAutomationSetting('classification', {
                          amountThreshold: parseInt(e.target.value),
                        })
                      }
                      placeholder="5000"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Expense Approval */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Approval</CardTitle>
                  <CardDescription>
                    Automatically approve employee expense claims
                  </CardDescription>
                </div>
                <Badge variant={automationSettings.expense.enabled ? 'default' : 'secondary'}>
                  {automationSettings.expense.mode === 'FULL_AUTO' ? 'Full Auto' :
                   automationSettings.expense.mode === 'SEMI_AUTO' ? 'Semi Auto' : 'Manual'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="expense-enabled">Enable Automation</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on AI-powered expense approval
                  </p>
                </div>
                <Switch
                  id="expense-enabled"
                  checked={automationSettings.expense.enabled}
                  onCheckedChange={(checked) =>
                    updateAutomationSetting('expense', { enabled: checked })
                  }
                />
              </div>

              {automationSettings.expense.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="expense-mode">Automation Mode</Label>
                    <Select
                      value={automationSettings.expense.mode}
                      onValueChange={(value) =>
                        updateAutomationSetting('expense', { mode: value })
                      }
                    >
                      <SelectTrigger id="expense-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_AUTO">Full Automatic - AI handles everything automatically</SelectItem>
                        <SelectItem value="SEMI_AUTO">Semi-Automatic - AI suggests, you approve</SelectItem>
                        <SelectItem value="MANUAL">Manual - You handle everything</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {automationSettings.expense.mode === 'FULL_AUTO' && (
                    <div className="space-y-2">
                      <Label htmlFor="expense-confidence">
                        Confidence Threshold: {(automationSettings.expense.confidenceThreshold * 100).toFixed(0)}%
                      </Label>
                      <Input
                        id="expense-confidence"
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={automationSettings.expense.confidenceThreshold * 100}
                        onChange={(e) =>
                          updateAutomationSetting('expense', {
                            confidenceThreshold: parseInt(e.target.value) / 100,
                          })
                        }
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground">
                        Only auto-approve when AI is at least {(automationSettings.expense.confidenceThreshold * 100).toFixed(0)}% confident
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Auto-approve expenses under (EUR)</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      value={automationSettings.expense.amountThreshold}
                      onChange={(e) =>
                        updateAutomationSetting('expense', {
                          amountThreshold: parseInt(e.target.value),
                        })
                      }
                      placeholder="500"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Deduction Suggestions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Deduction Suggestions</CardTitle>
                  <CardDescription>
                    Automatically identify and suggest tax deductions
                  </CardDescription>
                </div>
                <Badge variant={automationSettings.deduction.enabled ? 'default' : 'secondary'}>
                  {automationSettings.deduction.mode === 'FULL_AUTO' ? 'Full Auto' :
                   automationSettings.deduction.mode === 'SEMI_AUTO' ? 'Semi Auto' : 'Manual'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="deduction-enabled">Enable Automation</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on AI-powered deduction suggestions
                  </p>
                </div>
                <Switch
                  id="deduction-enabled"
                  checked={automationSettings.deduction.enabled}
                  onCheckedChange={(checked) =>
                    updateAutomationSetting('deduction', { enabled: checked })
                  }
                />
              </div>

              {automationSettings.deduction.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="deduction-mode">Automation Mode</Label>
                    <Select
                      value={automationSettings.deduction.mode}
                      onValueChange={(value) =>
                        updateAutomationSetting('deduction', { mode: value })
                      }
                    >
                      <SelectTrigger id="deduction-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_AUTO">Full Automatic - AI handles everything automatically</SelectItem>
                        <SelectItem value="SEMI_AUTO">Semi-Automatic - AI suggests, you approve</SelectItem>
                        <SelectItem value="MANUAL">Manual - You handle everything</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {automationSettings.deduction.mode === 'FULL_AUTO' && (
                    <div className="space-y-2">
                      <Label htmlFor="deduction-confidence">
                        Confidence Threshold: {(automationSettings.deduction.confidenceThreshold * 100).toFixed(0)}%
                      </Label>
                      <Input
                        id="deduction-confidence"
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={automationSettings.deduction.confidenceThreshold * 100}
                        onChange={(e) =>
                          updateAutomationSetting('deduction', {
                            confidenceThreshold: parseInt(e.target.value) / 100,
                          })
                        }
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground">
                        Only auto-apply when AI is at least {(automationSettings.deduction.confidenceThreshold * 100).toFixed(0)}% confident
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="deduction-amount">Auto-apply deductions under (EUR)</Label>
                    <Input
                      id="deduction-amount"
                      type="number"
                      value={automationSettings.deduction.amountThreshold}
                      onChange={(e) =>
                        updateAutomationSetting('deduction', {
                          amountThreshold: parseInt(e.target.value),
                        })
                      }
                      placeholder="1000"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoice Generation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice Generation</CardTitle>
                  <CardDescription>
                    Automatically generate invoices from approved time entries
                  </CardDescription>
                </div>
                <Badge variant={automationSettings.invoice.enabled ? 'default' : 'secondary'}>
                  {automationSettings.invoice.mode === 'FULL_AUTO' ? 'Full Auto' :
                   automationSettings.invoice.mode === 'SEMI_AUTO' ? 'Semi Auto' : 'Manual'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="invoice-enabled">Enable Automation</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on AI-powered invoice generation
                  </p>
                </div>
                <Switch
                  id="invoice-enabled"
                  checked={automationSettings.invoice.enabled}
                  onCheckedChange={(checked) =>
                    updateAutomationSetting('invoice', { enabled: checked })
                  }
                />
              </div>

              {automationSettings.invoice.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-mode">Automation Mode</Label>
                    <Select
                      value={automationSettings.invoice.mode}
                      onValueChange={(value) =>
                        updateAutomationSetting('invoice', { mode: value })
                      }
                    >
                      <SelectTrigger id="invoice-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_AUTO">Full Automatic - AI handles everything automatically</SelectItem>
                        <SelectItem value="SEMI_AUTO">Semi-Automatic - AI suggests, you approve</SelectItem>
                        <SelectItem value="MANUAL">Manual - You handle everything</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {automationSettings.invoice.mode === 'FULL_AUTO' && (
                    <div className="space-y-2">
                      <Label htmlFor="invoice-confidence">
                        Confidence Threshold: {(automationSettings.invoice.confidenceThreshold * 100).toFixed(0)}%
                      </Label>
                      <Input
                        id="invoice-confidence"
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={automationSettings.invoice.confidenceThreshold * 100}
                        onChange={(e) =>
                          updateAutomationSetting('invoice', {
                            confidenceThreshold: parseInt(e.target.value) / 100,
                          })
                        }
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground">
                        Only auto-generate when AI is at least {(automationSettings.invoice.confidenceThreshold * 100).toFixed(0)}% confident
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="invoice-amount">Auto-generate invoices under (EUR)</Label>
                    <Input
                      id="invoice-amount"
                      type="number"
                      value={automationSettings.invoice.amountThreshold}
                      onChange={(e) =>
                        updateAutomationSetting('invoice', {
                          amountThreshold: parseInt(e.target.value),
                        })
                      }
                      placeholder="10000"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveAutomation}>
              <Save className="mr-2 h-4 w-4" />
              Save Automation Settings
            </Button>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Manage your connected services and applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{integration.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          integration.status === 'connected'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {integration.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                    {integration.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {integration.lastSync}
                      </p>
                    )}
                  </div>

                  <div>
                    {integration.status === 'connected' ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleDisconnectIntegration(integration.id)
                        }
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          handleConnectIntegration(integration.id)
                        }
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team access and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">Team Management</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invite and manage team members, assign roles and permissions
                  </p>
                </div>
                <Button variant="outline">Manage Team</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
