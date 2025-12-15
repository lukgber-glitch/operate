'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LeaveRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hr/leave">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl text-white font-semibold tracking-tight">My Leave Requests</h1>
          <p className="text-muted-foreground">View and manage your leave requests</p>
        </div>
      </div>

      <Card className="rounded-[24px]">
        <CardContent className="p-6">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            This page will show your personal leave requests. Navigate to an employee&apos;s
            leave page to view their specific requests.
          </p>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
