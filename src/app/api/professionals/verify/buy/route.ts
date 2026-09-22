// app/api/professionals/verify/buy/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const application = await prisma.professionalApplication.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                status: true,
                professionalId: true,
                isBadgePaid: true,
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            },
        });

        if (!application) {
            return NextResponse.json({ error: "No application found" }, { status: 404 });
        }

        if (application.isBadgePaid) {
            return NextResponse.json({ error: "Badge already purchased" }, { status: 400 });
        }

        // Fetch verified badge price from settings
        const priceSetting = await prisma.companySettings.findUnique({
            where: { key: "verifiedBadgePrice" },
        });
        const priceValue = priceSetting ? parseFloat(String(priceSetting.value)) : 29.0;

        // Create a PaymentIntent for the badge
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(priceValue * 100),
            currency: "usd",
            metadata: {
                professionalId: application.professionalId || "",
                applicationId: application.id,
                type: "verified_badge"
            },
            receipt_email: application.user.email || undefined,
        });

        return NextResponse.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error: any) {
        console.error("POST /api/professionals/verify/buy error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
