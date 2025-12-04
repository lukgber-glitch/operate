'use client';

import { VATCalculation } from '@/hooks/useHMRC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface VATCalculationBreakdownProps {
  calculation: VATCalculation;
}

export function VATCalculationBreakdown({ calculation }: VATCalculationBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const totalSales = calculation.breakdown.salesByRate.reduce(
    (sum, item) => sum + item.vatAmount,
    0
  );
  const totalPurchases = calculation.breakdown.purchasesByRate.reduce(
    (sum, item) => sum + item.vatAmount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              VAT on Sales
            </CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(calculation.vatDueSales)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Box 1: VAT charged to customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              VAT on Purchases
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(calculation.vatReclaimedCurrPeriod)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Box 4: VAT reclaimed on purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net VAT</CardDescription>
            <CardTitle className={`text-2xl ${calculation.netVatDue >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(calculation.netVatDue))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {calculation.netVatDue >= 0 ? 'Amount to pay' : 'Amount to reclaim'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Sales VAT Breakdown</CardTitle>
          <CardDescription>VAT charged by rate category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead className="text-right">VAT Amount</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculation.breakdown.salesByRate.map((item, index) => {
                const percentage = totalSales > 0 ? (item.vatAmount / totalSales) * 100 : 0;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline">{item.rate}%</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.netAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.vatAmount)}
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={percentage} className="w-16 h-2" />
                        <span className="text-sm">{percentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(calculation.totalValueSalesExVAT)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(totalSales)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {calculation.breakdown.salesByRate.reduce((sum, item) => sum + item.count, 0)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Purchases Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Purchases VAT Breakdown</CardTitle>
          <CardDescription>VAT reclaimed by rate category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead className="text-right">VAT Amount</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculation.breakdown.purchasesByRate.map((item, index) => {
                const percentage = totalPurchases > 0 ? (item.vatAmount / totalPurchases) * 100 : 0;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline">{item.rate}%</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.netAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.vatAmount)}
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={percentage} className="w-16 h-2" />
                        <span className="text-sm">{percentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(calculation.totalValuePurchasesExVAT)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(totalPurchases)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {calculation.breakdown.purchasesByRate.reduce((sum, item) => sum + item.count, 0)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EC Trade Summary (if applicable) */}
      {(calculation.vatDueAcquisitions > 0 ||
        calculation.totalValueGoodsSuppliedExVAT > 0 ||
        calculation.totalAcquisitionsExVAT > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>EC Trade Summary</CardTitle>
            <CardDescription>EC acquisitions and supplies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">VAT due on EC acquisitions</p>
                  <p className="text-xs text-muted-foreground">Box 2</p>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(calculation.vatDueAcquisitions)}</p>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">EC goods supplied (excl. VAT)</p>
                  <p className="text-xs text-muted-foreground">Box 8</p>
                </div>
                <p className="text-lg font-semibold">
                  {formatCurrency(calculation.totalValueGoodsSuppliedExVAT)}
                </p>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">EC acquisitions (excl. VAT)</p>
                  <p className="text-xs text-muted-foreground">Box 9</p>
                </div>
                <p className="text-lg font-semibold">
                  {formatCurrency(calculation.totalAcquisitionsExVAT)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
