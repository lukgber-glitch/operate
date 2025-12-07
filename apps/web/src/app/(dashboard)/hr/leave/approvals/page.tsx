'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { HeadlineOutside } from '@/components/ui/headline-outside';

export default function LeaveApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hr/leave">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <HeadlineOutside subtitle="Review and approve team leave requests">
          Pending Approvals
        </HeadlineOutside>
      </div>

      <AnimatedCard variant="elevated" padding="lg">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            This page will show pending leave requests requiring your approval.
          </p>
        </div>
      </AnimatedCard>
    </div>
  );
}
