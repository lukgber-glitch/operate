/**
 * useActionExecution Hook
 * Handles action confirmation and execution flow
 */

import { useState, useCallback } from 'react';
import { chatApi, ActionExecutionResponse } from '@/lib/api/chat';
import { ActionIntent, ActionResult } from '@/types/chat';
import { useToast } from '@/components/ui/use-toast';

export interface UseActionExecutionOptions {
  onSuccess?: (result: ActionResult) => void;
  onError?: (error: string) => void;
}

export function useActionExecution(options: UseActionExecutionOptions = {}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    confirmationId: string;
    action: ActionIntent;
  } | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const { toast } = useToast();

  /**
   * Store a pending action that needs confirmation
   */
  const setPending = useCallback((confirmationId: string, action: ActionIntent) => {
    setPendingAction({ confirmationId, action });
    setResult(null);
  }, []);

  /**
   * Confirm and execute the pending action
   */
  const confirm = useCallback(
    async (messageId?: string) => {
      if (!pendingAction) {
        console.error('No pending action to confirm');
        return;
      }

      setIsExecuting(true);
      setResult(null);

      try {
        const response: ActionExecutionResponse = await chatApi.confirmAction(
          pendingAction.confirmationId,
          messageId ? { messageId } : undefined
        );

        const actionResult: ActionResult = {
          success: response.success,
          message: response.message,
          entityId: response.entityId,
          entityType: response.entityType,
          data: response.data,
          error: response.error,
        };

        setResult(actionResult);

        if (response.success) {
          toast({
            title: 'Action Completed',
            description: response.message,
          });
          options.onSuccess?.(actionResult);
        } else {
          toast({
            title: 'Action Failed',
            description: response.error || response.message,
            variant: 'destructive',
          });
          options.onError?.(response.error || response.message);
        }

        // Clear pending action after execution
        setPendingAction(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to execute action';

        const actionResult: ActionResult = {
          success: false,
          message: errorMessage,
          error: errorMessage,
        };

        setResult(actionResult);

        toast({
          title: 'Action Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        options.onError?.(errorMessage);
      } finally {
        setIsExecuting(false);
      }
    },
    [pendingAction, toast, options]
  );

  /**
   * Cancel the pending action
   */
  const cancel = useCallback(
    async (reason?: string) => {
      if (!pendingAction) {
        console.error('No pending action to cancel');
        return;
      }

      setIsExecuting(true);

      try {
        await chatApi.cancelAction(
          pendingAction.confirmationId,
          reason ? { reason } : undefined
        );

        toast({
          title: 'Action Cancelled',
          description: 'The action has been cancelled.',
        });

        setPendingAction(null);
        setResult(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to cancel action';

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsExecuting(false);
      }
    },
    [pendingAction, toast]
  );

  /**
   * Clear the current result
   */
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  /**
   * Clear pending action (dismiss dialog)
   */
  const clearPending = useCallback(() => {
    setPendingAction(null);
  }, []);

  return {
    // State
    isExecuting,
    pendingAction,
    result,

    // Actions
    setPending,
    confirm,
    cancel,
    clearResult,
    clearPending,
  };
}
