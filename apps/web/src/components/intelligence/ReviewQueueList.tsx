'use client';

import { useEffect, useState } from 'react';
import { useReviewQueue } from '@/hooks/use-review-queue';
import { ReviewQueueItem } from './ReviewQueueItem';
import { ReviewQueueStats } from './ReviewQueueStats';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';

export function ReviewQueueList() {
  const {
    reviews,
    stats,
    loading,
    fetchReviews,
    fetchStats,
    bulkApprove,
    bulkReject,
  } = useReviewQueue();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchReviews(typeFilter !== 'all' ? { type: typeFilter } : undefined);
    fetchStats();
  }, [fetchReviews, fetchStats, typeFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(reviews.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleBulkApprove = async (action: 'CREATE_CUSTOMER' | 'CREATE_VENDOR') => {
    if (selectedIds.length === 0) return;
    await bulkApprove(selectedIds, action);
    setSelectedIds([]);
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    await bulkReject(selectedIds);
    setSelectedIds([]);
  };

  const handleRefresh = () => {
    fetchReviews(typeFilter !== 'all' ? { type: typeFilter } : undefined);
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && <ReviewQueueStats stats={stats} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LOW_CONFIDENCE">Low Confidence</SelectItem>
              <SelectItem value="PATTERN_MATCH">Pattern Match</SelectItem>
              <SelectItem value="DOMAIN_SUSPECT">Domain Suspect</SelectItem>
              <SelectItem value="MANUAL_CHECK">Manual Check</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleBulkApprove('CREATE_CUSTOMER')}
            >
              Approve as Customers
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkApprove('CREATE_VENDOR')}
            >
              Approve as Vendors
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkReject}
            >
              Reject All
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No pending reviews</p>
          <p className="text-sm">All emails have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
            <Checkbox
              checked={selectedIds.length === reviews.length && reviews.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">Select All</span>
          </div>

          {/* Review Items */}
          {reviews.map((review) => (
            <ReviewQueueItem
              key={review.id}
              review={review}
              selected={selectedIds.includes(review.id)}
              onSelect={(checked) => handleSelectOne(review.id, checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
