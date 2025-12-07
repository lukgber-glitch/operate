/**
 * ActionConfirmationDialog Component
 * Modal dialog for confirming actions suggested by the AI assistant
 */

'use client';

import { ActionIntent } from '@/types/chat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActionConfirmationDialogProps {
  open: boolean;
  action: ActionIntent | null;
  isExecuting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Get a human-readable action type label
 */
function getActionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    create_invoice: 'Create Invoice',
    send_reminder: 'Send Reminder',
    generate_report: 'Generate Report',
    create_expense: 'Create Expense',
    send_email: 'Send Email',
    export_data: 'Export Data',
    update_status: 'Update Status',
    schedule_task: 'Schedule Task',
  };
  return labels[type] || type;
}

/**
 * Get action badge variant based on risk level
 */
function getActionBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  // High risk actions
  if (['send_email', 'send_reminder', 'export_data'].includes(type)) {
    return 'destructive';
  }
  // Medium risk actions
  if (['create_invoice', 'update_status'].includes(type)) {
    return 'default';
  }
  // Low risk actions
  return 'secondary';
}

/**
 * Format parameter value for display
 */
function formatParameterValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * Format parameter key for display
 */
function formatParameterKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function ActionConfirmationDialog({
  open,
  action,
  isExecuting,
  onConfirm,
  onCancel,
}: ActionConfirmationDialogProps) {
  if (!action) {
    return null;
  }

  const actionTypeLabel = getActionTypeLabel(action.type);
  const badgeVariant = getActionBadgeVariant(action.type);
  const hasParameters = Object.keys(action.parameters || {}).length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && !isExecuting && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Confirm Action</DialogTitle>
          </div>
          <DialogDescription>
            Please review the action details before proceeding. This action will be executed
            immediately upon confirmation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Action Type */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Action Type
            </label>
            <Badge variant={badgeVariant} className="text-sm">
              {actionTypeLabel}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Description
            </label>
            <p className="text-sm bg-muted p-3 rounded-md">{action.description}</p>
          </div>

          {/* Parameters */}
          {hasParameters && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Action Parameters
              </label>
              <div className="bg-muted rounded-md p-4 space-y-3">
                {Object.entries(action.parameters).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2">
                    <div className="text-sm font-medium">{formatParameterKey(key)}:</div>
                    <div className="col-span-2 text-sm text-muted-foreground font-mono break-all">
                      {formatParameterValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning for high-risk actions */}
          {badgeVariant === 'destructive' && (
            <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Caution:</strong> This action may send communications or export data.
                Please verify all details before confirming.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isExecuting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isExecuting}
            className="gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirm & Execute
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
