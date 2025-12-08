'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Confirmation dialog variants
 */
export type ConfirmationDialogVariant = 'danger' | 'warning' | 'info';

/**
 * Props for ConfirmationDialog
 */
export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog state changes
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog description/message
   */
  description: string;

  /**
   * Variant determines the styling and icon
   * @default 'warning'
   */
  variant?: ConfirmationDialogVariant;

  /**
   * Label for the confirm button
   * @default 'Confirm'
   */
  confirmLabel?: string;

  /**
   * Label for the cancel button
   * @default 'Cancel'
   */
  cancelLabel?: string;

  /**
   * Callback when user confirms
   */
  onConfirm: () => void | Promise<void>;

  /**
   * Callback when user cancels
   */
  onCancel?: () => void;

  /**
   * Whether the confirmation action is loading
   */
  isLoading?: boolean;

  /**
   * Whether to disable the confirm button
   */
  disabled?: boolean;

  /**
   * Additional details to show in the dialog
   */
  details?: React.ReactNode;

  /**
   * Custom icon to use instead of default variant icon
   */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * ConfirmationDialog - Reusable confirmation dialog for risky actions
 *
 * Use this component for:
 * - Delete operations
 * - Payment approvals
 * - Bulk operations
 * - Any action that cannot be easily undone
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Invoice"
 *   description="Are you sure you want to delete this invoice? This action cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'warning',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  disabled = false,
  details,
  icon: CustomIcon,
}: ConfirmationDialogProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isLoading) return;
    await onConfirm();
  };

  const handleCancel = () => {
    if (isLoading) return;
    onCancel?.();
    onOpenChange?.(false);
  };

  // Get icon based on variant
  const Icon =
    CustomIcon ||
    (variant === 'danger'
      ? Trash2
      : variant === 'warning'
      ? AlertTriangle
      : AlertCircle);

  // Get colors based on variant
  const iconColor =
    variant === 'danger'
      ? 'text-red-600 dark:text-red-400'
      : variant === 'warning'
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-blue-600 dark:text-blue-400';

  const confirmButtonVariant =
    variant === 'danger' ? 'destructive' : variant === 'warning' ? 'default' : 'default';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full shrink-0',
                variant === 'danger'
                  ? 'bg-red-100 dark:bg-red-900/20'
                  : variant === 'warning'
                  ? 'bg-orange-100 dark:bg-orange-900/20'
                  : 'bg-blue-100 dark:bg-blue-900/20'
              )}
            >
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
              {details && (
                <div className="mt-4 rounded-md border bg-muted p-3 text-sm">
                  {details}
                </div>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={disabled || isLoading}
            className={
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                : ''
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing confirmation dialog state
 *
 * @example
 * ```tsx
 * const confirm = useConfirmation();
 *
 * // Open dialog
 * const handleDelete = () => {
 *   confirm.open({
 *     title: 'Delete Item',
 *     description: 'Are you sure?',
 *     onConfirm: async () => {
 *       await deleteItem();
 *       confirm.close();
 *     },
 *   });
 * };
 * ```
 */
export function useConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'> | null>(null);

  const open = React.useCallback((newConfig: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
    setConfig(newConfig);
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
    // Clear config after animation completes
    setTimeout(() => setConfig(null), 200);
  }, []);

  const dialog = config ? (
    <ConfirmationDialog
      {...config}
      open={isOpen}
      onOpenChange={setIsOpen}
      onCancel={() => {
        config.onCancel?.();
        close();
      }}
    />
  ) : null;

  return {
    dialog,
    open,
    close,
    isOpen,
  };
}
