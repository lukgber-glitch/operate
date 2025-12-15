'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  ChevronRight,
  FileText,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ReviewItem {
  id: string;
  senderEmail: string;
  senderDomain: string;
  extractedCompany: string | null;
  classification: string | null;
  confidence: number;
  suggestedAction: string;
  emailSubject?: string;
  extractedAmount?: number;
  extractedDate?: string;
  createdAt: string;
}

interface EmailReviewQueueProps {
  limit?: number;
  showHeader?: boolean;
}

export function EmailReviewQueue({ limit = 5, showHeader = true }: EmailReviewQueueProps) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [shouldLoad, setShouldLoad] = useState(false);

  // Defer API call until after initial render
  useEffect(() => {
    setShouldLoad(true);
  }, []);

  useEffect(() => {
    if (shouldLoad) {
      fetchReviewItems();
    }
  }, [shouldLoad]);

  const fetchReviewItems = async () => {
    try {
      const res = await fetch(`/api/email/review-queue?status=PENDING&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setStats(data.stats || { pending: 0, approved: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/email/review-queue/${id}/approve`, { method: 'POST' });
      setItems(items.filter(item => item.id !== id));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`/api/email/review-queue/${id}/reject`, { method: 'POST' });
      setItems(items.filter(item => item.id !== id));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getClassificationIcon = (classification: string | null) => {
    switch (classification) {
      case 'INVOICE':
      case 'BILL':
        return <FileText className="w-4 h-4" />;
      case 'RECEIPT':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (items.length === 0 && stats.pending === 0) {
    return (
      <Card className="p-6">
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Email Review Queue</h3>
            <Link href="/settings/email">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        )}
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
          <p className="text-muted-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground">No emails pending review</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Email Review Queue</h3>
            {stats.pending > 0 && (
              <Badge variant="secondary">{stats.pending} pending</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings/email">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/intelligence/email">
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10">
                {getClassificationIcon(item.classification)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {item.extractedCompany || item.senderDomain}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {item.classification || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="truncate">{item.senderEmail}</span>
                  {item.extractedAmount && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(item.extractedAmount)}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 ${getConfidenceColor(item.confidence)}`}>
                    {Math.round(item.confidence * 100)}% match
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReject(item.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-500 hover:text-green-600 hover:bg-green-50"
                onClick={() => handleApprove(item.id)}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {stats.pending > limit && (
        <div className="mt-4 text-center">
          <Link href="/intelligence/email">
            <Button variant="link">
              View {stats.pending - limit} more items
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
