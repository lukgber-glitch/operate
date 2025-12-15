'use client';

import { Plus, Download, Search, Filter, Check } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/table';
import { useMileageEntries } from '@/hooks/use-mileage';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

const vehicleColors = {
  CAR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MOTORCYCLE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  BICYCLE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ELECTRIC: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function MileageEntriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [reimbursedFilter, setReimbursedFilter] = useState<string>('');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    entries,
    total,
    isLoading,
    error,
    fetchEntries,
    totalPages,
    bulkMarkAsReimbursed,
  } = useMileageEntries({
    page: currentPage,
    pageSize,
    vehicleType: vehicleTypeFilter || undefined,
    search: searchTerm || undefined,
    reimbursed: reimbursedFilter === '' ? undefined : reimbursedFilter === 'true',
  });

  useEffect(() => {
    fetchEntries({
      page: currentPage,
      pageSize,
      vehicleType: vehicleTypeFilter || undefined,
      search: searchTerm || undefined,
      reimbursed: reimbursedFilter === '' ? undefined : reimbursedFilter === 'true',
    });
  }, [currentPage, pageSize, vehicleTypeFilter, searchTerm, reimbursedFilter, fetchEntries]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleEntry = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(entries.map((e) => e.id));
    }
  };

  const handleBulkReimburse = async () => {
    try {
      await bulkMarkAsReimbursed(selectedEntries);
      setSelectedEntries([]);
      fetchEntries({
        page: currentPage,
        pageSize,
        vehicleType: vehicleTypeFilter || undefined,
        search: searchTerm || undefined,
        reimbursed: reimbursedFilter === '' ? undefined : reimbursedFilter === 'true',
      });
    } catch (error) {
      console.error('Failed to mark entries as reimbursed:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export to CSV');
  };

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl text-white font-semibold tracking-tight">Mileage Entries</h1>
        <p className="text-white/70">All mileage tracking records</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export for Tax
        </Button>
        <Button asChild>
          <Link href="/mileage/new">
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Link>
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="lg">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <Input
                  placeholder="Search by purpose or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Vehicles</SelectItem>
                  <SelectItem value="CAR">Car</SelectItem>
                  <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                  <SelectItem value="BICYCLE">Bicycle</SelectItem>
                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reimbursedFilter} onValueChange={setReimbursedFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Reimbursed status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Entries</SelectItem>
                  <SelectItem value="true">Reimbursed</SelectItem>
                  <SelectItem value="false">Not Reimbursed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedEntries.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/70">
                  {selectedEntries.length} selected
                </span>
                <Button size="sm" onClick={handleBulkReimburse}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Reimbursed
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Entries Table */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-white/70">Loading entries...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => fetchEntries({
                    page: currentPage,
                    pageSize,
                    vehicleType: vehicleTypeFilter || undefined,
                    search: searchTerm || undefined,
                    reimbursed: reimbursedFilter === '' ? undefined : reimbursedFilter === 'true',
                  })}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-6 pt-6">
                <p className="text-sm text-white/70">
                  Showing {entries.length} of {total} entries
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/70">
                    Rows per page:
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedEntries.length === entries.length && entries.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-white/70"
                      >
                        No entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEntries.includes(entry.id)}
                            onCheckedChange={() => toggleEntry(entry.id)}
                          />
                        </TableCell>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {entry.purpose}
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <span className="truncate block">
                            {entry.startLocation} → {entry.endLocation}
                          </span>
                        </TableCell>
                        <TableCell>
                          {entry.distance} {entry.distanceUnit}
                          {entry.roundTrip && (
                            <Badge variant="outline" className="ml-2 text-xs">RT</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <CurrencyDisplay
                            amount={entry.amount}
                            currency={entry.currency as CurrencyCode}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={vehicleColors[entry.vehicleType]}
                          >
                            {entry.vehicleType.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.reimbursed ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Reimbursed
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/mileage/${entry.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-6 pb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
