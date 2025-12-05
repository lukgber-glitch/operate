'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  TrendingUp,
  Shield,
  Wallet,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBenefits } from '@/hooks/use-benefits';
import { BenefitType } from '@/types/benefits';
import Link from 'next/link';

export function BenefitsOverview() {
  const { plans, enrollments, enrollmentPeriod, isLoading, fetchPlans, fetchEnrollmentPeriod } = useBenefits();

  useEffect(() => {
    fetchPlans();
    fetchEnrollmentPeriod();
  }, [fetchPlans, fetchEnrollmentPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = () => {
    if (!enrollmentPeriod) return 0;
    const end = new Date(enrollmentPeriod.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();
  const isEnrollmentOpen = enrollmentPeriod?.isActive && daysRemaining > 0;

  const healthPlans = plans.filter(
    (p) => p.type === BenefitType.HEALTH || p.type === BenefitType.DENTAL || p.type === BenefitType.VISION
  );
  const retirementPlans = plans.filter((p) => p.type === BenefitType.RETIREMENT);
  const lifePlans = plans.filter((p) => p.type === BenefitType.LIFE);

  const enrollmentProgress = enrollments.length > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Benefits Enrollment</h1>
          <p className="text-muted-foreground mt-2">
            Review and enroll in company benefits
          </p>
        </div>
        {isEnrollmentOpen && (
          <Link href="/hr/benefits/enroll">
            <Button size="lg">
              Start Enrollment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>

      {/* Enrollment Period Alert */}
      {enrollmentPeriod && (
        <Alert className={isEnrollmentOpen ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}>
          <Calendar className={`h-4 w-4 ${isEnrollmentOpen ? 'text-blue-600' : 'text-amber-600'}`} />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>{enrollmentPeriod.name}</strong>
                <p className="text-sm mt-1">{enrollmentPeriod.description}</p>
                <p className="text-sm mt-1">
                  {new Date(enrollmentPeriod.startDate).toLocaleDateString()} -{' '}
                  {new Date(enrollmentPeriod.endDate).toLocaleDateString()}
                </p>
              </div>
              {isEnrollmentOpen && (
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold text-lg">{daysRemaining} days remaining</span>
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Enrollment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Enrollment Status
          </CardTitle>
          <CardDescription>Track your benefits enrollment progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-semibold">{enrollmentProgress}%</span>
            </div>
            <Progress value={enrollmentProgress} />
          </div>

          {enrollments.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You haven't enrolled in any benefits yet. Start your enrollment to secure coverage for the upcoming year.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                You're enrolled in {enrollments.length} benefit{enrollments.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {isEnrollmentOpen && (
            <Link href="/hr/benefits/enroll">
              <Button className="w-full">
                {enrollments.length === 0 ? 'Start Enrollment' : 'Modify Enrollment'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Available Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Available Benefits</CardTitle>
          <CardDescription>Explore the benefits offered by your employer</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="health" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="retirement">Retirement</TabsTrigger>
              <TabsTrigger value="life">Life Insurance</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            {/* Health Benefits */}
            <TabsContent value="health" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Heart className="h-8 w-8 text-red-500" />
                      <Badge>Medical</Badge>
                    </div>
                    <CardTitle className="text-lg">Health Insurance</CardTitle>
                    <CardDescription className="line-clamp-2">
                      Comprehensive medical coverage for you and your family
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plans available:</span>
                        <span className="font-semibold">
                          {plans.filter((p) => p.type === BenefitType.HEALTH).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting at:</span>
                        <span className="font-semibold">$150/mo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Heart className="h-8 w-8 text-blue-500" />
                      <Badge variant="secondary">Dental</Badge>
                    </div>
                    <CardTitle className="text-lg">Dental Insurance</CardTitle>
                    <CardDescription className="line-clamp-2">
                      Coverage for preventive, basic, and major dental procedures
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plans available:</span>
                        <span className="font-semibold">
                          {plans.filter((p) => p.type === BenefitType.DENTAL).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting at:</span>
                        <span className="font-semibold">$25/mo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Heart className="h-8 w-8 text-purple-500" />
                      <Badge variant="outline">Vision</Badge>
                    </div>
                    <CardTitle className="text-lg">Vision Insurance</CardTitle>
                    <CardDescription className="line-clamp-2">
                      Eye exams, glasses, and contact lens coverage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plans available:</span>
                        <span className="font-semibold">
                          {plans.filter((p) => p.type === BenefitType.VISION).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting at:</span>
                        <span className="font-semibold">$10/mo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Retirement */}
            <TabsContent value="retirement" className="space-y-4">
              <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                    <Badge>401(k)</Badge>
                  </div>
                  <CardTitle className="text-lg">Retirement Plan</CardTitle>
                  <CardDescription>
                    Company-sponsored 401(k) with employer matching
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Company matches up to 6% of salary</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Traditional and Roth options available</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Immediate vesting on employee contributions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Life Insurance */}
            <TabsContent value="life" className="space-y-4">
              <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Shield className="h-8 w-8 text-blue-500" />
                    <Badge>Life</Badge>
                  </div>
                  <CardTitle className="text-lg">Life Insurance</CardTitle>
                  <CardDescription>
                    Basic and supplemental life insurance coverage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Basic coverage: 1x annual salary (Free)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Supplemental coverage up to $500,000</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Portable coverage if you leave</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Benefits */}
            <TabsContent value="other" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Wallet className="h-8 w-8 text-green-500" />
                      <Badge variant="secondary">HSA/FSA</Badge>
                    </div>
                    <CardTitle className="text-lg">Health Savings Account</CardTitle>
                    <CardDescription>
                      Tax-advantaged savings for healthcare expenses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Annual limit:</span>
                        <span className="font-semibold">$4,150</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employer contribution:</span>
                        <span className="font-semibold text-green-600">$500</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Shield className="h-8 w-8 text-amber-500" />
                      <Badge variant="outline">Disability</Badge>
                    </div>
                    <CardTitle className="text-lg">Disability Insurance</CardTitle>
                    <CardDescription>
                      Short and long-term disability coverage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Short-term:</span>
                        <span className="font-semibold">60% of salary</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Long-term:</span>
                        <span className="font-semibold">60% of salary</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
