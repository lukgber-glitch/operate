import { Skeleton } from './Skeleton';

export interface OnboardingStepSkeletonProps {
  /**
   * Show progress indicator
   */
  showProgress?: boolean;
  /**
   * Show navigation buttons
   */
  showNavigation?: boolean;
}

/**
 * OnboardingStepSkeleton - Loading skeleton for onboarding wizard steps
 *
 * Features:
 * - Progress indicator at top
 * - Form field placeholders
 * - Navigation buttons at bottom
 * - Matches OnboardingWizard layout
 *
 * @example
 * <OnboardingStepSkeleton showProgress showNavigation />
 */
export function OnboardingStepSkeleton({
  showProgress = true,
  showNavigation = true,
}: OnboardingStepSkeletonProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-pulse">
      {/* Progress indicator */}
      {showProgress && (
        <div className="space-y-3">
          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                {i < 4 && <Skeleton className="h-0.5 w-16 mx-2" />}
              </div>
            ))}
          </div>

          {/* Step labels */}
          <div className="flex items-center justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
        </div>
      )}

      {/* Content card */}
      <div className="border border-border rounded-lg p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Form fields */}
          <div className="space-y-6">
            {/* Field 1 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Field 2 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Field 3 - Two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* Field 4 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Field 5 - Textarea */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      {showNavigation && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      )}
    </div>
  );
}

/**
 * OnboardingWelcomeSkeleton - Simplified skeleton for welcome step
 */
export function OnboardingWelcomeSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-8 animate-pulse">
      {/* Logo/Icon */}
      <Skeleton className="h-20 w-20 rounded-full mx-auto" />

      {/* Title and description */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-80 mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </div>

      {/* Feature list */}
      <div className="space-y-4 pt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 justify-center">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>

      {/* CTA button */}
      <Skeleton className="h-12 w-48 mx-auto rounded-md" />
    </div>
  );
}

/**
 * OnboardingCompletionSkeleton - Skeleton for completion step
 */
export function OnboardingCompletionSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-8 animate-pulse">
      {/* Success icon */}
      <Skeleton className="h-24 w-24 rounded-full mx-auto" />

      {/* Title and message */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 pt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-8 w-8 rounded-md mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Skeleton className="h-12 w-40 rounded-md" />
        <Skeleton className="h-12 w-40 rounded-md" />
      </div>
    </div>
  );
}
