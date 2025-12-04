'use client';

import * as React from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Currency, ExchangeRate } from '@/types/currency';
import { CurrencyDisplay } from './CurrencyDisplay';

type SortField = 'code' | 'name' | 'rate';
type SortDirection = 'asc' | 'desc';

interface CurrencyListProps {
  currencies: Currency[];
  rates?: ExchangeRate[];
  baseCurrency?: string;
  onCurrencyClick?: (currency: Currency) => void;
  className?: string;
  showRates?: boolean;
}

export function CurrencyList({
  currencies,
  rates = [],
  baseCurrency,
  onCurrencyClick,
  className,
  showRates = false,
}: CurrencyListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortField, setSortField] = React.useState<SortField>('code');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');

  // Create rate lookup map
  const rateMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    rates.forEach((rate) => {
      map[rate.to] = rate.rate;
    });
    return map;
  }, [rates]);

  // Filter currencies
  const filteredCurrencies = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return currencies.filter(
      (currency) =>
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query)
    );
  }, [currencies, searchQuery]);

  // Sort currencies
  const sortedCurrencies = React.useMemo(() => {
    const sorted = [...filteredCurrencies];

    sorted.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortField === 'rate') {
        aVal = rateMap[a.code] ?? 0;
        bVal = rateMap[b.code] ?? 0;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredCurrencies, sortField, sortDirection, rateMap]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 gap-1 px-2"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search currencies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Flag</TableHead>
              <TableHead>
                <SortButton field="code">Code</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="name">Name</SortButton>
              </TableHead>
              <TableHead>Symbol</TableHead>
              {showRates && baseCurrency && (
                <TableHead className="text-right">
                  <SortButton field="rate">Rate (vs {baseCurrency})</SortButton>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCurrencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showRates ? 5 : 4} className="text-center text-muted-foreground">
                  No currencies found
                </TableCell>
              </TableRow>
            ) : (
              sortedCurrencies.map((currency) => (
                <TableRow
                  key={currency.code}
                  className={cn(
                    onCurrencyClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => onCurrencyClick?.(currency)}
                >
                  <TableCell className="text-2xl">{currency.flag}</TableCell>
                  <TableCell className="font-medium">{currency.code}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell className="text-muted-foreground">{currency.symbol}</TableCell>
                  {showRates && baseCurrency && (
                    <TableCell className="text-right font-mono">
                      {rateMap[currency.code]
                        ? rateMap[currency.code].toFixed(6)
                        : '-'}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedCurrencies.length} of {currencies.length} currencies
      </div>
    </div>
  );
}
