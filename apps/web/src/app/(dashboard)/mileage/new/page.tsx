'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { VehicleTypeSelector } from '@/components/mileage/VehicleTypeSelector';
import { DistanceInput } from '@/components/mileage/DistanceInput';
import { useMileageEntries, useMileageRates } from '@/hooks/use-mileage';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import { useToast } from '@/components/ui/use-toast';

export default function NewMileagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createEntry, isLoading } = useMileageEntries();
  const { getCurrentRate } = useMileageRates();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    startLocation: '',
    endLocation: '',
    distance: 0,
    distanceUnit: 'km' as 'km' | 'miles',
    vehicleType: 'CAR' as 'CAR' | 'MOTORCYCLE' | 'BICYCLE' | 'ELECTRIC',
    roundTrip: false,
    notes: '',
  });

  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

  // Fetch current rate when vehicle type changes
  useEffect(() => {
    const fetchRate = async () => {
      try {
        // Default to US for now - in production, get from user's country
        const rate = await getCurrentRate('US', formData.vehicleType);
        setCurrentRate(rate.rate);
      } catch (error) {
        console.error('Failed to fetch rate:', error);
        // Default rates if API fails
        const defaultRates = {
          CAR: 0.655, // 2024 IRS rate per mile
          MOTORCYCLE: 0.655,
          BICYCLE: 0.20,
          ELECTRIC: 0.04,
        };
        setCurrentRate(defaultRates[formData.vehicleType]);
      }
    };
    fetchRate();
  }, [formData.vehicleType, getCurrentRate]);

  // Calculate amount when distance, rate, or roundTrip changes
  useEffect(() => {
    if (currentRate !== null) {
      const effectiveDistance = formData.roundTrip ? formData.distance * 2 : formData.distance;
      const amount = effectiveDistance * currentRate;
      setCalculatedAmount(parseFloat(amount.toFixed(2)));
    }
  }, [formData.distance, formData.roundTrip, currentRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.purpose || !formData.startLocation || !formData.endLocation || formData.distance <= 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createEntry({
        date: formData.date as string,
        purpose: formData.purpose as string,
        startLocation: formData.startLocation as string,
        endLocation: formData.endLocation as string,
        distance: formData.distance,
        distanceUnit: formData.distanceUnit,
        vehicleType: formData.vehicleType,
        roundTrip: formData.roundTrip,
        notes: formData.notes || undefined,
      });

      toast({
        title: 'Success',
        description: 'Mileage entry created successfully',
      });

      router.push('/mileage');
    } catch (error) {
      console.error('Failed to create entry:', error);
    }
  };

  return (
    <motion.div
      className="space-y-6 max-w-3xl"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/mileage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Add Mileage Entry</h1>
          <p className="text-white/70">Record a business trip</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <GlassCard className="rounded-[16px] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose / Description *</Label>
              <Input
                id="purpose"
                placeholder="e.g., Client meeting, Site visit, Business conference"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
              />
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startLocation">Start Location *</Label>
                <Input
                  id="startLocation"
                  placeholder="e.g., Office, Home"
                  value={formData.startLocation}
                  onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endLocation">End Location *</Label>
                <Input
                  id="endLocation"
                  placeholder="e.g., Client office, Airport"
                  value={formData.endLocation}
                  onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Distance */}
            <DistanceInput
              value={formData.distance}
              onChange={(value) => setFormData({ ...formData, distance: value })}
              unit={formData.distanceUnit}
              onUnitChange={(unit) => setFormData({ ...formData, distanceUnit: unit })}
            />

            {/* Round Trip */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="roundTrip"
                checked={formData.roundTrip}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, roundTrip: checked as boolean })
                }
              />
              <Label
                htmlFor="roundTrip"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Round trip (doubles the distance)
              </Label>
            </div>

            {/* Vehicle Type */}
            <VehicleTypeSelector
              value={formData.vehicleType}
              onChange={(value) => setFormData({ ...formData, vehicleType: value })}
            />

            {/* Rate Display */}
            {currentRate !== null && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Applicable Rate</p>
                    <p className="text-lg font-semibold text-white">
                      ${currentRate.toFixed(3)} per {formData.distanceUnit === 'km' ? 'km' : 'mile'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/70">Calculated Amount</p>
                    <p className="text-2xl font-bold text-white">
                      ${calculatedAmount.toFixed(2)}
                    </p>
                    {formData.roundTrip && (
                      <p className="text-xs text-white/50">
                        ({formData.distance * 2} {formData.distanceUnit} × ${currentRate.toFixed(3)})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional details about the trip..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Entry'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/mileage">Cancel</Link>
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
