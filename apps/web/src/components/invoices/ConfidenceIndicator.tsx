/**
 * Confidence Indicator Component
 * Visual indicator for AI extraction confidence scores
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-1
  showLabel?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  showLabel = true,
  showProgress = false,
  size = 'md',
  className,
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);

  // Determine color based on confidence
  const getConfidenceLevel = () => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const level = getConfidenceLevel();

  const colorClasses = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200',
  };

  const progressColors = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  if (!showLabel && !showProgress) {
    // Just show a colored dot
    return (
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          level === 'high' && 'bg-green-500',
          level === 'medium' && 'bg-yellow-500',
          level === 'low' && 'bg-red-500',
          className
        )}
        title={`${percentage}% confidence`}
      />
    );
  }

  if (showProgress) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Progress
          value={percentage}
          className="flex-1"
          indicatorClassName={progressColors[level]}
        />
        {showLabel && (
          <span className="text-sm font-medium text-muted-foreground min-w-[3ch]">
            {percentage}%
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(colorClasses[level], sizeClasses[size], className)}
    >
      {percentage}%
    </Badge>
  );
}

interface FieldConfidenceIndicatorProps {
  fieldName: string;
  confidence: number;
  extracted: boolean;
  className?: string;
}

export function FieldConfidenceIndicator({
  fieldName,
  confidence,
  extracted,
  className,
}: FieldConfidenceIndicatorProps) {
  if (!extracted) {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <span className="text-sm text-muted-foreground">{fieldName}</span>
        <Badge variant="outline" className="text-xs">
          Not extracted
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <span className="text-sm text-muted-foreground flex-shrink-0">
        {fieldName}
      </span>
      <ConfidenceIndicator
        confidence={confidence}
        showLabel={true}
        showProgress={false}
        size="sm"
      />
    </div>
  );
}
