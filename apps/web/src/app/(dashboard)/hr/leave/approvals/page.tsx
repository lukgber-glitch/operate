'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LeaveApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hr/leave">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground">Review and approve team leave requests</p>
        </div>
      </div>

      <Card className="rounded-[16px]">
        <CardContent className="p-6">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            This page will show pending leave requests requiring your approval.
          </p>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
