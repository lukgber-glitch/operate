'use client';

import { useState } from 'react';
import { EmailReview, useReviewQueue } from '@/hooks/use-review-queue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Mail,
  MoreHorizontal,
  ShieldBan,
  User,
  X,
} from 'lucide-react';

interface ReviewQueueItemProps {
  review: EmailReview;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}

const reviewTypeLabels: Record<string, string> = {
  LOW_CONFIDENCE: 'Low Confidence',
  PATTERN_MATCH: 'Pattern Match',
  DOMAIN_SUSPECT: 'Suspect Domain',
  MANUAL_CHECK: 'Manual Check',
};

const reviewTypeBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  LOW_CONFIDENCE: 'secondary',
  PATTERN_MATCH: 'outline',
  DOMAIN_SUSPECT: 'destructive',
  MANUAL_CHECK: 'default',
};

export function ReviewQueueItem({ review, selected, onSelect }: ReviewQueueItemProps) {
  const { approveReview, rejectReview, blockDomain } = useReviewQueue();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (action: 'CREATE_CUSTOMER' | 'CREATE_VENDOR') => {
    setIsProcessing(true);
    try {
      await approveReview(review.id, action);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectReview(review.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBlockDomain = async () => {
    setIsProcessing(true);
    try {
      await blockDomain(review.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={`transition-colors ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{review.senderEmail}</span>
              </div>
              {review.extractedCompany && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{review.extractedCompany}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={reviewTypeBadgeVariant[review.reviewType] || 'default'}>
              {reviewTypeLabels[review.reviewType] || review.reviewType}
            </Badge>
            <Badge variant="outline">
              {Math.round(review.confidence * 100)}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Review Reason */}
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <span className="text-muted-foreground">{review.reviewReason}</span>
          </div>

          {/* Suggested Action */}
          <div className="text-sm">
            <span className="text-muted-foreground">Suggested: </span>
            <span className="font-medium">
              {review.suggestedAction === 'CREATE_CUSTOMER' && 'Create Customer'}
              {review.suggestedAction === 'CREATE_VENDOR' && 'Create Vendor'}
              {review.suggestedAction === 'SKIP' && 'Skip'}
              {review.suggestedAction === 'BLOCK_DOMAIN' && 'Block Domain'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" disabled={isProcessing}>
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleApprove('CREATE_CUSTOMER')}>
                    <User className="h-4 w-4 mr-2" />
                    Create Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleApprove('CREATE_VENDOR')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Create Vendor
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isProcessing}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleBlockDomain}
                    className="text-destructive"
                  >
                    <ShieldBan className="h-4 w-4 mr-2" />
                    Block Domain ({review.senderDomain})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
