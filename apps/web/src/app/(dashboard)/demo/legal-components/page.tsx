'use client';

import { useState } from 'react';
import { AIDisclaimerBanner } from '@/components/chat/AIDisclaimerBanner';
import { BankConnectionDisclaimer } from '@/components/banking/BankConnectionDisclaimer';
import { CookieConsent } from '@/components/legal/CookieConsent';
import { FirstTimeConsent } from '@/components/legal/FirstTimeConsent';
import { TaxFilingWarning } from '@/components/tax/TaxFilingWarning';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code } from 'lucide-react';

export default function LegalComponentsDemo() {
  const [showConsent, setShowConsent] = useState(false);
  const [showTaxWarning, setShowTaxWarning] = useState(false);
  const [showCookies, setShowCookies] = useState(false);

  const resetAIDisclaimer = () => {
    localStorage.removeItem('ai-disclaimer-dismissed');
    window.location.reload();
  };

  const resetCookieConsent = () => {
    localStorage.removeItem('cookie-consent');
    setShowCookies(false);
    setTimeout(() => setShowCookies(true), 100);
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Legal Components Demo</h1>
        <p className="text-muted-foreground text-lg">
          Interactive showcase of all legal notification components
        </p>
      </div>

      <Tabs defaultValue="ai-disclaimer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="ai-disclaimer">AI Disclaimer</TabsTrigger>
          <TabsTrigger value="consent">First Consent</TabsTrigger>
          <TabsTrigger value="tax">Tax Warning</TabsTrigger>
          <TabsTrigger value="bank">Bank Info</TabsTrigger>
          <TabsTrigger value="cookies">Cookies</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* AI Disclaimer Banner */}
        <TabsContent value="ai-disclaimer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Disclaimer Banner</CardTitle>
              <CardDescription>
                Dismissible banner shown on chat page. Persists dismissal for 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Preview:</h3>
                <AIDisclaimerBanner />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Actions:</h3>
                <Button onClick={resetAIDisclaimer} variant="outline">
                  Reset Dismissal (Reload Page)
                </Button>
              </div>

              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="font-semibold">Usage:</span>
                </div>
                <pre className="overflow-x-auto">
{`import { AIDisclaimerBanner } from '@/components/chat/AIDisclaimerBanner';

<AIDisclaimerBanner />`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* First-Time Consent */}
        <TabsContent value="consent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>First-Time Consent Modal</CardTitle>
              <CardDescription>
                Shown on first login. Requires consent to terms, privacy policy, and AI disclaimer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Preview:</h3>
                <Button onClick={() => setShowConsent(true)}>
                  Show Consent Modal
                </Button>
              </div>

              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="font-semibold">Usage:</span>
                </div>
                <pre className="overflow-x-auto">
{`import { FirstTimeConsent } from '@/components/legal/FirstTimeConsent';

const [showConsent, setShowConsent] = useState(false);

<FirstTimeConsent
  isOpen={showConsent}
  onConsent={() => setShowConsent(false)}
/>`}
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Features:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Three required checkboxes</li>
                  <li>Cannot close without consent</li>
                  <li>Saves consent timestamp to user profile</li>
                  <li>Links to legal pages</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Filing Warning */}
        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Filing Warning</CardTitle>
              <CardDescription>
                Shown before tax filing actions. Requires acknowledgment of responsibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Preview:</h3>
                <Button onClick={() => setShowTaxWarning(true)}>
                  Show Tax Warning
                </Button>
              </div>

              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="font-semibold">Usage:</span>
                </div>
                <pre className="overflow-x-auto">
{`import { TaxFilingWarning } from '@/components/tax/TaxFilingWarning';

<TaxFilingWarning
  isOpen={showWarning}
  onCancel={() => setShowWarning(false)}
  onProceed={() => {
    // User acknowledged, proceed with filing
  }}
/>`}
                </pre>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Important:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Cannot proceed without checking acknowledgment</li>
                  <li>Clear disclaimer language</li>
                  <li>Professional warning about responsibility</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Connection Disclaimer */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Connection Disclaimer</CardTitle>
              <CardDescription>
                Security information shown before connecting bank accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Preview - TrueLayer (EU/UK):</h3>
                <BankConnectionDisclaimer provider="TrueLayer" />

                <h3 className="font-semibold mt-6">Preview - Tink (Europe):</h3>
                <BankConnectionDisclaimer provider="Tink" />

                <h3 className="font-semibold mt-6">Preview - Plaid (US):</h3>
                <BankConnectionDisclaimer provider="Plaid" />
              </div>

              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="font-semibold">Usage:</span>
                </div>
                <pre className="overflow-x-auto">
{`import { BankConnectionDisclaimer } from '@/components/banking/BankConnectionDisclaimer';

<BankConnectionDisclaimer provider="TrueLayer" />
<BankConnectionDisclaimer provider="Tink" />
<BankConnectionDisclaimer provider="Plaid" />`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cookie Consent */}
        <TabsContent value="cookies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cookie Consent Banner</CardTitle>
              <CardDescription>
                GDPR-compliant cookie consent with customization options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Preview:</h3>
                <Button onClick={resetCookieConsent}>
                  Show Cookie Banner
                </Button>
                {showCookies && <CookieConsent />}
              </div>

              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="font-semibold">Usage:</span>
                </div>
                <pre className="overflow-x-auto">
{`import { CookieConsent } from '@/components/legal/CookieConsent';

// In root layout
<body>
  {children}
  <CookieConsent />
</body>`}
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Cookie Categories:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong>Necessary</strong> - Required, always enabled</li>
                  <li><strong>Functional</strong> - Optional, personalization</li>
                  <li><strong>Analytics</strong> - Optional, usage tracking</li>
                  <li><strong>Marketing</strong> - Optional, advertising</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Footer</CardTitle>
              <CardDescription>
                Footer with legal links, quick links, and brand information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Preview:</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Footer />
                </div>
              </div>

              <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="font-semibold">Usage:</span>
                </div>
                <pre className="overflow-x-auto">
{`import { Footer } from '@/components/layout/Footer';

// In layout
<main>{children}</main>
<Footer />`}
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Includes:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div>
                    <strong>Legal Links:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Terms of Service</li>
                      <li>Privacy Policy</li>
                      <li>Cookie Policy</li>
                      <li>AI Disclaimer</li>
                      <li>Impressum</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Quick Links:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>About</li>
                      <li>Contact</li>
                      <li>Help Center</li>
                      <li>Status</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <FirstTimeConsent
        isOpen={showConsent}
        onConsent={() => {
          setShowConsent(false);
          alert('Consent saved! (Demo mode - not actually saved to API)');
        }}
      />

      <TaxFilingWarning
        isOpen={showTaxWarning}
        onCancel={() => setShowTaxWarning(false)}
        onProceed={() => {
          setShowTaxWarning(false);
          alert('User acknowledged tax filing responsibility! (Demo mode)');
        }}
      />
    </div>
  );
}
