'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface EmailReview {
  id: string;
  emailId: string;
  reviewType: 'LOW_CONFIDENCE' | 'PATTERN_MATCH' | 'DOMAIN_SUSPECT' | 'MANUAL_CHECK';
  reviewReason: string;
  senderEmail: string;
  senderDomain: string;
  extractedCompany?: string;
  extractedContacts?: any;
  classification?: string;
  confidence: number;
  suggestedAction: 'CREATE_CUSTOMER' | 'CREATE_VENDOR' | 'SKIP' | 'BLOCK_DOMAIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  blocked: number;
  byType: Record<string, number>;
}

export function useReviewQueue() {
  const [reviews, setReviews] = useState<EmailReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReviews = useCallback(async (filters?: { type?: string; limit?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/v1/email-intelligence/reviews?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data.reviews);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/email-intelligence/reviews/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch review stats:', err);
    }
  }, []);

  const approveReview = useCallback(async (
    reviewId: string,
    action: 'CREATE_CUSTOMER' | 'CREATE_VENDOR',
    notes?: string,
  ) => {
    try {
      const response = await fetch(`/api/v1/email-intelligence/reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, notes }),
      });
      if (!response.ok) throw new Error('Failed to approve review');
      const data = await response.json();

      // Update local state
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast({
        title: 'Review Approved',
        description: `${action === 'CREATE_CUSTOMER' ? 'Customer' : 'Vendor'} created successfully`,
      });

      return data;
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const rejectReview = useCallback(async (reviewId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/v1/email-intelligence/reviews/${reviewId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to reject review');

      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast({
        title: 'Review Rejected',
        description: 'Email will not create any entity',
      });

      return await response.json();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const blockDomain = useCallback(async (reviewId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/v1/email-intelligence/reviews/${reviewId}/block-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to block domain');

      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast({
        title: 'Domain Blocked',
        description: 'Future emails from this domain will be skipped',
      });

      return await response.json();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to block domain',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const bulkApprove = useCallback(async (
    reviewIds: string[],
    action: 'CREATE_CUSTOMER' | 'CREATE_VENDOR',
  ) => {
    try {
      const response = await fetch('/api/v1/email-intelligence/reviews/bulk/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewIds, action }),
      });
      if (!response.ok) throw new Error('Failed to bulk approve');

      setReviews(prev => prev.filter(r => !reviewIds.includes(r.id)));
      toast({
        title: 'Bulk Approve Complete',
        description: `${reviewIds.length} reviews approved`,
      });

      return await response.json();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to bulk approve',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const bulkReject = useCallback(async (reviewIds: string[]) => {
    try {
      const response = await fetch('/api/v1/email-intelligence/reviews/bulk/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewIds }),
      });
      if (!response.ok) throw new Error('Failed to bulk reject');

      setReviews(prev => prev.filter(r => !reviewIds.includes(r.id)));
      toast({
        title: 'Bulk Reject Complete',
        description: `${reviewIds.length} reviews rejected`,
      });

      return await response.json();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to bulk reject',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  return {
    reviews,
    stats,
    loading,
    error,
    fetchReviews,
    fetchStats,
    approveReview,
    rejectReview,
    blockDomain,
    bulkApprove,
    bulkReject,
  };
}
