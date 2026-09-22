// src/app/api/settings/verified-badge-price/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const badgePriceSchema = z.object({
    verifiedBadgePrice: z.number().min(0),
});

export async function GET() {
    try {
        const setting = await prisma.companySettings.findUnique({
            where: { key: "verifiedBadgePrice" },
        });

        const verifiedBadgePrice = setting ? setting.value : 29.0;
        return NextResponse.json({ verifiedBadgePrice });
    } catch (error) {
        console.error("GET verified badge price error:", error);
        return NextResponse.json(
            {
                error: "Internal server error: Failed to fetch verified badge price",
            },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized: Admin access required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { verifiedBadgePrice } = badgePriceSchema.parse(body);

        const updatedSetting = await prisma.companySettings.upsert({
            where: { key: "verifiedBadgePrice" },
            update: { value: verifiedBadgePrice, updatedAt: new Date() },
            create: {
                key: "verifiedBadgePrice",
                value: verifiedBadgePrice,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(updatedSetting);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            {
                error: "Internal server error: Failed to update verified badge price",
            },
            { status: 500 }
        );
    }
}
