/**
 * ELSTER Data Review Component
 * Shows calculated VAT amounts and transaction breakdown
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Receipt, ShoppingCart, ArrowRight, AlertCircle, Save } from 'lucide-react';
import type { VatReturnPreview } from '@/types/tax';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface DataReviewProps {
  preview: VatReturnPreview;
  onContinue: () => void;
  onBack: () => void;
  onSaveDraft?: () => Promise<void>;
  isLoading?: boolean;
}

export function DataReview({
  preview,
  onContinue,
  onBack,
  onSaveDraft,
  isLoading = false,
}: DataReviewProps) {
  const [showInvoices, setShowInvoices] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    setIsSavingDraft(true);
    try {
      await onSaveDraft();
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Zusammenfassung</CardTitle>
          <CardDescription>
            {preview.periodLabel} • Fälligkeitsdatum: {formatDate(preview.dueDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Output VAT */}
          <div className="flex justify-between items-center py-3 border-b">
            <div className="space-y-1">
              <p className="text-sm font-medium">Umsatzsteuer (Ausgangsleistungen)</p>
              <p className="text-xs text-muted-foreground">
                {preview.outputVat.invoices.length} Rechnungen
              </p>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(preview.outputVat.total)}</p>
          </div>

          {/* Input VAT */}
          <div className="flex justify-between items-center py-3 border-b">
            <div className="space-y-1">
              <p className="text-sm font-medium">Vorsteuer (Eingangsleistungen)</p>
              <p className="text-xs text-muted-foreground">
                {preview.inputVat.expenses.length} Belege
              </p>
            </div>
            <p className="text-lg font-semibold text-green-600">
              -{formatCurrency(preview.inputVat.total)}
            </p>
          </div>

          <Separator />

          {/* Net VAT */}
          <div className="flex justify-between items-center py-3">
            <div className="space-y-1">
              <p className="text-base font-semibold">Zahllast / Erstattung</p>
              <p className="text-xs text-muted-foreground">
                {preview.netVat >= 0 ? 'Zu zahlen an das Finanzamt' : 'Erstattung vom Finanzamt'}
              </p>
            </div>
            <p className={`text-2xl font-bold ${preview.netVat >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {preview.netVat >= 0 ? '' : '+'}{formatCurrency(Math.abs(preview.netVat))}
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-end">
            <Badge variant={preview.status === 'ready' ? 'default' : 'secondary'}>
              {preview.status === 'ready' ? 'Bereit zur Übermittlung' : preview.status === 'draft' ? 'Entwurf' : 'Übermittelt'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Invoices (Output VAT) */}
      <Card>
        <Collapsible open={showInvoices} onOpenChange={setShowInvoices}>
          <CardHeader className="cursor-pointer" onClick={() => setShowInvoices(!showInvoices)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                <CardTitle className="text-lg">Ausgangsrechnungen</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{preview.outputVat.invoices.length}</Badge>
                {showInvoices ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
            <CardDescription>
              Rechnungen mit ausgewiesener Umsatzsteuer
            </CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {preview.outputVat.invoices.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Keine Ausgangsrechnungen für diesen Zeitraum gefunden.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Rechnungsnr.</TableHead>
                      <TableHead className="text-right">Nettobetrag</TableHead>
                      <TableHead className="text-right">USt.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.outputVat.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell className="font-medium">{invoice.customer}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.invoiceNumber || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.vat)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Expenses (Input VAT) */}
      <Card>
        <Collapsible open={showExpenses} onOpenChange={setShowExpenses}>
          <CardHeader className="cursor-pointer" onClick={() => setShowExpenses(!showExpenses)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <CardTitle className="text-lg">Eingangsrechnungen</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{preview.inputVat.expenses.length}</Badge>
                {showExpenses ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
            <CardDescription>
              Belege mit abziehbarer Vorsteuer
            </CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {preview.inputVat.expenses.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Keine Eingangsrechnungen für diesen Zeitraum gefunden.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Lieferant</TableHead>
                      <TableHead>Referenz</TableHead>
                      <TableHead className="text-right">Nettobetrag</TableHead>
                      <TableHead className="text-right">Vorsteuer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.inputVat.expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell className="font-medium">{expense.vendor}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {expense.reference || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(expense.vat)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Zurück
        </Button>
        <div className="flex gap-2">
          {onSaveDraft && (
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingDraft ? 'Speichern...' : 'Als Entwurf speichern'}
            </Button>
          )}
          <Button onClick={onContinue} disabled={isLoading} size="lg">
            Weiter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
