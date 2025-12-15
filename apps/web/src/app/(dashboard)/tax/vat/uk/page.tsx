'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animation-variants';
import { HMRCConnectionStatus } from '@/components/tax/uk/HMRCConnectionStatus';
import { VATObligationsList } from '@/components/tax/uk/VATObligationsList';
import { VATReturnWizard } from '@/components/tax/uk/VATReturnWizard';
import { useHMRCConnection } from '@/hooks/useHMRC';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UKVATPage() {
  const { connection, isLoading } = useHMRCConnection();
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (showWizard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-white font-semibold tracking-tight">File UK VAT Return</h1>
            <p className="text-muted-foreground">Submit your VAT return to HMRC Making Tax Digital</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWizard(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="rounded-[24px]">
          <CardContent className="p-6">
            <VATReturnWizard onComplete={() => setShowWizard(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight flex items-center gap-3">
            UK VAT
            <Badge variant="outline" className="text-xs">
              Making Tax Digital
            </Badge>
          </h1>
          <p className="text-muted-foreground">Manage your UK VAT returns and HMRC connection</p>
        </div>
        <div className="flex gap-2">
          <Link href="/tax/vat">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All VAT
            </Button>
          </Link>
          <Button
            onClick={() => setShowWizard(true)}
            disabled={!connection?.isConnected}
          >
            <FileText className="mr-2 h-4 w-4" />
            File Return
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
      <Card className="rounded-[24px]">
        <CardContent className="p-6">
          <div className="space-y-6">

      {/* HMRC Connection Status */}
      <HMRCConnectionStatus />

      {/* Main Content */}
      {!connection?.isConnected ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>HMRC Connection Required</AlertTitle>
          <AlertDescription>
            You need to connect to HMRC Making Tax Digital before you can file VAT returns
            electronically. Click the "Connect to HMRC" button above to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="obligations">Obligations</TabsTrigger>
            <TabsTrigger value="help">Help & Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>VAT Registration</CardDescription>
                  <CardTitle className="text-2xl text-white">{connection.vrn || 'N/A'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Your VAT registration number
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Organisation</CardDescription>
                  <CardTitle className="text-lg">
                    {connection.organisationName || 'Not set'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Registered with HMRC
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Connection Status</CardDescription>
                  <CardTitle className="text-lg">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Connected to HMRC MTD
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Obligations List */}
            <VATObligationsList />
          </TabsContent>

          <TabsContent value="obligations" className="space-y-6">
            <VATObligationsList />
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About UK VAT Returns</CardTitle>
                <CardDescription>
                  Information about filing VAT returns through Making Tax Digital
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Making Tax Digital (MTD)</h3>
                  <p className="text-sm text-muted-foreground">
                    Making Tax Digital for VAT is a UK government initiative requiring VAT-registered
                    businesses to keep digital records and submit VAT returns using compatible software.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Who needs to use MTD?</h3>
                  <p className="text-sm text-muted-foreground">
                    All VAT-registered businesses must use MTD for VAT, regardless of turnover.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">The 9 VAT Boxes</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Box 1:</strong> VAT due on sales and other outputs</p>
                    <p><strong>Box 2:</strong> VAT due on acquisitions from other EC Member States</p>
                    <p><strong>Box 3:</strong> Total VAT due (sum of boxes 1 and 2)</p>
                    <p><strong>Box 4:</strong> VAT reclaimed on purchases and other inputs</p>
                    <p><strong>Box 5:</strong> Net VAT to be paid or reclaimed (box 3 minus box 4)</p>
                    <p><strong>Box 6:</strong> Total value of sales excluding VAT</p>
                    <p><strong>Box 7:</strong> Total value of purchases excluding VAT</p>
                    <p><strong>Box 8:</strong> Total value of EC goods supplied excluding VAT</p>
                    <p><strong>Box 9:</strong> Total value of EC acquisitions excluding VAT</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Payment Deadlines</h3>
                  <p className="text-sm text-muted-foreground">
                    VAT returns must be filed and payment made within 1 calendar month and 7 days
                    after the end of the VAT period.
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Need Help?</AlertTitle>
                  <AlertDescription>
                    For questions about VAT or Making Tax Digital, visit{' '}
                    <a
                      href="https://www.gov.uk/topic/business-tax/vat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      GOV.UK VAT guidance
                    </a>{' '}
                    or contact HMRC directly.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
