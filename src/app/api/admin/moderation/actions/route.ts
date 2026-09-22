// src/app/api/admin/moderation/actions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const actionSchema = z.object({
    action: z.enum(["flag", "report"]),
    targetUserId: z.string(),
    reason: z.string().min(3),
    details: z.string().optional(),
    conversationId: z.string().optional(),
    messageId: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify moderator/admin status
        const actor = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true, isModerator: true },
        });

        if (!actor?.isAdmin && !actor?.isModerator) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validated = actionSchema.parse(body);

        if (validated.action === "flag") {
            // Create a specific note for flagging
            const note = await prisma.note.create({
                data: {
                    authorId: session.user.id,
                    targetUserId: validated.targetUserId,
                    content: `[FLAGGED] ${validated.reason}${validated.details ? `: ${validated.details}` : ""}${validated.conversationId ? ` (In conversation: ${validated.conversationId})` : ""}`,
                },
            });

            return NextResponse.json({
                success: true,
                message: "User flagged successfully",
                note,
            });
        } else if (validated.action === "report") {
            // Create a feedback/report for administrators
            // We'll use the Feedback model as the "ticketing system"
            const report = await prisma.feedback.create({
                data: {
                    userId: session.user.id, // The moderator is the one "submitting" this to admins
                    category: "complaint",
                    subject: `Moderator Report: ${validated.reason}`,
                    message: `Target User ID: ${validated.targetUserId}\nDetails: ${validated.details || "No additional details"}\n${validated.conversationId ? `Conversation: ${validated.conversationId}\n` : ""}${validated.messageId ? `Message ID: ${validated.messageId}\n` : ""}`,
                    status: "pending",
                    priority: "high",
                },
            });

            return NextResponse.json({
                success: true,
                message: "Reported to administrator successfully",
                report,
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Moderation action error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
