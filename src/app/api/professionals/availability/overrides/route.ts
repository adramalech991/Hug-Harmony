import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
    getAvailabilityOverrides,
    createAvailabilityOverride,
    deleteAvailabilityOverride,
} from "@/lib/services/professionals";
import { z } from "zod";
import prisma from "@/lib/prisma";

const createOverrideSchema = z.object({
    startDate: z.string().datetime(), // ISO string
    endDate: z.string().datetime(), // ISO string
    reason: z.string().optional(),
});

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get professional ID for current user
    const application = await prisma.professionalApplication.findUnique({
        where: { userId: session.user.id },
        select: { professionalId: true, status: true },
    });

    if (
        !application ||
        application.status !== "APPROVED" ||
        !application.professionalId
    ) {
        return NextResponse.json(
            { error: "Not an approved professional" },
            { status: 403 }
        );
    }

    try {
        const overrides = await getAvailabilityOverrides(
            application.professionalId
        );
        return NextResponse.json(overrides);
    } catch (error) {
        console.error("Failed to fetch overrides:", error);
        return NextResponse.json(
            { error: "Failed to fetch overrides" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get professional ID for current user
    const application = await prisma.professionalApplication.findUnique({
        where: { userId: session.user.id },
        select: { professionalId: true, status: true },
    });

    if (
        !application ||
        application.status !== "APPROVED" ||
        !application.professionalId
    ) {
        return NextResponse.json(
            { error: "Not an approved professional" },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const { startDate, endDate, reason } = createOverrideSchema.parse(body);

        const override = await createAvailabilityOverride(
            application.professionalId,
            new Date(startDate),
            new Date(endDate),
            reason
        );

        return NextResponse.json(override);
    } catch (error) {
        console.error("Failed to create override:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid data", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create override" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Get professional ID for current user
    const application = await prisma.professionalApplication.findUnique({
        where: { userId: session.user.id },
        select: { professionalId: true, status: true },
    });

    if (
        !application ||
        application.status !== "APPROVED" ||
        !application.professionalId
    ) {
        return NextResponse.json(
            { error: "Not an approved professional" },
            { status: 403 }
        );
    }

    try {
        await deleteAvailabilityOverride(id, application.professionalId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete override:", error);
        return NextResponse.json(
            { error: "Failed to delete override" },
            { status: 500 }
        );
    }
}
