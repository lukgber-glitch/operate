'use client';

import { Car, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

import { GlassCard } from '@/components/ui/glass-card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import type { CurrencyCode } from '@/types/currency';

interface MileageSummaryCardsProps {
  totalDistance: number;
  totalAmount: number;
  thisMonth: { distance: number; amount: number };
  thisYear: { distance: number; amount: number };
  currency: CurrencyCode;
  distanceUnit: 'km' | 'miles';
}

export function MileageSummaryCards({
  totalDistance,
  totalAmount,
  thisMonth,
  thisYear,
  currency,
  distanceUnit,
}: MileageSummaryCardsProps) {
  const formatDistance = (distance: number) => {
    return `${distance.toLocaleString()} ${distanceUnit}`;
  };

  const cards = [
    {
      title: 'Total Distance',
      value: formatDistance(totalDistance),
      icon: Car,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Amount',
      value: totalAmount,
      isCurrency: true,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'This Month',
      value: thisMonth.distance,
      subValue: thisMonth.amount,
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'This Year',
      value: thisYear.distance,
      subValue: thisYear.amount,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card, index) => (
        <motion.div key={card.title} variants={fadeUp}>
          <GlassCard className="rounded-[24px] p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-white/70 mb-2">{card.title}</p>
                <div className="space-y-1">
                  {card.isCurrency ? (
                    <div className="text-2xl font-bold text-white">
                      <CurrencyDisplay amount={card.value as number} currency={currency} />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      {typeof card.value === 'number' ? formatDistance(card.value) : card.value}
                    </p>
                  )}
                  {card.subValue !== undefined && (
                    <p className="text-sm text-white/50">
                      <CurrencyDisplay amount={card.subValue} currency={currency} />
                    </p>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
