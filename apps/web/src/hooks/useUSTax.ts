'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

/**
 * US State data
 */
export interface USState {
  code: string;
  name: string;
}

/**
 * Address for tax calculation
 */
export interface TaxAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Tax jurisdiction details
 */
export interface TaxJurisdiction {
  type: 'State' | 'County' | 'City' | 'District';
  name: string;
  rate: number;
  jurisdictionCode: string;
  jurisdictionType: string;
}

/**
 * Tax rate response
 */
export interface TaxRateResponse {
  totalRate: number;
  taxableAmount: number;
  totalTax: number;
  jurisdictions: TaxJurisdiction[];
  address: TaxAddress;
}

/**
 * Nexus registration
 */
export interface TaxNexus {
  id: string;
  state: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  effectiveDate: string;
  endDate?: string;
  nexusTypeId?: string;
  salesThreshold?: number;
  transactionThreshold?: number;
  taxRegistrationId?: string;
  currentSales?: number;
  currentTransactions?: number;
}

/**
 * Exemption certificate
 */
export interface ExemptionCertificate {
  id: string;
  certificateNumber: string;
  customerId: string;
  customerName: string;
  exemptionType: 'RESALE' | 'GOVERNMENT' | 'NONPROFIT' | 'AGRICULTURAL' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'PENDING';
  states: string[];
  effectiveDate: string;
  expirationDate?: string;
  documentUrl?: string;
  notes?: string;
}

/**
 * Calculate tax request
 */
export interface CalculateTaxRequest {
  destinationAddress: TaxAddress;
  originAddress?: TaxAddress;
  amount: number;
}

const API_BASE = '/api/v1/avalara';

/**
 * Hook for US Tax operations
 */
export function useUSTax() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Fetch tax rate for an address
   */
  const useTaxRate = (address: TaxAddress | null, amount: number = 100) => {
    return useQuery<TaxRateResponse>({
      queryKey: ['tax-rate', address, amount],
      queryFn: async () => {
        if (!address) throw new Error('Address is required');

        const response = await fetch(`${API_BASE}/calculate-tax`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinationAddress: address,
            lines: [
              {
                itemCode: 'PREVIEW',
                description: 'Tax rate preview',
                quantity: 1,
                amount,
              },
            ],
            commit: false,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tax rate');
        }

        return response.json();
      },
      enabled: !!address && !!address.state && !!address.postalCode,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  /**
   * Validate address
   */
  const validateAddress = useMutation({
    mutationFn: async (address: Partial<TaxAddress>) => {
      const response = await fetch(`${API_BASE}/validate-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        throw new Error('Failed to validate address');
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: 'Address Validation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Fetch nexus registrations
   */
  const useNexus = () => {
    return useQuery<TaxNexus[]>({
      queryKey: ['nexus'],
      queryFn: async () => {
        const response = await fetch(`${API_BASE}/nexus`);
        if (!response.ok) throw new Error('Failed to fetch nexus');
        return response.json();
      },
    });
  };

  /**
   * Create nexus registration
   */
  const createNexus = useMutation({
    mutationFn: async (data: Partial<TaxNexus>) => {
      const response = await fetch(`${API_BASE}/nexus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create nexus');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nexus'] });
      toast({
        title: 'Success',
        description: 'Nexus registration created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Update nexus registration
   */
  const updateNexus = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaxNexus> }) => {
      const response = await fetch(`${API_BASE}/nexus/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update nexus');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nexus'] });
      toast({
        title: 'Success',
        description: 'Nexus registration updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Fetch exemption certificates
   */
  const useExemptions = () => {
    return useQuery<ExemptionCertificate[]>({
      queryKey: ['exemptions'],
      queryFn: async () => {
        const response = await fetch(`${API_BASE}/exemptions`);
        if (!response.ok) throw new Error('Failed to fetch exemptions');
        return response.json();
      },
    });
  };

  /**
   * Create exemption certificate
   */
  const createExemption = useMutation({
    mutationFn: async (data: Partial<ExemptionCertificate>) => {
      const response = await fetch(`${API_BASE}/exemptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create exemption');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exemptions'] });
      toast({
        title: 'Success',
        description: 'Exemption certificate created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Update exemption certificate
   */
  const updateExemption = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExemptionCertificate> }) => {
      const response = await fetch(`${API_BASE}/exemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update exemption');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exemptions'] });
      toast({
        title: 'Success',
        description: 'Exemption certificate updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    useTaxRate,
    validateAddress,
    useNexus,
    createNexus,
    updateNexus,
    useExemptions,
    createExemption,
    updateExemption,
  };
}

/**
 * US States data
 */
export const US_STATES: USState[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];
