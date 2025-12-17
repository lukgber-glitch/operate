'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * HR Payroll Overview Page
 */
export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Payroll</h1>
        <p className="text-white/70">Manage employee compensation and payroll runs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5" />
              Run Payroll
            </CardTitle>
            <CardDescription className="text-white/60">
              Process payroll for your employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/hr/payroll/run">
                Start Payroll Run
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Employees
            </CardTitle>
            <CardDescription className="text-white/60">
              View and manage employee information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/hr/employees">
                View Employees
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5" />
              Benefits
            </CardTitle>
            <CardDescription className="text-white/60">
              Manage employee benefits and deductions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/hr/benefits">
                Manage Benefits
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Payroll Runs</CardTitle>
          <CardDescription className="text-white/60">
            Your latest payroll processing history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/50">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No payroll runs yet</p>
            <p className="text-sm">Run your first payroll to see history here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
