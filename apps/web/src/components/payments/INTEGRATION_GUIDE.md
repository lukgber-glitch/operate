# Payment Wizard Integration Guide

## Overview

The Payment Wizard allows users to initiate payments via TrueLayer's Payment Initiation Service (PIS). This guide shows how to integrate the payment flow into your pages.

## Quick Start

### 1. Import Required Hooks

```typescript
import { useChatWizardPanel } from '@/hooks/useChatWizardPanel';
import { useToast } from '@/components/ui/use-toast';
import type { Payment } from '@/hooks/use-payments';
```

### 2. Setup in Your Component

```typescript
export default function YourPage() {
  const { toast } = useToast();
  const { openPanel, closePanel, onStepChange, onPanelComplete, isOpen, panelState, getPanelTitle } = useChatWizardPanel();

  const handlePaymentComplete = (payment: Payment) => {
    toast({
      title: 'Payment initiated',
      description: `Payment of ${payment.amount} ${payment.currency} has been created.`,
    });
    onPanelComplete(payment);
    // Refresh your data or navigate
  };

  return (
    <>
      {/* Your page content */}

      {/* Payment Wizard Panel */}
      <WizardPanelContainer
        type={panelState.type}
        isOpen={isOpen}
        onClose={closePanel}
        onComplete={handlePaymentComplete}
        onStepChange={onStepChange}
        title={getPanelTitle()}
        size={panelState.size}
        initialData={panelState.initialData}
      />
    </>
  );
}
```

### 3. Open the Payment Wizard

```typescript
// From a button click
const handlePayBill = () => {
  openPanel('payment', {
    title: 'Pay Bill',
    size: 'md',
    initialData: {
      amount: bill.amount,
      currency: bill.currency,
      beneficiaryName: bill.vendor.name,
      reference: `Bill #${bill.number}`,
      billId: bill.id,
      description: bill.description,
    },
  });
};
```

## Example: Adding "Pay Now" to Expense Detail Page

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { WizardPanelContainer } from '@/components/panels/wizards/WizardPanelContainer';
import { useChatWizardPanel } from '@/hooks/useChatWizardPanel';
import { useToast } from '@/components/ui/use-toast';
import type { Payment } from '@/hooks/use-payments';

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const { openPanel, closePanel, onStepChange, onPanelComplete, isOpen, panelState, getPanelTitle } = useChatWizardPanel();

  // Your expense data
  const expense = {
    id: params.id,
    amount: 1250.00,
    currency: 'EUR',
    vendor: { name: 'Office Supplies Ltd' },
    description: 'Office supplies Q4',
  };

  const handlePayExpense = () => {
    openPanel('payment', {
      title: 'Pay Expense',
      size: 'md',
      initialData: {
        amount: expense.amount,
        currency: expense.currency,
        beneficiaryName: expense.vendor.name,
        reference: `Expense #${expense.id}`,
        description: expense.description,
      },
    });
  };

  const handlePaymentComplete = (payment: Payment) => {
    toast({
      title: 'Payment initiated',
      description: 'Redirecting to your bank for authorization...',
    });
    onPanelComplete(payment);
  };

  return (
    <div>
      {/* Your expense details */}

      <Button
        onClick={handlePayExpense}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Pay Now
      </Button>

      {/* Payment Wizard Panel */}
      <WizardPanelContainer
        type={panelState.type}
        isOpen={isOpen}
        onClose={closePanel}
        onComplete={handlePaymentComplete}
        onStepChange={onStepChange}
        title={getPanelTitle()}
        size={panelState.size}
        initialData={panelState.initialData}
      />
    </div>
  );
}
```

## Payment Flow

1. **User clicks "Pay Now"** → Opens payment wizard
2. **Step 1: Payment Details** → User confirms amount, recipient, reference
3. **Step 2: Bank Account** → User enters IBAN or UK account details
4. **Step 3: Confirm** → User reviews and clicks "Confirm & Pay"
5. **Redirect** → User redirected to bank for SCA authorization
6. **Callback** → User returns to `/finance/payments/callback` with status
7. **Complete** → Payment status updated

## Initial Data Options

```typescript
interface PaymentInitialData {
  amount?: number;              // Pre-fill payment amount
  currency?: 'EUR' | 'GBP';    // Pre-fill currency
  beneficiaryName?: string;     // Pre-fill recipient name
  reference?: string;           // Pre-fill payment reference
  billId?: string;              // Link to bill (optional)
  invoiceId?: string;           // Link to invoice (optional)
  description?: string;         // Additional description
}
```

## Using the Standalone Components

### PaymentList

Display a list of payments with filters:

```typescript
import { PaymentList } from '@/components/payments';

<PaymentList
  filters={{ status: 'AUTHORIZED' }}
  onPaymentClick={(payment) => console.log(payment)}
/>
```

### PaymentStatus

Show payment status badge:

```typescript
import { PaymentStatus } from '@/components/payments';

<PaymentStatus
  status="AUTHORIZED"
  size="md"
  showIcon={true}
/>
```

## Hook: usePayments

Direct API access:

```typescript
import { usePayments } from '@/hooks/use-payments';

const { createPayment, getPayment, listPayments, cancelPayment, isLoading, error } = usePayments();

// Create payment
const payment = await createPayment({
  amount: 100.00,
  currency: 'EUR',
  beneficiary: {
    name: 'Acme Corp',
    type: 'IBAN',
    iban: 'DE89370400440532013000',
  },
  reference: 'Invoice #123',
  metadata: {
    invoiceId: '123',
  },
});

// Get payment status
const payment = await getPayment('payment-id');

// List payments
await listPayments({ status: 'AUTHORIZED', currency: 'EUR' });

// Cancel payment
await cancelPayment('payment-id');
```

## Payment Statuses

- `PENDING` - Payment created, awaiting authorization
- `AUTHORIZATION_REQUIRED` - User needs to authorize at bank
- `AUTHORIZING` - User is currently authorizing
- `AUTHORIZED` - User has authorized, payment processing
- `EXECUTED` - Payment executed by bank
- `SETTLED` - Payment settled successfully
- `FAILED` - Payment failed
- `CANCELLED` - Payment cancelled

## Notes

- All payments require Strong Customer Authentication (SCA)
- Users are redirected to their bank for authorization
- The callback page handles the return flow
- Payments cannot be reversed once authorized
- IBAN validation is performed on backend
- Supports EUR and GBP currencies
