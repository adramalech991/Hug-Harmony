// src\app\api\settings\travel-rate\route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const travelRateSchema = z.object({
    travelRatePerMile: z.number().min(0),
});

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const setting = await prisma.companySettings.findUnique({
            where: { key: "travelRatePerMile" },
        });

        // Default to 1.5 if not set
        const travelRatePerMile = setting ? setting.value : 1.5;
        return NextResponse.json({ travelRatePerMile });
    } catch (error) {
        console.error("GET travel rate error:", error);
        return NextResponse.json(
            { error: "Failed to fetch travel rate" },
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
        const { travelRatePerMile } = travelRateSchema.parse(body);

        const updatedSetting = await prisma.companySettings.upsert({
            where: { key: "travelRatePerMile" },
            update: { value: travelRatePerMile, updatedAt: new Date() },
            create: {
                key: "travelRatePerMile",
                value: travelRatePerMile,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(updatedSetting);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("POST travel rate error:", error);
        return NextResponse.json(
            { error: "Failed to update travel rate" },
            { status: 500 }
        );
    }
}
