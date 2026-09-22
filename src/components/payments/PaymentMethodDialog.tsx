// src/components/payments/PaymentMethodDialog.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSetupPaymentMethod } from "@/hooks/payments/usePaymentMethod";
import { CardBrandIcon } from "./CardBrandIcon";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";

interface PaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isUpdate?: boolean;
}

function PaymentMethodForm({
  onClose,
  onSuccess,
  isUpdate,
}: {
  onClose: () => void;
  onSuccess: () => void;
  isUpdate: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { startSetup, confirmSetup, isLoading, isConfirming, error: apiError } =
    useSetupPaymentMethod();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [setupStarted, setSetupStarted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setCardError(null);

    try {
      // Step 1: Start setup (get setup intent from backend)
      let currentSecret = clientSecret;
      if (!setupStarted || !currentSecret) {
        const result = await startSetup();
        currentSecret = result.clientSecret;
        setClientSecret(currentSecret);
        setSetupStarted(true);
      }

      // Step 2: Confirm with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        currentSecret!,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!setupIntent || setupIntent.status !== "succeeded") {
        throw new Error("Setup failed");
      }

      // Step 3: Confirm with backend
      await confirmSetup(setupIntent.payment_method as string);

      toast.success(
        isUpdate
          ? "Payment method updated successfully"
          : "Payment method added successfully"
      );
      onSuccess();
    } catch (err: any) {
      console.error("Payment method error:", err);
      setCardError(err.message || "Failed to add payment method");
      toast.error(err.message || "Failed to add payment method");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Card Details</Label>
        <div className="p-3 border rounded-md bg-white dark:bg-gray-950">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#424770",
                  "::placeholder": { color: "#aab7c4" },
                },
                invalid: { color: "#9e2146" },
              },
            }}
            onChange={(e) => setCardError(e.error ? e.error.message : null)}
          />
        </div>
      </div>

      {/* Accepted Cards */}
      <div className="flex items-center gap-2 py-2">
        <span className="text-xs text-[#C4C4C4]">We accept:</span>
        <div className="flex items-center gap-1">
          <CardBrandIcon brand="visa" size="sm" />
          <CardBrandIcon brand="mastercard" size="sm" />
          <CardBrandIcon brand="amex" size="sm" />
          <CardBrandIcon brand="discover" size="sm" />
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-[#C4C4C4] bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <Lock className="w-4 h-4 shrink-0" />
        <span>
          Your card information is encrypted and securely processed via Stripe. We
          never store your full card details.
        </span>
      </div>

      {/* Error Display */}
      {(cardError || apiError) && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cardError || apiError}</span>
        </div>
      )}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !stripe || isLoading || isConfirming}
          className="bg-[#F3CFC6] hover:bg-[#F3CFC6]/80 text-black"
        >
          {isSubmitting || isLoading || isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {isUpdate ? "Update Card" : "Add Card"}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PaymentMethodDialog({
  open,
  onClose,
  onSuccess,
  isUpdate = false,
}: PaymentMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#C4C4C4]" />
            {isUpdate ? "Update Payment Method" : "Add Payment Method"}
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Enter your new card details to update your payment method."
              : "Add a card for platform fee collection. You'll only be charged at the end of each billing cycle."}
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={getStripe()}>
          <PaymentMethodForm
            onClose={onClose}
            onSuccess={onSuccess}
            isUpdate={isUpdate}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
