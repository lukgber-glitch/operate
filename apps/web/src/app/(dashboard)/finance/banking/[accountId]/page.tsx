'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Filter, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

// Placeholder data
const accountData = {
  id: '1',
  accountName: 'Business Checking',
  accountNumber: '****4567',
  bankName: 'Deutsche Bank',
  balance: 45230.5,
  currency: 'EUR',
  isPrimary: true,
  type: 'Checking',
  iban: 'DE89 3704 0044 0532 0130 00',
  bic: 'COBADEFFXXX',
};

const transactions = [
  {
    id: '1',
    date: '2024-11-28',
    description: 'Payment from Acme Corp - Invoice INV-2024-001',
    amount: 5250.0,
    type: 'credit',
    category: 'Revenue',
    reconciled: true,
    reference: 'INV-2024-001',
  },
  {
    id: '2',
    date: '2024-11-27',
    description: 'Office Rent - November',
    amount: -2500.0,
    type: 'debit',
    category: 'Rent',
    reconciled: true,
    reference: 'EXP-005',
  },
  {
    id: '3',
    date: '2024-11-26',
    description: 'Supplier Payment - Tech Supplies GmbH',
    amount: -1250.75,
    type: 'debit',
    category: 'Supplies',
    reconciled: false,
    reference: null,
  },
  {
    id: '4',
    date: '2024-11-25',
    description: 'Payroll Transfer',
    amount: -15000.0,
    type: 'debit',
    category: 'Payroll',
    reconciled: true,
    reference: null,
  },
  {
    id: '5',
    date: '2024-11-24',
    description: 'Payment from Tech Solutions GmbH',
    amount: 3800.0,
    type: 'credit',
    category: 'Revenue',
    reconciled: false,
    reference: 'INV-2024-002',
  },
  {
    id: '6',
    date: '2024-11-23',
    description: 'Software License - Adobe CC',
    amount: -599.0,
    type: 'debit',
    category: 'Software',
    reconciled: true,
    reference: 'EXP-003',
  },
  {
    id: '7',
    date: '2024-11-22',
    description: 'Bank Fee',
    amount: -12.5,
    type: 'debit',
    category: 'Bank Fees',
    reconciled: true,
    reference: null,
  },
  {
    id: '8',
    date: '2024-11-21',
    description: 'Payment from Digital Services Ltd',
    amount: 2150.0,
    type: 'credit',
    category: 'Revenue',
    reconciled: false,
    reference: 'INV-2024-003',
  },
];

const categoryColors: Record<string, string> = {
  Revenue: 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400',
  Rent: 'border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-400',
  Supplies: 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400',
  Payroll: 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400',
  Software: 'border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-400',
  'Bank Fees': 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400',
};

export default function AccountTransactionsPage({
  params: _params,
}: {
  params: { accountId: string };
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reconciledFilter, setReconciledFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch = txn.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || txn.category === categoryFilter;
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesReconciled =
      reconciledFilter === 'all' ||
      (reconciledFilter === 'reconciled' ? txn.reconciled : !txn.reconciled);
    return matchesSearch && matchesCategory && matchesType && matchesReconciled;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + pageSize
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(Math.abs(amount));
  };

  const toggleTransaction = (id: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedTransactions.length === displayedTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(displayedTransactions.map((t) => t.id));
    }
  };

  const handleReconcile = () => {
    console.log('Reconciling transactions:', selectedTransactions);
    setSelectedTransactions([]);
  };

  const handleCategorize = (category: string) => {
    console.log('Categorizing transactions:', selectedTransactions, category);
    setSelectedTransactions([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/finance/banking">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {accountData.accountName}
            </h1>
            <p className="text-muted-foreground">{accountData.bankName}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(accountData.balance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono">{accountData.iban}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              BIC/SWIFT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono">{accountData.bic}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{accountData.type}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Payroll">Payroll</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Bank Fees">Bank Fees</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={reconciledFilter}
                onValueChange={setReconciledFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Reconciliation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="reconciled">Reconciled</SelectItem>
                  <SelectItem value="unreconciled">Unreconciled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedTransactions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedTransactions.length} selected
                </span>
                <Button size="sm" onClick={handleReconcile}>
                  Mark Reconciled
                </Button>
                <Select onValueChange={handleCategorize}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Assign category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Revenue">Revenue</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Payroll">Payroll</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-6 pt-6">
              <p className="text-sm text-muted-foreground">
                Showing {displayedTransactions.length} of{' '}
                {filteredTransactions.length} transactions
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
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
                      checked={
                        selectedTransactions.length ===
                        displayedTransactions.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.includes(txn.id)}
                          onCheckedChange={() => toggleTransaction(txn.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{txn.date}</TableCell>
                      <TableCell>{txn.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            categoryColors[txn.category] || 'border-gray-200'
                          }
                        >
                          {txn.category}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          txn.type === 'credit'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {txn.type === 'credit' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </TableCell>
                      <TableCell>
                        {txn.reconciled ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Reconciled
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {txn.reference ? (
                          <Link
                            href={`/finance/${
                              txn.reference.startsWith('INV')
                                ? 'invoices'
                                : 'expenses'
                            }/${txn.reference}`}
                            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {txn.reference}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
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
        </CardContent>
      </Card>
    </div>
  );
}
