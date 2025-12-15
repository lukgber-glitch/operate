'use client';

import { useState } from 'react';
import { Repeat } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DistanceInputProps {
  value: number;
  onChange: (value: number) => void;
  unit: 'km' | 'miles';
  onUnitChange: (unit: 'km' | 'miles') => void;
  disabled?: boolean;
  label?: string;
}

export function DistanceInput({
  value,
  onChange,
  unit,
  onUnitChange,
  disabled,
  label = 'Distance',
}: DistanceInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const numValue = parseFloat(val);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue);
    }
  };

  const convertDistance = () => {
    const newUnit = unit === 'km' ? 'miles' : 'km';
    const conversionFactor = unit === 'km' ? 0.621371 : 1.60934;
    const convertedValue = value * conversionFactor;
    onChange(parseFloat(convertedValue.toFixed(2)));
    setInputValue(convertedValue.toFixed(2));
    onUnitChange(newUnit);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            min="0"
            step="0.1"
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            className="pr-16"
            placeholder="0.0"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/50">
            {unit}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={convertDistance}
          disabled={disabled || value === 0}
          title={`Convert to ${unit === 'km' ? 'miles' : 'km'}`}
          className="shrink-0"
        >
          <Repeat className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-white/50">
        {value > 0 && (
          <>
            ≈ {unit === 'km'
              ? `${(value * 0.621371).toFixed(2)} miles`
              : `${(value * 1.60934).toFixed(2)} km`}
          </>
        )}
      </p>
    </div>
  );
}
