/**
 * Chat Wizard Panel Hook
 *
 * Manages the integration between chat interface and wizard side panels.
 * Handles panel opening/closing, step changes, and chat guidance messages.
 */

import { useState, useCallback, useMemo } from 'react';
import type { WizardType } from '@/components/panels/wizards';

export type PanelType =
  | 'invoice_builder'
  | 'expense_form'
  | 'client_form'
  | 'vendor_form'
  | 'leave_request'
  | 'payment'
  | 'quote_builder'
  | 'contract_builder'
  | 'employee_onboard'
  | 'project_create'
  | 'report_builder';

interface PanelGuidanceMessage {
  id: string;
  step: number;
  message: string;
  type: 'guidance' | 'hint' | 'completion' | 'error';
  timestamp: Date;
}

interface PanelState {
  type: PanelType | null;
  isOpen: boolean;
  currentStep: number;
  initialData?: Record<string, any>;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface UseChatWizardPanelReturn {
  // Panel state
  panelState: PanelState;
  isOpen: boolean;
  currentPanel: PanelType | null;
  currentStep: number;

  // Guidance messages
  guidanceMessages: PanelGuidanceMessage[];
  currentGuidance: string | null;

  // Actions
  openPanel: (type: PanelType, options?: Partial<PanelState>) => void;
  closePanel: () => void;
  onStepChange: (step: number, stepName: string) => void;
  onPanelComplete: (data: any) => void;
  onPanelError: (error: string) => void;
  clearGuidance: () => void;

  // Computed
  getPanelComponent: () => WizardType | null;
  getPanelTitle: () => string;
}

/**
 * Guidance messages for each panel type at each step
 */
const PANEL_GUIDANCE: Record<PanelType, Record<number, string>> = {
  invoice_builder: {
    0: "Let's create your invoice. First, select or search for your client.",
    1: "Now add your line items. I can help calculate totals.",
    2: "Set the invoice date and due date. The default payment terms are applied automatically.",
    3: "Review everything and you're ready to send!",
  },
  expense_form: {
    0: "Enter the expense amount and select a category.",
    1: "Add a description and upload your receipt if you have one.",
    2: "Review and save your expense.",
  },
  client_form: {
    0: "Let's add a new client. Start with their basic contact info.",
    1: "Add their billing address for invoices.",
    2: "Set payment terms and tax information.",
    3: "Review and save the client.",
  },
  vendor_form: {
    0: "Add vendor contact information.",
    1: "Enter their address for record keeping.",
    2: "Set default payment terms.",
    3: "Review and save the vendor.",
  },
  leave_request: {
    0: "Select the type of leave you need.",
    1: "Choose your dates. I'll check your available balance.",
    2: "Review and submit your request.",
  },
  payment: {
    0: "Enter the payment amount and recipient details.",
    1: "Add the recipient's bank account information.",
    2: "Review and confirm. You'll be redirected to your bank for authorization.",
  },
  quote_builder: {
    0: "Select the client for this quote.",
    1: "Add the items or services you're quoting.",
    2: "Set validity period and terms.",
    3: "Review and send the quote.",
  },
  contract_builder: {
    0: "Select the client for this contract.",
    1: "Choose a contract template or start fresh.",
    2: "Fill in the contract details.",
    3: "Review and prepare for signing.",
  },
  employee_onboard: {
    0: "Enter the new employee's personal information.",
    1: "Set up their employment details and start date.",
    2: "Configure payroll and benefits.",
    3: "Review and complete onboarding.",
  },
  project_create: {
    0: "Name your project and set objectives.",
    1: "Define the timeline and milestones.",
    2: "Assign team members and set budgets.",
    3: "Review and create the project.",
  },
  report_builder: {
    0: "Select the type of report you need.",
    1: "Choose the date range and filters.",
    2: "Configure report sections and format.",
    3: "Generate and download your report.",
  },
};

/**
 * Completion messages for each panel type
 */
const COMPLETION_MESSAGES: Record<PanelType, string> = {
  invoice_builder: "Invoice created successfully! Would you like me to send it now?",
  expense_form: "Expense recorded! I've categorized it for your tax deductions.",
  client_form: "Client added! Ready to create their first invoice?",
  vendor_form: "Vendor added successfully!",
  leave_request: "Leave request submitted! Your manager will be notified.",
  payment: "Payment initiated! Check your bank for authorization.",
  quote_builder: "Quote created! Shall I send it to the client?",
  contract_builder: "Contract ready! Send it for e-signature?",
  employee_onboard: "Employee onboarded! I'll set up their access and send welcome materials.",
  project_create: "Project created! Team members have been notified.",
  report_builder: "Report generated! Would you like to schedule this report?",
};

/**
 * Panel titles
 */
const PANEL_TITLES: Record<PanelType, string> = {
  invoice_builder: 'Create Invoice',
  expense_form: 'Add Expense',
  client_form: 'Add Client',
  vendor_form: 'Add Vendor',
  leave_request: 'Request Leave',
  payment: 'New Payment',
  quote_builder: 'Create Quote',
  contract_builder: 'Create Contract',
  employee_onboard: 'Onboard Employee',
  project_create: 'Create Project',
  report_builder: 'Generate Report',
};

/**
 * Map panel types to wizard component types
 */
const PANEL_TO_WIZARD: Record<PanelType, WizardType> = {
  invoice_builder: 'invoice',
  expense_form: 'expense',
  client_form: 'client',
  vendor_form: 'vendor',
  leave_request: 'leave',
  payment: 'invoice', // Placeholder (payment has its own panel)
  quote_builder: 'invoice', // Reuse invoice for quotes (similar structure)
  contract_builder: 'invoice', // Placeholder
  employee_onboard: 'client', // Placeholder
  project_create: 'client', // Placeholder
  report_builder: 'invoice', // Placeholder
};

export function useChatWizardPanel(): UseChatWizardPanelReturn {
  const [panelState, setPanelState] = useState<PanelState>({
    type: null,
    isOpen: false,
    currentStep: 0,
    initialData: undefined,
    title: undefined,
    size: 'md',
  });

  const [guidanceMessages, setGuidanceMessages] = useState<PanelGuidanceMessage[]>([]);

  // Open a panel
  const openPanel = useCallback((type: PanelType, options?: Partial<PanelState>) => {
    setPanelState({
      type,
      isOpen: true,
      currentStep: 0,
      initialData: options?.initialData,
      title: options?.title || PANEL_TITLES[type],
      size: options?.size || 'md',
    });

    // Add initial guidance message
    const initialGuidance = PANEL_GUIDANCE[type]?.[0];
    if (initialGuidance) {
      setGuidanceMessages([{
        id: crypto.randomUUID(),
        step: 0,
        message: initialGuidance,
        type: 'guidance',
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Close panel
  const closePanel = useCallback(() => {
    setPanelState((prev) => ({
      ...prev,
      isOpen: false,
    }));
    // Clear guidance after a delay to allow animation
    setTimeout(() => {
      setGuidanceMessages([]);
      setPanelState({
        type: null,
        isOpen: false,
        currentStep: 0,
        initialData: undefined,
        title: undefined,
        size: 'md',
      });
    }, 300);
  }, []);

  // Handle step change
  const onStepChange = useCallback((step: number, stepName: string) => {
    setPanelState((prev) => ({ ...prev, currentStep: step }));

    // Add guidance message for new step
    if (panelState.type) {
      const guidance = PANEL_GUIDANCE[panelState.type]?.[step];
      if (guidance) {
        setGuidanceMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            step,
            message: guidance,
            type: 'guidance',
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [panelState.type]);

  // Handle panel completion
  const onPanelComplete = useCallback((data: any) => {
    if (panelState.type) {
      const completionMessage = COMPLETION_MESSAGES[panelState.type];
      setGuidanceMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          step: panelState.currentStep,
          message: completionMessage,
          type: 'completion',
          timestamp: new Date(),
        },
      ]);
    }
    closePanel();
  }, [panelState.type, panelState.currentStep, closePanel]);

  // Handle panel error
  const onPanelError = useCallback((error: string) => {
    setGuidanceMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        step: panelState.currentStep,
        message: `Something went wrong: ${error}. Please try again.`,
        type: 'error',
        timestamp: new Date(),
      },
    ]);
  }, [panelState.currentStep]);

  // Clear guidance messages
  const clearGuidance = useCallback(() => {
    setGuidanceMessages([]);
  }, []);

  // Get current guidance message
  const currentGuidance = useMemo(() => {
    if (guidanceMessages.length === 0) return null;
    return guidanceMessages[guidanceMessages.length - 1]?.message ?? null;
  }, [guidanceMessages]);

  // Get panel component type
  const getPanelComponent = useCallback((): WizardType | null => {
    if (!panelState.type) return null;
    return PANEL_TO_WIZARD[panelState.type] || null;
  }, [panelState.type]);

  // Get panel title
  const getPanelTitle = useCallback((): string => {
    if (!panelState.type) return '';
    return panelState.title || PANEL_TITLES[panelState.type];
  }, [panelState.type, panelState.title]);

  return {
    panelState,
    isOpen: panelState.isOpen,
    currentPanel: panelState.type,
    currentStep: panelState.currentStep,
    guidanceMessages,
    currentGuidance,
    openPanel,
    closePanel,
    onStepChange,
    onPanelComplete,
    onPanelError,
    clearGuidance,
    getPanelComponent,
    getPanelTitle,
  };
}
