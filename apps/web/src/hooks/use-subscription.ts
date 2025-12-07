'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';
import { api } from '@/lib/api/client';

export type PlanTier = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'FAILED';

export interface PlanLimits {
  aiMessages: number;
  bankConnections: number;
  invoicesPerMonth: number;
  teamMembers: number;
  storage: number; // in GB
}

export interface CurrentUsage {
  aiMessages: number;
  bankConnections: number;
  invoicesThisMonth: number;
  teamMembers: number;
  storageUsed: number; // in GB
}

export interface Subscription {
  id: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  limits: PlanLimits;
  price: {
    amount: number;
    currency: string;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  isDefault: boolean;
  createdAt: string;
}

export interface BillingInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  pdfUrl: string | null;
  periodStart: string;
  periodEnd: string;
}

export interface PlanOption {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

interface UseSubscriptionState {
  subscription: Subscription | null;
  usage: CurrentUsage | null;
  paymentMethods: PaymentMethod[];
  invoices: BillingInvoice[];
  isLoading: boolean;
  error: string | null;
}

export const PLAN_OPTIONS: PlanOption[] = [
  {
    tier: 'FREE',
    name: 'Free',
    description: 'Perfect for trying out Operate',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      aiMessages: 50,
      bankConnections: 1,
      invoicesPerMonth: 10,
      teamMembers: 1,
      storage: 1,
    },
    features: [
      '50 AI messages per month',
      '1 bank connection',
      'Up to 10 invoices/month',
      'Basic expense tracking',
      '1 GB storage',
    ],
  },
  {
    tier: 'STARTER',
    name: 'Starter',
    description: 'For freelancers and solo entrepreneurs',
    monthlyPrice: 29,
    annualPrice: 290,
    limits: {
      aiMessages: 500,
      bankConnections: 3,
      invoicesPerMonth: 50,
      teamMembers: 1,
      storage: 10,
    },
    features: [
      '500 AI messages per month',
      'Up to 3 bank connections',
      'Up to 50 invoices/month',
      'Advanced expense tracking',
      'Basic tax filing',
      '10 GB storage',
    ],
  },
  {
    tier: 'PRO',
    name: 'Pro',
    description: 'For growing businesses',
    monthlyPrice: 79,
    annualPrice: 790,
    popular: true,
    limits: {
      aiMessages: 2000,
      bankConnections: 10,
      invoicesPerMonth: 200,
      teamMembers: 5,
      storage: 50,
    },
    features: [
      '2,000 AI messages per month',
      'Up to 10 bank connections',
      'Up to 200 invoices/month',
      'Up to 5 team members',
      'Full automation features',
      'Advanced tax filing',
      'Priority support',
      '50 GB storage',
    ],
  },
  {
    tier: 'BUSINESS',
    name: 'Business',
    description: 'For established companies',
    monthlyPrice: 199,
    annualPrice: 1990,
    limits: {
      aiMessages: -1, // unlimited
      bankConnections: -1, // unlimited
      invoicesPerMonth: -1, // unlimited
      teamMembers: -1, // unlimited
      storage: 500,
    },
    features: [
      'Unlimited AI messages',
      'Unlimited bank connections',
      'Unlimited invoices',
      'Unlimited team members',
      'White-label options',
      'Dedicated account manager',
      'Custom integrations',
      '500 GB storage',
    ],
  },
];

export function useSubscription(autoFetch = true) {
  const { toast } = useToast();
  const [state, setState] = useState<UseSubscriptionState>({
    subscription: null,
    usage: null,
    paymentMethods: [],
    invoices: [],
    isLoading: false,
    error: null,
  });

  const fetchSubscription = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.get<Subscription>('/billing/subscription');
      setState((prev) => ({
        ...prev,
        subscription: response.data,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchUsage = useCallback(async () => {
    try {
      const response = await api.get<CurrentUsage>('/billing/usage');
      setState((prev) => ({
        ...prev,
        usage: response.data,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await api.get<PaymentMethod[]>('/billing/payment-methods');
      setState((prev) => ({
        ...prev,
        paymentMethods: response.data,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await api.get<{ invoices: BillingInvoice[] }>('/billing/invoices');
      setState((prev) => ({
        ...prev,
        invoices: response.data.invoices,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const addPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await api.post<PaymentMethod>('/billing/payment-methods', {
          paymentMethodId,
        });
        setState((prev) => ({
          ...prev,
          paymentMethods: [...prev.paymentMethods, response.data],
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Payment method added successfully',
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const removePaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await api.delete(`/billing/payment-methods/${paymentMethodId}`);
        setState((prev) => ({
          ...prev,
          paymentMethods: prev.paymentMethods.filter((pm) => pm.id !== paymentMethodId),
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Payment method removed successfully',
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const setDefaultPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await api.post(`/billing/payment-methods/${paymentMethodId}/default`);
        setState((prev) => ({
          ...prev,
          paymentMethods: prev.paymentMethods.map((pm) => ({
            ...pm,
            isDefault: pm.id === paymentMethodId,
          })),
          isLoading: false,
        }));
        toast({
          title: 'Success',
          description: 'Default payment method updated',
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const cancelSubscription = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.post<Subscription>('/billing/subscription/cancel');
      setState((prev) => ({
        ...prev,
        subscription: response.data,
        isLoading: false,
      }));
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the current billing period',
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const resumeSubscription = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.post<Subscription>('/billing/subscription/resume');
      setState((prev) => ({
        ...prev,
        subscription: response.data,
        isLoading: false,
      }));
      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been successfully resumed',
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const changePlan = useCallback(
    async (planTier: PlanTier, billingCycle: BillingCycle) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await api.post<Subscription>('/billing/subscription/change-plan', {
          planTier,
          billingCycle,
        });
        setState((prev) => ({
          ...prev,
          subscription: response.data,
          isLoading: false,
        }));
        toast({
          title: 'Plan Changed',
          description: 'Your subscription plan has been updated successfully',
        });
      } catch (error) {
        const errorMessage = handleApiError(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  const switchBillingCycle = useCallback(
    async (billingCycle: BillingCycle) => {
      if (!state.subscription) return;
      return changePlan(state.subscription.planTier, billingCycle);
    },
    [state.subscription, changePlan]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchSubscription();
      fetchUsage();
      fetchPaymentMethods();
      fetchInvoices();
    }
  }, [autoFetch, fetchSubscription, fetchUsage, fetchPaymentMethods, fetchInvoices]);

  return {
    ...state,
    fetchSubscription,
    fetchUsage,
    fetchPaymentMethods,
    fetchInvoices,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    cancelSubscription,
    resumeSubscription,
    changePlan,
    switchBillingCycle,
  };
}
