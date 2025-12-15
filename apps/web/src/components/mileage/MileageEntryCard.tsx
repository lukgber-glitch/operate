'use client';

import { Calendar, MapPin, Car, Copy, Trash2, Edit, Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import type { CurrencyCode } from '@/types/currency';
import type { MileageEntry } from '@/lib/api/mileage';
import { fadeUp } from '@/lib/animation-variants';

interface MileageEntryCardProps {
  entry: MileageEntry;
  onEdit?: (entry: MileageEntry) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleReimbursed?: (id: string) => void;
}

export function MileageEntryCard({
  entry,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleReimbursed,
}: MileageEntryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const vehicleColors = {
    CAR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    MOTORCYCLE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    BICYCLE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    ELECTRIC: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <motion.div variants={fadeUp}>
      <GlassCard className="rounded-[24px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-white">{entry.purpose}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-white/70">
                  <Calendar className="h-4 w-4" />
                  {formatDate(entry.date)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  <CurrencyDisplay amount={entry.amount} currency={entry.currency as CurrencyCode} />
                </div>
                <div className="text-xs text-white/50">
                  {entry.distance} {entry.distanceUnit}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/70">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {entry.startLocation} → {entry.endLocation}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={vehicleColors[entry.vehicleType]}>
                <Car className="h-3 w-3 mr-1" />
                {entry.vehicleType.toLowerCase()}
              </Badge>
              {entry.roundTrip && (
                <Badge variant="outline">Round Trip</Badge>
              )}
              {entry.reimbursed && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="h-3 w-3 mr-1" />
                  Reimbursed
                </Badge>
              )}
              {entry.clientName && (
                <Badge variant="outline">{entry.clientName}</Badge>
              )}
            </div>

            {entry.notes && (
              <p className="text-sm text-white/50 italic">{entry.notes}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(entry)}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicate(entry.id)}
                title="Duplicate"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onToggleReimbursed && !entry.reimbursed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleReimbursed(entry.id)}
                title="Mark as reimbursed"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(entry.id)}
                title="Delete"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
