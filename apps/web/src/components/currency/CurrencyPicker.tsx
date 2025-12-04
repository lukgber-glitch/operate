'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { CurrencyCode } from '@/types/currency';
import {
  getAllCurrencies,
  getCurrenciesByRegion,
  POPULAR_CURRENCIES,
  getCurrency,
} from '@/lib/currency/currency-data';

interface CurrencyPickerProps {
  value?: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CurrencyPicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select currency...',
  className,
}: CurrencyPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const currenciesByRegion = React.useMemo(() => getCurrenciesByRegion(), []);
  const allCurrencies = React.useMemo(() => getAllCurrencies(), []);
  const selectedCurrency = value ? getCurrency(value) : null;

  // Filter currencies based on search
  const filteredCurrencies = React.useMemo(() => {
    if (!searchQuery) return null;

    const query = searchQuery.toLowerCase();
    return allCurrencies.filter(
      (currency) =>
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query)
    );
  }, [searchQuery, allCurrencies]);

  // Popular currencies
  const popularCurrenciesData = React.useMemo(() => {
    return POPULAR_CURRENCIES.map((code) => getCurrency(code)).filter(Boolean);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select currency"
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          {selectedCurrency ? (
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedCurrency.flag}</span>
              <span className="font-medium">{selectedCurrency.code}</span>
              <span className="text-muted-foreground">- {selectedCurrency.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search currency..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No currency found.</CommandEmpty>

          {/* Show filtered results if searching */}
          {filteredCurrencies ? (
            <CommandGroup heading="Search Results">
              {filteredCurrencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={(currentValue) => {
                    onChange(currentValue as CurrencyCode);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === currency.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="mr-2 text-lg">{currency.flag}</span>
                  <span className="font-medium">{currency.code}</span>
                  <span className="ml-2 text-muted-foreground">- {currency.name}</span>
                  <span className="ml-auto text-muted-foreground">{currency.symbol}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <>
              {/* Popular currencies */}
              <CommandGroup heading="Popular">
                {popularCurrenciesData.map((currency) => (
                  <CommandItem
                    key={currency.code}
                    value={currency.code}
                    onSelect={(currentValue) => {
                      onChange(currentValue as CurrencyCode);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === currency.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="mr-2 text-lg">{currency.flag}</span>
                    <span className="font-medium">{currency.code}</span>
                    <span className="ml-2 text-muted-foreground">- {currency.name}</span>
                    <span className="ml-auto text-muted-foreground">{currency.symbol}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Currencies by region */}
              {Object.entries(currenciesByRegion).map(([region, currencies]) => (
                <CommandGroup key={region} heading={region}>
                  {currencies.map((currency) => (
                    <CommandItem
                      key={currency.code}
                      value={currency.code}
                      onSelect={(currentValue) => {
                        onChange(currentValue as CurrencyCode);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === currency.code ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="mr-2 text-lg">{currency.flag}</span>
                      <span className="font-medium">{currency.code}</span>
                      <span className="ml-2 text-muted-foreground">- {currency.name}</span>
                      <span className="ml-auto text-muted-foreground">{currency.symbol}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
