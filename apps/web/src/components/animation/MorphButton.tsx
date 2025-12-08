'use client';

import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * MorphButton - Button that morphs into expanded content
 *
 * This is the signature interaction for Operate - buttons smoothly
 * transform into content containers using Framer Motion layoutId.
 *
 * @example
 * ```tsx
 * <MorphButton
 *   buttonContent="Create Invoice"
 *   expandedContent={<InvoiceForm onClose={() => {}} />}
 *   className="bg-blue-600 text-white"
 *   expandedClassName="bg-white p-6 rounded-xl shadow-lg"
 * />
 * ```
 */

interface MorphButtonProps {
  /** Content shown in button state */
  buttonContent: React.ReactNode;
  /** Content shown when expanded */
  expandedContent: React.ReactNode | ((onClose: () => void) => React.ReactNode);
  /** Unique ID for the morph (auto-generated if not provided) */
  layoutId?: string;
  /** Button class names */
  className?: string;
  /** Expanded container class names */
  expandedClassName?: string;
  /** Controlled open state */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Disable the button */
  disabled?: boolean;
  /** Button variant styling */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
}

// Spring animation matching design tokens
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

const sizeClasses = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
};

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};

export function MorphButton({
  buttonContent,
  expandedContent,
  layoutId: providedLayoutId,
  className,
  expandedClassName,
  isOpen: controlledIsOpen,
  onOpenChange,
  disabled = false,
  variant = 'default',
  size = 'md',
}: MorphButtonProps) {
  // Generate stable layoutId if not provided
  const generatedId = React.useId();
  const layoutId = providedLayoutId || `morph-button-${generatedId}`;

  // Support both controlled and uncontrolled modes
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = React.useCallback(
    (value: boolean) => {
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(value);
      }
      onOpenChange?.(value);
    },
    [controlledIsOpen, onOpenChange]
  );

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Render expanded content (support function pattern for onClose)
  const renderExpandedContent = () => {
    if (typeof expandedContent === 'function') {
      return expandedContent(handleClose);
    }
    return expandedContent;
  };

  return (
    <>
      {/* Button State */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.button
            layoutId={layoutId}
            onClick={handleOpen}
            disabled={disabled}
            className={cn(
              'inline-flex items-center justify-center rounded-xl font-medium',
              'transition-colors focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
              sizeClasses[size],
              variantClasses[variant],
              className
            )}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={springConfig}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {buttonContent}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded State */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Expanded Content */}
            <motion.div
              layoutId={layoutId}
              className={cn(
                'fixed z-50 overflow-hidden rounded-2xl bg-card shadow-xl',
                'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                expandedClassName
              )}
              transition={springConfig}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                {renderExpandedContent()}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * MorphButtonInline - Morphs in place without modal overlay
 * For use cases where the button expands inline (not as a modal)
 */
interface MorphButtonInlineProps extends Omit<MorphButtonProps, 'expandedClassName'> {
  /** Width of expanded state */
  expandedWidth?: string | number;
  /** Height of expanded state */
  expandedHeight?: string | number;
}

export function MorphButtonInline({
  buttonContent,
  expandedContent,
  layoutId: providedLayoutId,
  className,
  isOpen: controlledIsOpen,
  onOpenChange,
  disabled = false,
  variant = 'default',
  size = 'md',
  expandedWidth = 'auto',
  expandedHeight = 'auto',
}: MorphButtonInlineProps) {
  const generatedId = React.useId();
  const layoutId = providedLayoutId || `morph-inline-${generatedId}`;

  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = React.useCallback(
    (value: boolean) => {
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(value);
      }
      onOpenChange?.(value);
    },
    [controlledIsOpen, onOpenChange]
  );

  const renderExpandedContent = () => {
    if (typeof expandedContent === 'function') {
      return expandedContent(() => setIsOpen(false));
    }
    return expandedContent;
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="button"
            layoutId={layoutId}
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center justify-center rounded-xl font-medium',
              'transition-colors focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
              sizeClasses[size],
              variantClasses[variant],
              className
            )}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={springConfig}
          >
            {buttonContent}
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            layoutId={layoutId}
            className={cn(
              'overflow-hidden rounded-2xl bg-card shadow-lg',
              className
            )}
            style={{
              width: expandedWidth,
              height: expandedHeight,
            }}
            transition={springConfig}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
            >
              {renderExpandedContent()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MorphButton;
