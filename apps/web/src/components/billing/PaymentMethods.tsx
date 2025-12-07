'use client';

import { useState } from 'react';
import { CreditCard, Trash2, Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { PaymentMethod } from '@/hooks/use-subscription';

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  onAdd: (paymentMethodId: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  isLoading: boolean;
}

const CARD_BRAND_ICONS: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
  diners: '💳',
  jcb: '💳',
  unionpay: '💳',
};

export function PaymentMethods({
  paymentMethods,
  onAdd,
  onRemove,
  onSetDefault,
  isLoading,
}: PaymentMethodsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [removeMethodId, setRemoveMethodId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddPaymentMethod = async () => {
    // In a real implementation, this would integrate with Stripe Elements
    // For now, we'll show a placeholder
    setIsProcessing(true);
    try {
      // Simulate Stripe token creation
      // const { token } = await stripe.createToken(cardElement);
      // await onAdd(token.id);

      // Placeholder: Generate a mock payment method ID
      const mockPaymentMethodId = `pm_${Math.random().toString(36).substr(2, 9)}`;
      await onAdd(mockPaymentMethodId);
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePaymentMethod = async () => {
    if (!removeMethodId) return;
    setIsProcessing(true);
    try {
      await onRemove(removeMethodId);
      setRemoveMethodId(null);
    } catch (error) {
      console.error('Failed to remove payment method:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsProcessing(true);
    try {
      await onSetDefault(id);
    } catch (error) {
      console.error('Failed to set default payment method:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your saved payment methods
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No payment methods</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a payment method to manage your subscription
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Card
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl">
                      {CARD_BRAND_ICONS[method.card.brand.toLowerCase()] || '💳'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {formatCardBrand(method.card.brand)} •••• {method.card.last4}
                        </p>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expires {method.card.expiryMonth.toString().padStart(2, '0')}/{method.card.expiryYear}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={isProcessing || isLoading}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemoveMethodId(method.id)}
                      disabled={method.isDefault || isProcessing || isLoading}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new credit or debit card to your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Placeholder for Stripe Elements */}
            <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Stripe Elements integration
              </p>
              <p className="text-xs text-muted-foreground">
                In production, this would show the secure Stripe card input form.
                For demo purposes, clicking &quot;Add Card&quot; will create a test card.
              </p>
            </div>

            {/* In a real implementation, you would add:
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
            */}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPaymentMethod} disabled={isProcessing}>
              {isProcessing ? 'Adding...' : 'Add Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Payment Method Confirmation */}
      <AlertDialog
        open={removeMethodId !== null}
        onOpenChange={(open) => !open && setRemoveMethodId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePaymentMethod}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
