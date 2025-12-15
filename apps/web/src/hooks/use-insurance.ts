'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api/error-handler';

export type InsuranceType =
  | 'LIABILITY'
  | 'PROFESSIONAL_INDEMNITY'
  | 'PROPERTY'
  | 'HEALTH'
  | 'CYBER'
  | 'VEHICLE'
  | 'DIRECTORS_OFFICERS'
  | 'WORKERS_COMPENSATION'
  | 'OTHER';

export type InsuranceStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED';

export type PaymentFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface InsurancePolicy {
  id: string;
  name: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  deductible: number;
  premiumAmount: number;
  paymentFrequency: PaymentFrequency;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  reminderDays: number;
  status: InsuranceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceDocument {
  id: string;
  policyId: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface InsurancePayment {
  id: string;
  policyId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
}

export interface InsuranceSummary {
  totalPolicies: number;
  activePolicies: number;
  expiringPolicies: number;
  annualCost: number;
}

export interface InsurancePolicyFilters {
  type?: InsuranceType;
  status?: InsuranceStatus;
  expiringSoon?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateInsurancePolicyRequest {
  name: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  deductible: number;
  premiumAmount: number;
  paymentFrequency: PaymentFrequency;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  reminderDays: number;
}

export interface UpdateInsurancePolicyRequest extends Partial<CreateInsurancePolicyRequest> {
  status?: InsuranceStatus;
}

// Mock data for development
const mockPolicies: InsurancePolicy[] = [
  {
    id: '1',
    name: 'Professional Liability Insurance',
    type: 'PROFESSIONAL_INDEMNITY',
    provider: 'Allianz',
    policyNumber: 'PI-2024-001',
    coverageAmount: 1000000,
    deductible: 5000,
    premiumAmount: 1200,
    paymentFrequency: 'ANNUAL',
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    autoRenew: true,
    contactName: 'John Smith',
    contactPhone: '+43 1 234567',
    contactEmail: 'john.smith@allianz.at',
    notes: 'Covers up to €1M for professional negligence claims',
    reminderDays: 30,
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Office Property Insurance',
    type: 'PROPERTY',
    provider: 'Generali',
    policyNumber: 'PROP-2024-002',
    coverageAmount: 500000,
    deductible: 2500,
    premiumAmount: 150,
    paymentFrequency: 'MONTHLY',
    startDate: '2024-02-01',
    endDate: '2025-01-15',
    autoRenew: false,
    contactName: 'Maria Weber',
    contactPhone: '+43 1 345678',
    contactEmail: 'maria.weber@generali.at',
    notes: 'Covers office equipment and furnishings',
    reminderDays: 45,
    status: 'EXPIRING',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Cyber Liability Insurance',
    type: 'CYBER',
    provider: 'AXA',
    policyNumber: 'CYB-2024-003',
    coverageAmount: 750000,
    deductible: 10000,
    premiumAmount: 800,
    paymentFrequency: 'QUARTERLY',
    startDate: '2024-03-01',
    endDate: '2025-03-01',
    autoRenew: true,
    contactName: 'Thomas Müller',
    contactPhone: '+43 1 456789',
    contactEmail: 'thomas.mueller@axa.at',
    notes: 'Covers data breaches and cyber attacks',
    reminderDays: 60,
    status: 'ACTIVE',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
];

const mockDocuments: InsuranceDocument[] = [
  {
    id: '1',
    policyId: '1',
    name: 'Policy Certificate.pdf',
    url: '/documents/policy-1-cert.pdf',
    size: 245678,
    uploadedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    policyId: '1',
    name: 'Terms and Conditions.pdf',
    url: '/documents/policy-1-terms.pdf',
    size: 512345,
    uploadedAt: '2024-01-01T00:00:00Z',
  },
];

const mockPayments: InsurancePayment[] = [
  {
    id: '1',
    policyId: '1',
    amount: 1200,
    dueDate: '2024-01-01',
    paidDate: '2024-01-01',
    status: 'PAID',
  },
  {
    id: '2',
    policyId: '2',
    amount: 150,
    dueDate: '2024-12-01',
    paidDate: '2024-12-01',
    status: 'PAID',
  },
  {
    id: '3',
    policyId: '2',
    amount: 150,
    dueDate: '2025-01-01',
    status: 'PENDING',
  },
  {
    id: '4',
    policyId: '3',
    amount: 800,
    dueDate: '2024-12-01',
    paidDate: '2024-12-01',
    status: 'PAID',
  },
];

interface UseInsurancePoliciesState {
  policies: InsurancePolicy[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function useInsurancePolicies(initialFilters?: InsurancePolicyFilters) {
  const { toast } = useToast();
  const [state, setState] = useState<UseInsurancePoliciesState>({
    policies: mockPolicies,
    total: mockPolicies.length,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    isLoading: false,
    error: null,
  });

  const [filters, setFilters] = useState<InsurancePolicyFilters>(initialFilters || {});

  const fetchPolicies = useCallback(async (customFilters?: InsurancePolicyFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = [...mockPolicies];
      const mergedFilters = { ...filters, ...customFilters };

      if (mergedFilters.type) {
        filtered = filtered.filter(p => p.type === mergedFilters.type);
      }
      if (mergedFilters.status) {
        filtered = filtered.filter(p => p.status === mergedFilters.status);
      }
      if (mergedFilters.expiringSoon) {
        filtered = filtered.filter(p => p.status === 'EXPIRING');
      }
      if (mergedFilters.search) {
        const search = mergedFilters.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.provider.toLowerCase().includes(search) ||
          p.policyNumber.toLowerCase().includes(search)
        );
      }

      setState({
        policies: filtered,
        total: filtered.length,
        page: mergedFilters.page || 1,
        pageSize: mergedFilters.pageSize || 10,
        totalPages: Math.ceil(filtered.length / (mergedFilters.pageSize || 10)),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
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
  }, [filters, toast]);

  const createPolicy = useCallback(async (data: CreateInsurancePolicyRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newPolicy: InsurancePolicy = {
        id: String(mockPolicies.length + 1),
        ...data,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockPolicies.push(newPolicy);

      setState(prev => ({
        ...prev,
        policies: [newPolicy, ...prev.policies],
        total: prev.total + 1,
        isLoading: false,
      }));

      toast({
        title: 'Success',
        description: 'Insurance policy created successfully',
      });

      return newPolicy;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
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

  const updatePolicy = useCallback(async (id: string, data: UpdateInsurancePolicyRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const index = mockPolicies.findIndex(p => p.id === id);
      if (index !== -1) {
        const existing = mockPolicies[index]!;
        mockPolicies[index] = {
          ...existing,
          ...data,
          id: existing.id, // Preserve original id
          updatedAt: new Date().toISOString(),
        } as InsurancePolicy;
      }

      setState(prev => ({
        ...prev,
        policies: prev.policies.map(p => {
          if (p.id === id) {
            return { ...p, ...data, id: p.id, updatedAt: new Date().toISOString() };
          }
          return p;
        }),
        isLoading: false,
      }));

      toast({
        title: 'Success',
        description: 'Insurance policy updated successfully',
      });

      return mockPolicies[index];
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
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

  const deletePolicy = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const index = mockPolicies.findIndex(p => p.id === id);
      if (index !== -1) {
        mockPolicies.splice(index, 1);
      }

      setState(prev => ({
        ...prev,
        policies: prev.policies.filter(p => p.id !== id),
        total: prev.total - 1,
        isLoading: false,
      }));

      toast({
        title: 'Success',
        description: 'Insurance policy deleted successfully',
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
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

  return {
    ...state,
    filters,
    setFilters,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
  };
}

export function useInsurancePolicy(id: string) {
  const { toast } = useToast();
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const [payments, setPayments] = useState<InsurancePayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const data = mockPolicies.find(p => p.id === id);
      if (!data) throw new Error('Policy not found');

      setPolicy(data);
      setDocuments(mockDocuments.filter(d => d.policyId === id));
      setPayments(mockPayments.filter(p => p.policyId === id));
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  const updatePolicy = useCallback(async (data: UpdateInsurancePolicyRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const index = mockPolicies.findIndex(p => p.id === id);
      if (index !== -1) {
        const existing = mockPolicies[index]!;
        mockPolicies[index] = {
          ...existing,
          ...data,
          id: existing.id, // Preserve original id
          updatedAt: new Date().toISOString(),
        } as InsurancePolicy;
        setPolicy(mockPolicies[index]);
      }

      toast({
        title: 'Success',
        description: 'Insurance policy updated successfully',
      });

      return mockPolicies[index];
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  return {
    policy,
    documents,
    payments,
    isLoading,
    error,
    fetchPolicy,
    updatePolicy,
  };
}

export function useInsuranceSummary() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<InsuranceSummary>({
    totalPolicies: 0,
    activePolicies: 0,
    expiringPolicies: 0,
    annualCost: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const activePolicies = mockPolicies.filter(p => p.status === 'ACTIVE' || p.status === 'EXPIRING');
      const expiringPolicies = mockPolicies.filter(p => p.status === 'EXPIRING');

      // Calculate annual cost
      const annualCost = mockPolicies.reduce((sum, policy) => {
        let yearlyAmount = policy.premiumAmount;
        if (policy.paymentFrequency === 'MONTHLY') yearlyAmount *= 12;
        else if (policy.paymentFrequency === 'QUARTERLY') yearlyAmount *= 4;
        else if (policy.paymentFrequency === 'SEMI_ANNUAL') yearlyAmount *= 2;
        return sum + yearlyAmount;
      }, 0);

      setSummary({
        totalPolicies: mockPolicies.length,
        activePolicies: activePolicies.length,
        expiringPolicies: expiringPolicies.length,
        annualCost,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    summary,
    isLoading,
    error,
    fetchSummary,
  };
}

export function useExpiringPolicies(days: number = 30) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringPolicies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const expiring = mockPolicies.filter(p => {
        const endDate = new Date(p.endDate);
        return endDate >= now && endDate <= futureDate;
      });

      setPolicies(expiring);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [days, toast]);

  return {
    policies,
    isLoading,
    error,
    fetchExpiringPolicies,
  };
}

export function useUploadDocument() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const uploadDocument = useCallback(async (policyId: string, file: File) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newDoc: InsuranceDocument = {
        id: String(mockDocuments.length + 1),
        policyId,
        name: file.name,
        url: `/documents/${file.name}`,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      mockDocuments.push(newDoc);

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

      return newDoc;
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    uploadDocument,
    isLoading,
  };
}

export function useMarkPaymentPaid() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const markPaymentPaid = useCallback(async (paymentId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const payment = mockPayments.find(p => p.id === paymentId);
      if (payment) {
        payment.status = 'PAID';
        payment.paidDate = new Date().toISOString().split('T')[0];
      }

      toast({
        title: 'Success',
        description: 'Payment marked as paid',
      });

      return payment;
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    markPaymentPaid,
    isLoading,
  };
}
