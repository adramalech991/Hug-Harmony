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

    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get("actionType");
    const moderatorId = searchParams.get("moderatorId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};
        if (actionType) where.actionType = actionType;
        if (moderatorId) where.moderatorId = moderatorId;

        // Moderators can only see their own actions, admins see all
        if (!user.isAdmin) {
            where.moderatorId = session.user.id;
        }

        const [actions, total] = await Promise.all([
            prisma.moderationAction.findMany({
                where,
                include: {
                    moderator: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    targetUser: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.moderationAction.count({ where }),
        ]);

        return NextResponse.json({
            actions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Fetch audit log error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
