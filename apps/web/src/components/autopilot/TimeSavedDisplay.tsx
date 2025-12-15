'use client';

import { motion } from 'framer-motion';
import { Timer, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TimeSavedDisplayProps {
  todayMinutes: number;
  weeklyMinutes: number;
}

export function TimeSavedDisplay({ todayMinutes, weeklyMinutes }: TimeSavedDisplayProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return { hours, mins };
  };

  const today = formatTime(todayMinutes);
  const weekly = formatTime(weeklyMinutes);

  return (
    <Card className="border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-purple-500/20 p-3">
            <Timer className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Time Saved</h3>
        </div>

        {/* Today's savings */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <motion.span
              className="text-4xl font-bold text-white"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {today.hours > 0 && `${today.hours}h`}
            </motion.span>
            <motion.span
              className="text-4xl font-bold text-white"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            >
              {today.mins}min
            </motion.span>
          </div>
          <p className="mt-1 text-sm text-gray-400">saved today</p>
        </div>

        {/* Weekly total */}
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">This Week</p>
              <p className="text-lg font-semibold text-white">
                {weekly.hours > 0 && `${weekly.hours}h `}
                {weekly.mins}min
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
        </div>

        {/* Fun comparison */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10"
        >
          <p className="text-sm text-gray-300 text-center">
            That's like having a part-time bookkeeper! 🎉
          </p>
        </motion.div>
      </div>
    </Card>
  );
}
