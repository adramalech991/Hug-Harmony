import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Get current user's unread warnings
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const warnings = await prisma.userWarning.findMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            include: {
                moderator: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ warnings });
    } catch (error) {
        console.error("Fetch user warnings error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
