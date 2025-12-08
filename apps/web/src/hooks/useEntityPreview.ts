/**
 * useEntityPreview Hook
 * Manages entity preview panel state and actions
 */

import { useState, useCallback } from 'react';
import { EntityType, Entity } from '@/components/chat/EntityPreview';

interface EntityPreviewState {
  isOpen: boolean;
  entityType: EntityType | null;
  entityId: string | null;
  entity: Entity | null;
}

/**
 * Hook for managing EntityPreview state
 *
 * @example
 * ```tsx
 * const entityPreview = useEntityPreview();
 *
 * // Open preview for an invoice
 * const handleInvoiceClick = (id: string) => {
 *   entityPreview.open('invoice', id);
 * };
 *
 * // Render the preview
 * <EntityPreview
 *   open={entityPreview.isOpen}
 *   onOpenChange={entityPreview.setOpen}
 *   entityType={entityPreview.entityType!}
 *   entityId={entityPreview.entityId!}
 *   entity={entityPreview.entity}
 * />
 * ```
 */
export function useEntityPreview() {
  const [state, setState] = useState<EntityPreviewState>({
    isOpen: false,
    entityType: null,
    entityId: null,
    entity: null,
  });

  /**
   * Open entity preview
   */
  const open = useCallback((entityType: EntityType, entityId: string, entity?: Entity) => {
    setState({
      isOpen: true,
      entityType,
      entityId,
      entity: entity || null,
    });
  }, []);

  /**
   * Close entity preview
   */
  const close = useCallback(() => {
    setState({
      isOpen: false,
      entityType: null,
      entityId: null,
      entity: null,
    });
  }, []);

  /**
   * Set open state (for direct control)
   */
  const setOpen = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      close();
    }
  }, [close]);

  return {
    isOpen: state.isOpen,
    entityType: state.entityType,
    entityId: state.entityId,
    entity: state.entity,
    open,
    close,
    setOpen,
  };
}
