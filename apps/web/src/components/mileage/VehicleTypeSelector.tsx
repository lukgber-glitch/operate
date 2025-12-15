'use client';

import { Car, Bike, Battery, LucideIcon } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type VehicleType = 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'ELECTRIC';

interface VehicleOption {
  value: VehicleType;
  label: string;
  icon: LucideIcon;
  color: string;
}

const vehicleOptions: VehicleOption[] = [
  { value: 'CAR', label: 'Car', icon: Car, color: 'text-blue-400' },
  { value: 'MOTORCYCLE', label: 'Motorcycle', icon: Bike, color: 'text-orange-400' },
  { value: 'BICYCLE', label: 'Bicycle', icon: Bike, color: 'text-green-400' },
  { value: 'ELECTRIC', label: 'Electric', icon: Battery, color: 'text-purple-400' },
];

interface VehicleTypeSelectorProps {
  value: VehicleType;
  onChange: (value: VehicleType) => void;
  disabled?: boolean;
}

export function VehicleTypeSelector({ value, onChange, disabled }: VehicleTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Vehicle Type</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as VehicleType)}
        disabled={disabled}
        className="grid grid-cols-2 gap-3"
      >
        {vehicleOptions.map((option) => (
          <div key={option.value}>
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={option.value}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                'border-white/10 bg-white/5 hover:border-white/20',
                'peer-checked:border-primary peer-checked:bg-primary/10',
                'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed'
              )}
            >
              <option.icon className={cn('h-5 w-5', option.color)} />
              <span className="text-sm font-medium text-white">{option.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
