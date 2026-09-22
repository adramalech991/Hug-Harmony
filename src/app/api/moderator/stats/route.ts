import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, isModerator: true },
    });

    if (!user?.isAdmin && !user?.isModerator) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Get stats
        const [
            pendingReports,
            activeBlocks,
            warningsIssuedToday,
            flaggedContent,
            totalActions,
        ] = await Promise.all([
            // Pending reports (using Feedback as ticketing system)
            prisma.feedback.count({
                where: {
                    status: "pending",
                    category: "complaint",
                },
            }),
            // Active conversation blocks
            prisma.conversationBlock.count({
                where: {
                    isActive: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: now } }
                    ]
                },
            }),
            // Warnings issued today
            prisma.userWarning.count({
                where: {
                    createdAt: { gte: today },
                },
            }),
            // Flagged content (Notes with [FLAGGED] prefix)
            prisma.note.count({
                where: {
                    content: { contains: "[FLAGGED]" },
                },
            }),
            // Total moderation actions (for moderator only)
            prisma.moderationAction.count({
                where: user.isAdmin ? {} : { moderatorId: session.user.id },
            }),
        ]);

        return NextResponse.json({
            pendingReports,
            activeBlocks,
            warningsIssued: warningsIssuedToday,
            flaggedContent,
            totalActions,
        });
    } catch (error) {
        console.error("Fetch moderator stats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
