'use client';

import { Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRunningTimer, formatDuration } from '@/hooks/use-time-tracking';
import { cn } from '@/lib/utils';

export function MiniTimer() {
  const { timer, elapsedSeconds, isRunning } = useRunningTimer();

  if (!isRunning || !timer) return null;

  return (
    <Link href="/time">
      <Button
        variant="ghost"
        className={cn(
          'h-10 px-3 text-white hover:text-[#06BF9D] hover:bg-white/10 transition-colors',
          'animate-pulse'
        )}
      >
        <Clock className="h-4 w-4 mr-2 text-red-400" />
        <span className="font-mono font-bold">{formatDuration(elapsedSeconds)}</span>
      </Button>
    </Link>
  );
}
