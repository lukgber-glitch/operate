'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencyPicker } from './CurrencyPicker';
import { CurrencyDisplay } from './CurrencyDisplay';
import { CurrencyInput } from './CurrencyInput';
import { CurrencyConverter } from './CurrencyConverter';
import { MultiCurrencyAmount } from './MultiCurrencyAmount';
import { ExchangeRateDisplay } from './ExchangeRateDisplay';
import { CurrencyList } from './CurrencyList';
import type { CurrencyCode } from '@/types/currency';
import { getAllCurrencies } from '@/lib/currency/currency-data';
import { useExchangeRates } from '@/hooks/use-exchange-rates';

/**
 * Demo/Example component showcasing all currency components
 * Can be used for testing, documentation, or as a reference
 */
export function CurrencyDemo() {
  const [selectedCurrency, setSelectedCurrency] = React.useState<CurrencyCode>('USD');
  const [amount, setAmount] = React.useState<number>(1000);
  const [baseCurrency] = React.useState<CurrencyCode>('USD');

  const { rates, loading } = useExchangeRates(baseCurrency);
  const allCurrencies = React.useMemo(() => getAllCurrencies(), []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Multi-Currency Components Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive showcase of all currency UI components
        </p>
      </div>

      <Tabs defaultValue="picker" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="picker">Picker & Input</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="converter">Converter</TabsTrigger>
          <TabsTrigger value="list">List & Rates</TabsTrigger>
        </TabsList>

        {/* Tab 1: Picker & Input */}
        <TabsContent value="picker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currency Picker</CardTitle>
              <CardDescription>
                Searchable dropdown with region grouping and popular currencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CurrencyPicker
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                placeholder="Select a currency..."
              />
              <div className="text-sm text-muted-foreground">
                Selected: {selectedCurrency}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Input</CardTitle>
              <CardDescription>
                Number input with currency formatting and validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                currency={selectedCurrency}
                placeholder="Enter amount"
              />
              <div className="text-sm text-muted-foreground">
                Raw value: {amount}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Display */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currency Display</CardTitle>
              <CardDescription>
                Format amounts with various options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">With Symbol:</span>
                  <CurrencyDisplay
                    amount={amount}
                    currency={selectedCurrency}
                    showSymbol={true}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">With Code:</span>
                  <CurrencyDisplay
                    amount={amount}
                    currency={selectedCurrency}
                    showCode={true}
                    showSymbol={false}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Compact:</span>
                  <CurrencyDisplay
                    amount={1234567}
                    currency={selectedCurrency}
                    compact={true}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Negative:</span>
                  <CurrencyDisplay
                    amount={-500}
                    currency={selectedCurrency}
                    colorNegative={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multi-Currency Amount</CardTitle>
              <CardDescription>
                Display amount in primary and secondary currencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiCurrencyAmount
                primaryAmount={amount}
                primaryCurrency={selectedCurrency}
                secondaryAmount={amount * 0.92}
                secondaryCurrency="EUR"
                rate={0.92}
                showTooltip={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exchange Rate Display</CardTitle>
              <CardDescription>
                Show exchange rate between currencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExchangeRateDisplay
                from={selectedCurrency}
                to="EUR"
                rate={0.92}
                updatedAt={new Date()}
                allowToggleDirection={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Converter */}
        <TabsContent value="converter" className="space-y-4">
          <CurrencyConverter
            defaultFrom="USD"
            defaultTo="EUR"
            onConvert={(from, to, amount, result) => {
              console.log(`Converted ${amount} ${from} to ${result} ${to}`);
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Real-time conversion using exchange rates API</li>
                <li>Swap currencies with a single click</li>
                <li>Shows current exchange rate</li>
                <li>Handles loading and error states</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: List & Rates */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currency List</CardTitle>
              <CardDescription>
                Searchable, sortable list of all supported currencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-muted-foreground">
                  Loading exchange rates...
                </div>
              ) : (
                <CurrencyList
                  currencies={allCurrencies}
                  rates={rates}
                  baseCurrency={baseCurrency}
                  showRates={true}
                  onCurrencyClick={(currency) => {
                    setSelectedCurrency(currency.code);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
