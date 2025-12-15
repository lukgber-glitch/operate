'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  showOverlay?: boolean;
  footer?: React.ReactNode;
}

const widthClasses = {
  sm: 'w-full md:w-80',
  md: 'w-full md:w-96',
  lg: 'w-full md:w-[480px]',
  xl: 'w-full md:w-[600px]',
};

export function SidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
  showOverlay = true,
  footer,
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        focusableElements[0]?.focus();
      }
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
              aria-hidden="true"
            />
          )}

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50',
              'flex flex-col',
              widthClasses[width]
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="side-panel-title"
            aria-describedby={subtitle ? 'side-panel-subtitle' : undefined}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2
                    id="side-panel-title"
                    className="text-lg font-semibold text-white truncate"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      id="side-panel-subtitle"
                      className="mt-1 text-sm text-zinc-400 truncate"
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-4 -mt-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 px-6 py-4">
              {children}
            </ScrollArea>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
