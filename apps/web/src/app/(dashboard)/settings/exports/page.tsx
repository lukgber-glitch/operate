'use client';

import { motion } from 'framer-motion';
import { FileSpreadsheet, Info } from 'lucide-react';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportWizard } from './components/export-wizard';
import { ExportHistory } from './components/export-history';

export default function ExportsPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold mb-2">Compliance Exports</h1>
        <p className="text-white/70">
          Export your financial data for accounting software and tax authorities
        </p>
      </motion.div>

      {/* Info Alert */}
      <motion.div variants={fadeUp}>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>About Compliance Exports</AlertTitle>
          <AlertDescription>
            Generate exports in various formats for your accounting software and tax compliance needs.
            All exports include audit trails and comply with local regulations (GoBD, SAF-T, etc.).
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Create Export
          </TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <GlassCard>
            <CardHeader>
              <CardTitle>Export Wizard</CardTitle>
              <CardDescription>
                Follow the steps to create a new compliance export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportWizard />
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ExportHistory />
        </TabsContent>
        </Tabs>
      </motion.div>

      {/* Format Information Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base">DATEV</CardTitle>
            <CardDescription className="text-sm">German Standard</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            <ul className="list-disc list-inside space-y-1">
              <li>ASCII CSV format</li>
              <li>SKR03/SKR04 support</li>
              <li>DATEV Unternehmen Online compatible</li>
              <li>GoBD compliant</li>
            </ul>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base">SAF-T</CardTitle>
            <CardDescription className="text-sm">OECD Standard</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            <ul className="list-disc list-inside space-y-1">
              <li>XML format</li>
              <li>International & country variants</li>
              <li>Complete audit file</li>
              <li>Tax authority approved</li>
            </ul>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base">BMD</CardTitle>
            <CardDescription className="text-sm">Austrian Standard</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            <ul className="list-disc list-inside space-y-1">
              <li>CSV format</li>
              <li>BMD NTCS compatible</li>
              <li>EKR/BAB frameworks</li>
              <li>Austrian tax compliant</li>
            </ul>
          </CardContent>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
