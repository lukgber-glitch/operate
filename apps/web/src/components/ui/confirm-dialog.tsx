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
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmDialogVariant = 'destructive' | 'warning' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

/**
 * ConfirmDialog - Reusable confirmation dialog for user actions
 *
 * Features:
 * - Three variants: destructive (delete), warning (risky action), info (general)
 * - Icon based on variant
 * - Loading state support
 * - Customizable labels
 * - Async action support
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Invoice"
 *   description="Are you sure you want to delete this invoice? This action cannot be undone."
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  // Variant configuration
  const variantConfig = {
    destructive: {
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-950',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-950',
      buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-950',
      buttonClass: '',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn('p-2 rounded-full', config.iconBg)}>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={config.buttonClass}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing confirm dialog state
 *
 * @example
 * ```tsx
 * const deleteDialog = useConfirmDialog();
 *
 * <Button onClick={() => deleteDialog.open()}>Delete</Button>
 * <ConfirmDialog
 *   {...deleteDialog.props}
 *   title="Delete Item"
 *   description="Are you sure?"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    props: {
      open: isOpen,
      onOpenChange: setIsOpen,
    },
  };
}
