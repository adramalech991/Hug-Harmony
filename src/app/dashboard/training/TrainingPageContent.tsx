// src/app/dashboard/training/TrainingPageContent.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrainingVideosTab from "@/components/training/TrainingVideosTab";
import CertificationQuizTab from "@/components/training/CertificationQuizTab";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Sparkles, ClipboardCheck, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { toast } from "sonner";
import { AlertCircle, Lock } from "lucide-react";
import { Label } from "@/components/ui/label";

interface OnboardingStatus {
    step: string;
    application: {
        id: string;
        isVerified: boolean;
        isBadgePaid: boolean;
        alreadyExperienced: boolean;
    } | null;
    verifiedBadgePrice: number;
}

export default function TrainingPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const defaultTab = searchParams.get("tab") || "videos";

    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/professionals/onboarding/status");
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (err) {
            console.error("Failed to fetch onboarding status:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Professional Training Center
                </h1>
                <p className="text-muted-foreground">
                    Master the skills needed to be a successful professional cuddler on
                    Hug Harmony.
                </p>
            </motion.div>

            {/* Verification Status Card */}
            {isLoading ? (
                <Skeleton className="h-32 w-full rounded-xl" />
            ) : status?.application ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {status.application.isVerified ? (
                        <div className="bg-green-50 text-green-800 p-6 rounded-xl flex items-center gap-4 border border-green-200 shadow-sm">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <BadgeCheck className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">You are Verified!</h4>
                                <p className="text-sm opacity-90">The verified badge is now displayed on your professional profile, helping you stand out to clients.</p>
                            </div>
                        </div>
                    ) : (
                        <Card className="border-blue-200 bg-blue-50 shadow-md overflow-hidden">
                            <CardHeader className="pb-2 bg-blue-100/50">
                                <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                                    <BadgeCheck className="h-5 w-5 text-blue-600" />
                                    Get Your Verified Badge
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div className="flex-1 space-y-2">
                                        <p className="text-sm text-blue-700 font-medium">
                                            Verified professionals get 3x more bookings on average!
                                        </p>
                                        <p className="text-sm text-blue-600/80">
                                            You&apos;ve been approved as an experienced professional. To get your verified badge, you can either complete the training or purchase it directly.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                                        <Button
                                            variant="outline"
                                            className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-100 h-11 px-6"
                                            onClick={() => router.push('/dashboard/edit-profile/professional-application/quiz')}
                                        >
                                            <ClipboardCheck className="mr-2 h-4 w-4" />
                                            Take Quiz
                                        </Button>
                                        <Button
                                            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 shadow-md"
                                            onClick={() => setIsDialogOpen(true)}
                                            disabled={status.application.isBadgePaid}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
                                            {status.application.isBadgePaid ? "Processing..." : `Buy Verified Badge ($${status.verifiedBadgePrice})`}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            ) : null}

            <BadgePurchaseDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                price={status?.verifiedBadgePrice || 29}
                onSuccess={() => {
                    fetchStatus();
                    setIsDialogOpen(false);
                }}
            />

            <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="videos">Training Videos</TabsTrigger>
                    <TabsTrigger value="quiz">Certification Quiz</TabsTrigger>
                </TabsList>

                <TabsContent value="videos" className="focus-visible:outline-none">
                    <TrainingVideosTab />
                </TabsContent>

                <TabsContent value="quiz" className="focus-visible:outline-none">
                    <CertificationQuizTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function BadgePurchaseForm({
    price,
    onSuccess,
    onCancel
}: {
    price: number;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Step 1: Create PaymentIntent on server
            const res = await fetch("/api/professionals/verify/buy", { method: "POST" });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to initiate purchase");

            // Step 2: Confirm Payment on client
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) throw new Error("Card element not found");

            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                data.clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                    },
                }
            );

            if (stripeError) throw new Error(stripeError.message);

            if (paymentIntent?.status === "succeeded") {
                toast.success("Badge purchased successfully!");
                onSuccess();
            } else {
                throw new Error("Payment status: " + paymentIntent?.status);
            }
        } catch (err: any) {
            console.error("Purchase error:", err);
            setError(err.message || "Failed to complete purchase");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 border border-dashed border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Verification Service</span>
                    <span className="font-medium">${price}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span>Total Amount</span>
                    <span>${price}</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800 dark:text-blue-300">
                        <p className="font-bold mb-1">Secure Checkout</p>
                        <p className="opacity-80">Your payment information is processed securely via Stripe. Your security is our priority.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Card Details</Label>
                    <div className="p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: "14px",
                                        color: "#1a202c",
                                        "::placeholder": { color: "#aab7c4" },
                                    },
                                    invalid: { color: "#9e2146" },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <DialogFooter>
                <Button
                    variant="ghost"
                    type="button"
                    className="rounded-full"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                    disabled={isSubmitting || !stripe}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        "Complete Purchase"
                    )}
                </Button>
            </DialogFooter>
        </form>
    );
}

function BadgePurchaseDialog({
    open,
    onOpenChange,
    price,
    onSuccess
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    price: number;
    onSuccess: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BadgeCheck className="h-6 w-6 text-blue-600" />
                        Verify Your Profile
                    </DialogTitle>
                    <DialogDescription>
                        Get instant verification and stand out in the marketplace.
                    </DialogDescription>
                </DialogHeader>

                <Elements stripe={getStripe()}>
                    <BadgePurchaseForm
                        price={price}
                        onSuccess={onSuccess}
                        onCancel={() => onOpenChange(false)}
                    />
                </Elements>
            </DialogContent>
        </Dialog>
    );
}