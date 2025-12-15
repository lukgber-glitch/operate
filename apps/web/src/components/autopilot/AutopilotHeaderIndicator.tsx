'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { useAutopilotConfig, usePendingApprovals } from '@/hooks/use-autopilot';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function AutopilotHeaderIndicator() {
  const { config, fetchConfig } = useAutopilotConfig();
  const { approvals, fetchApprovals } = usePendingApprovals();

  useEffect(() => {
    fetchConfig();
    fetchApprovals();
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchConfig();
      fetchApprovals();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!config?.enabled) {
    return null;
  }

  const pendingCount = approvals.length;

  return (
    <Link href="/autopilot">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
      >
        <div className="relative">
          <Zap className="h-4 w-4 text-blue-400" />
          <motion.div
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400"
            animate={{
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
        <span className="text-xs font-medium text-white">Autopilot</span>
        {pendingCount > 0 && (
          <Badge
            variant="outline"
            className="h-5 min-w-5 px-1 bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs"
          >
            {pendingCount}
          </Badge>
        )}
      </motion.div>
    </Link>
  );
}
