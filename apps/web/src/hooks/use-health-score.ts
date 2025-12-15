'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { HealthScoreComponent } from '@/components/dashboard/HealthScoreBreakdown';
import type { HealthInsight } from '@/components/dashboard/HealthScoreInsights';
import type { HealthRecommendation } from '@/components/dashboard/HealthScoreRecommendations';

interface HealthScore {
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastUpdated: Date;
}

interface HealthScoreBreakdown {
  components: HealthScoreComponent[];
}

interface HealthScoreHistory {
  data: Array<{ date: string; score: number }>;
}

interface HealthScoreDetails {
  score: HealthScore;
  breakdown: HealthScoreBreakdown;
  insights: HealthInsight[];
  recommendations: HealthRecommendation[];
}

export function useHealthScore() {
  return useQuery({
    queryKey: ['health-score'],
    queryFn: async (): Promise<HealthScore> => {
      // Mock data for now - replace with actual API call
      return {
        score: 78,
        trend: 'up',
        trendPercentage: 5,
        lastUpdated: new Date(),
      };
    },
  });
}

export function useHealthScoreHistory(days: number = 30) {
  return useQuery({
    queryKey: ['health-score-history', days],
    queryFn: async (): Promise<HealthScoreHistory> => {
      // Mock data - replace with actual API call
      const data = [];
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Generate mock scores with some variance
        const baseScore = 75;
        const variance = Math.sin(i / 5) * 10;
        const score = Math.max(50, Math.min(100, baseScore + variance));

        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.round(score),
        });
      }

      return { data };
    },
  });
}

export function useHealthScoreBreakdown() {
  return useQuery({
    queryKey: ['health-score-breakdown'],
    queryFn: async (): Promise<HealthScoreBreakdown> => {
      // Mock data - replace with actual API call
      return {
        components: [
          {
            id: 'cashFlow',
            label: 'Cash Flow',
            score: 85,
            details: 'Positive cash flow with healthy incoming payments',
          },
          {
            id: 'arHealth',
            label: 'AR Health',
            score: 72,
            details: '3 overdue invoices totaling $4,500',
          },
          {
            id: 'apHealth',
            label: 'AP Health',
            score: 90,
            details: 'All bills paid on time',
          },
          {
            id: 'taxCompliance',
            label: 'Tax Compliance',
            score: 65,
            details: '1 filing overdue, VAT return pending',
          },
          {
            id: 'profitability',
            label: 'Profitability',
            score: 78,
            details: 'Profit margin of 18.5%',
          },
          {
            id: 'runway',
            label: 'Runway',
            score: 80,
            details: '14 months of runway at current burn rate',
          },
        ],
      };
    },
  });
}

export function useHealthScoreDetails() {
  return useQuery({
    queryKey: ['health-score-details'],
    queryFn: async (): Promise<HealthScoreDetails> => {
      // Mock data - replace with actual API call
      return {
        score: {
          score: 78,
          trend: 'up',
          trendPercentage: 5,
          lastUpdated: new Date(),
        },
        breakdown: {
          components: [
            {
              id: 'cashFlow',
              label: 'Cash Flow',
              score: 85,
              details: 'Positive cash flow with healthy incoming payments',
            },
            {
              id: 'arHealth',
              label: 'AR Health',
              score: 72,
              details: '3 overdue invoices totaling $4,500',
            },
            {
              id: 'apHealth',
              label: 'AP Health',
              score: 90,
              details: 'All bills paid on time',
            },
            {
              id: 'taxCompliance',
              label: 'Tax Compliance',
              score: 65,
              details: '1 filing overdue, VAT return pending',
            },
            {
              id: 'profitability',
              label: 'Profitability',
              score: 78,
              details: 'Profit margin of 18.5%',
            },
            {
              id: 'runway',
              label: 'Runway',
              score: 80,
              details: '14 months of runway at current burn rate',
            },
          ],
        },
        insights: [
          {
            id: '1',
            message: 'Your AR collection rate has improved by 15% this month',
            severity: 'success',
            timestamp: new Date(),
          },
          {
            id: '2',
            message: 'VAT return is overdue. File by end of month to avoid penalties',
            severity: 'warning',
            timestamp: new Date(),
          },
          {
            id: '3',
            message: 'Cash reserves are healthy at 14 months runway',
            severity: 'info',
            timestamp: new Date(),
          },
        ],
        recommendations: [
          {
            id: '1',
            issue: 'Overdue Invoices',
            action: 'Send payment reminders to 3 clients with overdue invoices',
            actionLabel: 'Send Reminders',
            actionHref: '/finance/invoices?filter=overdue',
            priority: 'high',
          },
          {
            id: '2',
            issue: 'Tax Filing Overdue',
            action: 'Complete VAT return submission for Q4',
            actionLabel: 'File Now',
            actionHref: '/tax/filing',
            priority: 'high',
          },
          {
            id: '3',
            issue: 'Payment Terms',
            action: 'Consider offering early payment discounts to improve cash flow',
            actionLabel: 'Review Settings',
            actionHref: '/settings',
            priority: 'medium',
          },
        ],
      };
    },
  });
}

export function useRecalculateScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate all health score queries
      queryClient.invalidateQueries({ queryKey: ['health-score'] });
      queryClient.invalidateQueries({ queryKey: ['health-score-history'] });
      queryClient.invalidateQueries({ queryKey: ['health-score-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['health-score-details'] });
    },
  });
}
