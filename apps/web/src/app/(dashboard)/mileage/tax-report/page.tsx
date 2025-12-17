'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Printer, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { useMileageTaxReport } from '@/hooks/use-mileage';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

export default function MileageTaxReportPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { report, fetchReport, exportReport, isLoading } = useMileageTaxReport(selectedYear);

  useEffect(() => {
    fetchReport();
  }, [selectedYear, fetchReport]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    await exportReport('pdf');
  };

  const handleExportCSV = async () => {
    await exportReport('csv');
  };

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/mileage">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl text-white font-semibold tracking-tight">Tax Report</h1>
            <p className="text-white/70">Mileage deduction summary for tax filing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={fadeUp} className="flex gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button variant="outline" onClick={handleExportCSV}>
          <FileText className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-white/70">Loading report...</p>
          </div>
        </div>
      ) : !report ? (
        <div className="text-center py-12">
          <p className="text-white/50">No data available for {selectedYear}</p>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          <motion.div variants={fadeUp}>
            <GlassCard className="rounded-[16px] p-6 print:shadow-none print:border print:border-gray-300">
              <div className="mb-6 print:mb-4">
                <h2 className="text-xl font-semibold text-white print:text-black mb-2">
                  Mileage Tax Report - {selectedYear}
                </h2>
                <p className="text-sm text-white/70 print:text-gray-600">
                  IRS/Tax Authority Compliant Log
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5 print:bg-gray-50">
                  <p className="text-sm text-white/70 print:text-gray-600 mb-1">Total Trips</p>
                  <p className="text-2xl font-bold text-white print:text-black">
                    {report.totalTrips}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 print:bg-gray-50">
                  <p className="text-sm text-white/70 print:text-gray-600 mb-1">Total Distance</p>
                  <p className="text-2xl font-bold text-white print:text-black">
                    {report.totalDistance.toLocaleString()} {report.distanceUnit}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 print:bg-gray-50 md:col-span-2">
                  <p className="text-sm text-white/70 print:text-gray-600 mb-1">
                    Total Deductible Amount
                  </p>
                  <p className="text-3xl font-bold text-white print:text-black">
                    <CurrencyDisplay
                      amount={report.totalDeductible}
                      currency={report.currency as CurrencyCode}
                    />
                  </p>
                </div>
              </div>

              {/* By Vehicle Type */}
              {report.byVehicleType && report.byVehicleType.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white print:text-black mb-3">
                    By Vehicle Type
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {report.byVehicleType.map((item) => (
                      <div
                        key={item.type}
                        className="p-3 rounded-lg bg-white/5 print:bg-gray-50 print:border print:border-gray-300"
                      >
                        <p className="text-xs text-white/70 print:text-gray-600 uppercase">
                          {item.type}
                        </p>
                        <p className="text-sm font-semibold text-white print:text-black">
                          {item.trips} trips · {item.distance} {report.distanceUnit}
                        </p>
                        <p className="text-sm text-white/70 print:text-gray-600">
                          <CurrencyDisplay amount={item.amount} currency={report.currency as CurrencyCode} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Detailed Log */}
          <motion.div variants={fadeUp}>
            <GlassCard className="rounded-[16px] print:shadow-none print:border print:border-gray-300">
              <div className="p-6 print:p-4">
                <h3 className="text-lg font-semibold text-white print:text-black mb-4">
                  Detailed Mileage Log
                </h3>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="print:border-gray-300">
                        <TableHead className="print:text-black">Date</TableHead>
                        <TableHead className="print:text-black">Purpose</TableHead>
                        <TableHead className="print:text-black">From</TableHead>
                        <TableHead className="print:text-black">To</TableHead>
                        <TableHead className="print:text-black">Distance</TableHead>
                        <TableHead className="print:text-black">Vehicle</TableHead>
                        <TableHead className="print:text-black">Rate</TableHead>
                        <TableHead className="text-right print:text-black">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.entries.map((entry, index) => (
                        <TableRow key={index} className="print:border-gray-300">
                          <TableCell className="print:text-black">
                            {formatDate(entry.date)}
                          </TableCell>
                          <TableCell className="print:text-black max-w-[200px]">
                            {entry.purpose}
                          </TableCell>
                          <TableCell className="print:text-black">{entry.from}</TableCell>
                          <TableCell className="print:text-black">{entry.to}</TableCell>
                          <TableCell className="print:text-black">
                            {entry.distance} {report.distanceUnit}
                          </TableCell>
                          <TableCell className="print:text-black">
                            {entry.vehicleType}
                          </TableCell>
                          <TableCell className="print:text-black">
                            ${entry.rate.toFixed(3)}
                          </TableCell>
                          <TableCell className="text-right print:text-black">
                            <CurrencyDisplay
                              amount={entry.amount}
                              currency={report.currency as CurrencyCode}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="print:border-gray-300">
                        <TableCell colSpan={4} className="font-bold print:text-black">
                          Total
                        </TableCell>
                        <TableCell className="font-bold print:text-black">
                          {report.totalDistance} {report.distanceUnit}
                        </TableCell>
                        <TableCell colSpan={2} />
                        <TableCell className="text-right font-bold print:text-black">
                          <CurrencyDisplay
                            amount={report.totalDeductible}
                            currency={report.currency as CurrencyCode}
                          />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-white/5 print:bg-gray-50 print:border print:border-gray-300">
                  <p className="text-xs text-white/70 print:text-gray-600">
                    <strong>Note:</strong> This report is prepared for tax purposes based on the
                    IRS standard mileage rate. Please consult with your tax advisor to ensure
                    compliance with current tax regulations. Keep this log and all supporting
                    documentation for at least 7 years.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
