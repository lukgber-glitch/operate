'use client';

import { FileSpreadsheet, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedCard } from '@/components/ui/animated-card';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import { ExportWizard } from './components/export-wizard';
import { ExportHistory } from './components/export-history';

export default function ExportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Compliance Exports</h1>
        <p className="text-muted-foreground">
          Export your financial data for accounting software and tax authorities
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>About Compliance Exports</AlertTitle>
        <AlertDescription>
          Generate exports in various formats for your accounting software and tax compliance needs.
          All exports include audit trails and comply with local regulations (GoBD, SAF-T, etc.).
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Create Export
          </TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Wizard</CardTitle>
              <CardDescription>
                Follow the steps to create a new compliance export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportWizard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ExportHistory />
        </TabsContent>
      </Tabs>

      {/* Format Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DATEV</CardTitle>
            <CardDescription className="text-sm">German Standard</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>ASCII CSV format</li>
              <li>SKR03/SKR04 support</li>
              <li>DATEV Unternehmen Online compatible</li>
              <li>GoBD compliant</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SAF-T</CardTitle>
            <CardDescription className="text-sm">OECD Standard</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>XML format</li>
              <li>International & country variants</li>
              <li>Complete audit file</li>
              <li>Tax authority approved</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">BMD</CardTitle>
            <CardDescription className="text-sm">Austrian Standard</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>CSV format</li>
              <li>BMD NTCS compatible</li>
              <li>EKR/BAB frameworks</li>
              <li>Austrian tax compliant</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
