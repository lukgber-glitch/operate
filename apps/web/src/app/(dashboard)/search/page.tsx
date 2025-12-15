'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import {
  Building2,
  FileText,
  Mail,
  Receipt,
  Search as SearchIcon,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'invoice' | 'customer' | 'transaction' | 'document' | 'email';
  metadata?: Record<string, any>;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Invoice #INV-2024-001',
    description: 'Acme Corporation - EUR 1,250.00 - Due Dec 15, 2024',
    type: 'invoice',
    metadata: { amount: 1250, status: 'sent' },
  },
  {
    id: '2',
    title: 'Acme Corporation',
    description: 'Customer since Jan 2023 - 15 invoices - EUR 25,450 total',
    type: 'customer',
    metadata: { invoiceCount: 15 },
  },
  {
    id: '3',
    title: 'Bank Transfer - Deutsche Bank',
    description: 'EUR 1,250.00 received on Dec 10, 2024',
    type: 'transaction',
    metadata: { amount: 1250, date: '2024-12-10' },
  },
  {
    id: '4',
    title: 'November 2024 Financial Report',
    description: 'Monthly summary and analysis - Generated on Dec 1, 2024',
    type: 'document',
    metadata: { fileType: 'PDF' },
  },
  {
    id: '5',
    title: 'Invoice #INV-2024-098',
    description: 'TechStart GmbH - EUR 890.50 - Overdue',
    type: 'invoice',
    metadata: { amount: 890.5, status: 'overdue' },
  },
  {
    id: '6',
    title: 'RE: Payment Confirmation',
    description: 'Email from john@acme.com - Received Dec 8, 2024',
    type: 'email',
    metadata: { from: 'john@acme.com' },
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | SearchResult['type']>('all');

  const filteredResults = mockResults.filter((result) => {
    const matchesFilter = filter === 'all' || result.type === filter;
    const matchesQuery =
      query === '' ||
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase());

    return matchesFilter && matchesQuery;
  });

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'invoice':
        return <Receipt className="h-5 w-5" />;
      case 'customer':
        return <Users className="h-5 w-5" />;
      case 'transaction':
        return <Building2 className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'customer':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'transaction':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'document':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'email':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
    }
  };

  const resultCounts = {
    all: mockResults.length,
    invoice: mockResults.filter((r) => r.type === 'invoice').length,
    customer: mockResults.filter((r) => r.type === 'customer').length,
    transaction: mockResults.filter((r) => r.type === 'transaction').length,
    document: mockResults.filter((r) => r.type === 'document').length,
    email: mockResults.filter((r) => r.type === 'email').length,
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-white/70">
          Search across invoices, customers, transactions, and documents
        </p>
      </motion.div>

      {/* Search Input */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="lg">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
            <Input
              placeholder="Search for invoices, customers, transactions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-base h-12"
            />
          </div>
      </GlassCard>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp}>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {resultCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invoice">
            Invoices
            <Badge variant="secondary" className="ml-2">
              {resultCounts.invoice}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="customer">
            Customers
            <Badge variant="secondary" className="ml-2">
              {resultCounts.customer}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="transaction">
            Transactions
            <Badge variant="secondary" className="ml-2">
              {resultCounts.transaction}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="document">
            Documents
            <Badge variant="secondary" className="ml-2">
              {resultCounts.document}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="email">
            Emails
            <Badge variant="secondary" className="ml-2">
              {resultCounts.email}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      </motion.div>

      {/* Results */}
      <motion.div variants={fadeUp}>
        <p className="text-sm text-white/70 mb-4">
          {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
        </p>

        {filteredResults.length === 0 ? (
          <GlassCard padding="lg">
            <div className="flex flex-col items-center justify-center py-16">
              <SearchIcon className="h-16 w-16 text-white/35" />
              <h3 className="mt-4 text-lg font-semibold">No results found</h3>
              <p className="mt-2 text-sm text-white/70">
                {query
                  ? `No results for "${query}". Try different keywords.`
                  : 'Try searching for invoices, customers, or transactions.'}
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredResults.map((result) => (
              <GlassCard
                key={result.id}
                className="rounded-[24px] transition-all hover:shadow-md cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-md bg-primary/10">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <CardTitle className="text-base font-semibold">
                          {result.title}
                        </CardTitle>
                        <Badge className={getTypeColor(result.type)}>
                          {result.type}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {result.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </GlassCard>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
