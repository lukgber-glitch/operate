'use client';

import { motion } from 'framer-motion';
import { Power, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AutopilotToggleProps {
  enabled: boolean;
  lastActivity?: string;
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
}

export function AutopilotToggle({
  enabled,
  lastActivity,
  onToggle,
  isLoading = false,
}: AutopilotToggleProps) {
  return (
    <Card className="relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Animated gradient background when active */}
      {enabled && (
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 100%)',
              'linear-gradient(45deg, #8b5cf6 0%, #3b82f6 100%)',
              'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 100%)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Animated icon */}
            <div
              className={cn(
                'relative flex h-16 w-16 items-center justify-center rounded-2xl',
                enabled
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                  : 'bg-white/10'
              )}
            >
              {enabled ? (
                <>
                  {/* Pulsing ring */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-blue-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <Activity className="relative h-8 w-8 text-white" />
                </>
              ) : (
                <Power className="h-8 w-8 text-gray-400" />
              )}
            </div>

            {/* Status text */}
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Autopilot is{' '}
                <span
                  className={cn(
                    'font-bold',
                    enabled ? 'text-blue-400' : 'text-gray-400'
                  )}
                >
                  {enabled ? 'ON' : 'OFF'}
                </span>
              </h2>
              {lastActivity && enabled && (
                <p className="mt-1 text-sm text-gray-400">
                  Last activity: {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
                </p>
              )}
              {!enabled && (
                <p className="mt-1 text-sm text-gray-400">
                  Enable to let AI handle routine tasks automatically
                </p>
              )}
            </div>
          </div>

          {/* Toggle switch */}
          <div className="flex flex-col items-end gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={isLoading}
              className="data-[state=checked]:bg-blue-500"
            />
            {enabled && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-xs text-green-400"
              >
                <motion.div
                  className="h-2 w-2 rounded-full bg-green-400"
                  animate={{
                    opacity: [1, 0.3, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                Active
              </motion.div>
            )}
          </div>
        </div>

        {/* Description */}
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 rounded-lg bg-white/5 p-4"
          >
            <p className="text-sm text-gray-300">
              AI is monitoring your business and handling routine tasks automatically.
              Actions requiring approval will appear below.
            </p>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
