'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle } from 'lucide-react';
import type { VerificationRequirement } from '@/types/verification';
import { cn } from '@/lib/utils';

interface VerificationRequirementsProps {
  requirements: VerificationRequirement[];
  className?: string;
}

export function VerificationRequirements({
  requirements,
  className,
}: VerificationRequirementsProps) {
  const requiredItems = requirements.filter(r => r.required);
  const optionalItems = requirements.filter(r => !r.required);
  const completedRequired = requiredItems.filter(r => r.completed).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Upload the following documents to complete verification
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {completedRequired} / {requiredItems.length} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Documents */}
        {requiredItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Required</h4>
            {requiredItems.map((req) => (
              <RequirementItem key={req.type} requirement={req} />
            ))}
          </div>
        )}

        {/* Optional Documents */}
        {optionalItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Optional (Recommended)
            </h4>
            {optionalItems.map((req) => (
              <RequirementItem key={req.type} requirement={req} />
            ))}
          </div>
        )}

        {requirements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No requirements available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RequirementItem({ requirement }: { requirement: VerificationRequirement }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        requirement.completed
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
          : 'bg-muted/50 border-muted'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
          requirement.completed
            ? 'bg-green-500 text-white'
            : 'bg-muted-foreground/20 text-muted-foreground'
        )}
      >
        {requirement.completed && <Check className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h5 className="text-sm font-medium">{requirement.label}</h5>
          {!requirement.required && (
            <Badge variant="secondary" className="text-xs">
              Optional
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {requirement.description}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Formats: {requirement.acceptedFormats.join(', ')}</span>
          <span>•</span>
          <span>Max size: {requirement.maxSizeMB}MB</span>
        </div>
      </div>
    </div>
  );
}
