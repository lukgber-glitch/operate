'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';
import {
  Check,
  CreditCard,
  Download,
  FileText,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { toast } from '@/components/ui/use-toast';

interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

const mockInvoices: Invoice[] = [
  {
    id: 'INV-2024-12',
    date: new Date(2024, 11, 1),
    amount: 49.0,
    status: 'paid',
    description: 'Professional Plan - December 2024',
  },
  {
    id: 'INV-2024-11',
    date: new Date(2024, 10, 1),
    amount: 49.0,
    status: 'paid',
    description: 'Professional Plan - November 2024',
  },
  {
    id: 'INV-2024-10',
    date: new Date(2024, 9, 1),
    amount: 49.0,
    status: 'paid',
    description: 'Professional Plan - October 2024',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for freelancers and solopreneurs',
    features: [
      'Up to 50 invoices/month',
      'Basic expense tracking',
      'Email support',
      '1 bank connection',
      'Basic reports',
    ],
    current: false,
  },
  {
    name: 'Professional',
    price: 49,
    description: 'Ideal for growing businesses',
    features: [
      'Unlimited invoices',
      'Advanced expense tracking',
      'Priority support',
      '5 bank connections',
      'Advanced reports & analytics',
      'AI-powered automation',
      'Team collaboration (up to 5 users)',
    ],
    current: true,
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'For established businesses',
    features: [
      'Everything in Professional',
      'Unlimited bank connections',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced security features',
      'Unlimited team members',
      'White-label options',
      'API access',
    ],
    current: false,
  },
];

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlan = plans.find((p) => p.current);

  const handleUpgrade = (planName: string) => {
    toast({
      title: 'Upgrade initiated',
      description: `Upgrading to ${planName} plan. You will be redirected to payment...`,
    });
  };

  const handleDownload = (invoiceId: string) => {
    toast({
      title: 'Download started',
      description: `Downloading invoice ${invoiceId}...`,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  const getPrice = (price: number) => {
    return billingCycle === 'yearly' ? Math.floor(price * 12 * 0.8) : price;
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-white/70">
          Manage your subscription and billing information
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Subscription */}
        <motion.div variants={fadeUp} className="lg:col-span-1 space-y-6">
          <GlassCard padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl text-white font-bold">{currentPlan?.name}</h3>
                  <p className="text-sm text-white/70 mt-1">
                    {currentPlan?.description}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    EUR {getPrice(currentPlan?.price || 0)}
                  </span>
                  <span className="text-white/70">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                <Button variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </GlassCard>

          <GlassCard padding="lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Payment Method</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-16 rounded bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-xs">
                    VISA
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">•••• 4242</p>
                    <p className="text-xs text-white/70">Expires 12/25</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Update Payment Method
                </Button>
              </div>
            </CardContent>
          </GlassCard>

          <GlassCard padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Next Billing Date</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-white font-bold">Jan 1, 2025</p>
              <p className="text-sm text-white/70 mt-1">
                EUR {getPrice(currentPlan?.price || 0)} will be charged
              </p>
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* Plans and History */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-[16px] bg-gray-100 p-1 dark:bg-gray-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-[12px] text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow text-primary dark:bg-gray-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-[12px] text-sm font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white shadow text-primary dark:bg-gray-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Yearly
                <Badge variant="secondary" className="ml-2">
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <GlassCard
                key={plan.name}
                className={`rounded-[16px] transition-all ${
                  plan.popular
                    ? 'ring-2 ring-primary shadow-lg'
                    : plan.current
                    ? 'ring-2 ring-green-500'
                    : ''
                }`}
              >
                <CardHeader>
                  <div className="space-y-2">
                    {plan.popular && (
                      <Badge className="bg-primary text-white">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Most Popular
                      </Badge>
                    )}
                    {plan.current && !plan.popular && (
                      <Badge className="bg-green-500 text-white">
                        Current Plan
                      </Badge>
                    )}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {plan.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        EUR {getPrice(plan.price)}
                      </span>
                      <span className="text-white/70 text-sm">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.current ? 'outline' : 'primary'}
                      className="w-full"
                      disabled={plan.current}
                      onClick={() => handleUpgrade(plan.name)}
                    >
                      {plan.current ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </div>
                </CardContent>
              </GlassCard>
            ))}
          </div>

          {/* Payment History */}
          <GlassCard padding="lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <CardTitle>Payment History</CardTitle>
              </div>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockInvoices.map((invoice) => (
                  <Card key={invoice.id} className="rounded-[16px]">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{invoice.id}</h4>
                            <p className="text-xs text-white/70">
                              {invoice.description}
                            </p>
                            <p className="text-xs text-white/70 mt-1">
                              {formatDate(invoice.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">
                              EUR {invoice.amount.toFixed(2)}
                            </p>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
