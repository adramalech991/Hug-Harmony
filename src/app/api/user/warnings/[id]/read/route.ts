import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - Mark warning as read
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: warningId } = await params;

    try {
        // Verify the warning belongs to the current user
        const warning = await prisma.userWarning.findUnique({
            where: { id: warningId },
            select: { userId: true },
        });

        if (!warning) {
            return NextResponse.json({ error: "Warning not found" }, { status: 404 });
        }

        if (warning.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Mark as read
        await prisma.userWarning.update({
            where: { id: warningId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mark warning as read error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
