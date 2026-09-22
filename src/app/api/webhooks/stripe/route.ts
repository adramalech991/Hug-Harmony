/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { confirmPaymentMethodAdded } from "@/lib/services/payments/payment-method.service";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature") as string;

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as any;
                const { type, applicationId, professionalId } = paymentIntent.metadata;

                if (type === "verified_badge" && applicationId) {
                    await prisma.$transaction(async (tx) => {
                        await tx.professionalApplication.update({
                            where: { id: applicationId },
                            data: { isBadgePaid: true },
                        });

                        if (professionalId) {
                            await tx.professional.update({
                                where: { id: professionalId },
                                data: { isVerified: true },
                            });
                        }
                    });
                    console.log(`Badge payment succeeded for app: ${applicationId}`);
                } else if (type === "fee_collection") {
                    // This would typically involve updating the FeeCharge record
                    // But our fee-charge.service.ts handles synchronous confirmation too
                    // This is a good fallback/safety net
                    console.log(`Fee collection succeeded for intent: ${paymentIntent.id}`);
                }
                break;
            }

            case "setup_intent.succeeded": {
                const setupIntent = event.data.object as any;
                const { professionalId } = setupIntent.metadata;

                if (professionalId) {
                    const paymentMethod = await stripe.paymentMethods.retrieve(
                        setupIntent.payment_method as string
                    );

                    await confirmPaymentMethodAdded(
                        professionalId,
                        paymentMethod.id,
                        {
                            last4: paymentMethod.card?.last4 || "****",
                            brand: paymentMethod.card?.brand || "unknown",
                            expiryMonth: paymentMethod.card?.exp_month || 0,
                            expiryYear: paymentMethod.card?.exp_year || 0,
                        }
                    );
                    console.log(`Payment method setup succeeded for pro: ${professionalId}`);
                }
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error(`Webhook handler failed: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
