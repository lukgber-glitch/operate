'use client';

import { Search, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useBanks } from '@/hooks/use-bank-connections';
import { Bank } from '@/lib/api/bank-connections';

interface ConnectBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (country: string, bankId: string) => void;
}

const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
];

export function ConnectBankModal({
  isOpen,
  onClose,
  onConnect,
}: ConnectBankModalProps) {
  const [step, setStep] = useState<'country' | 'bank'>('country');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  const { banks, isLoading, fetchBanks } = useBanks();

  useEffect(() => {
    if (selectedCountry && step === 'bank') {
      fetchBanks(selectedCountry);
    }
  }, [selectedCountry, step, fetchBanks]);

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setStep('bank');
  };

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
  };

  const handleConnect = () => {
    if (selectedBank) {
      onConnect(selectedCountry, selectedBank.id);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('country');
    setSelectedCountry('');
    setSearchTerm('');
    setSelectedBank(null);
    onClose();
  };

  const handleBack = () => {
    if (step === 'bank') {
      setStep('country');
      setSelectedBank(null);
      setSearchTerm('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'country' ? 'Select Country' : 'Select Your Bank'}
          </DialogTitle>
          <DialogDescription>
            {step === 'country'
              ? 'Choose the country where your bank is located'
              : `Select your bank in ${EU_COUNTRIES.find((c) => c.code === selectedCountry)?.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'country' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {EU_COUNTRIES.filter((country) =>
                  country.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country.code)}
                    className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors text-left"
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="font-medium">{country.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {country.code}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'bank' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  Back
                </Button>
                <Badge variant="secondary">
                  {EU_COUNTRIES.find((c) => c.code === selectedCountry)?.flag}{' '}
                  {EU_COUNTRIES.find((c) => c.code === selectedCountry)?.name}
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search banks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading banks...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredBanks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No banks found</p>
                    </div>
                  ) : (
                    filteredBanks.map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => handleBankSelect(bank)}
                        className={`w-full flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors text-left ${
                          selectedBank?.id === bank.id
                            ? 'border-primary bg-accent'
                            : ''
                        }`}
                      >
                        {bank.logo ? (
                          <img
                            src={bank.logo}
                            alt={bank.name}
                            className="h-10 w-10 rounded object-contain"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{bank.name}</p>
                          {bank.bic && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {bank.bic}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {step === 'bank' && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={!selectedBank}>
              Connect Bank
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
