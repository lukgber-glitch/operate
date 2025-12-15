'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { InvoiceBuilderPanel } from './InvoiceBuilderPanel';
import { ExpenseFormPanel } from './ExpenseFormPanel';
import { ClientFormPanel } from './ClientFormPanel';
import { LeaveRequestPanel } from './LeaveRequestPanel';
import { PaymentWizardPanel } from './PaymentWizardPanel';
import type { PanelType } from '@/hooks/useChatWizardPanel';

interface WizardPanelContainerProps {
  type: PanelType | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  onStepChange: (step: number, stepName: string) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialData?: Record<string, any>;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function WizardPanelContainer({
  type,
  isOpen,
  onClose,
  onComplete,
  onStepChange,
  title,
  size = 'md',
  initialData,
}: WizardPanelContainerProps) {
  const renderWizard = () => {
    if (!type) return null;

    const commonProps = {
      onComplete,
      onCancel: onClose,
      onStepChange,
    };

    switch (type) {
      case 'invoice_builder':
        return (
          <InvoiceBuilderPanel
            {...commonProps}
            initialClient={initialData?.client}
          />
        );
      case 'expense_form':
        return (
          <ExpenseFormPanel
            {...commonProps}
            initialVendor={initialData?.vendor}
            initialCategory={initialData?.category}
          />
        );
      case 'client_form':
        return (
          <ClientFormPanel
            {...commonProps}
            type="client"
            initialData={initialData}
          />
        );
      case 'vendor_form':
        return (
          <ClientFormPanel
            {...commonProps}
            type="vendor"
            initialData={initialData}
          />
        );
      case 'leave_request':
        return (
          <LeaveRequestPanel
            {...commonProps}
            availableBalance={initialData?.balance}
          />
        );
      case 'payment':
        return (
          <PaymentWizardPanel
            {...commonProps}
            initialData={initialData}
          />
        );
      // Add more cases as wizards are implemented
      case 'quote_builder':
      case 'contract_builder':
      case 'employee_onboard':
      case 'project_create':
      case 'report_builder':
        return (
          <div className="flex items-center justify-center h-full text-zinc-400">
            <p>Coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 h-full z-50',
              'bg-zinc-950 border-l border-zinc-800',
              'w-full',
              SIZE_CLASSES[size]
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-60px)] overflow-hidden">
              {renderWizard()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
