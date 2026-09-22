// src/app/api/admin/moderators/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateModeratorSchema = z.object({
    username: z.string().min(3).max(20).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    status: z.enum(["active", "suspended", "banned"]).optional(),
});

async function checkSuperAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
    });

    if (!user?.isAdmin) return null;
    return session.user.id;
}

// PATCH - Update a moderator
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminId = await checkSuperAdmin();
        if (!adminId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateModeratorSchema.parse(body);

        const moderator = await prisma.user.findFirst({
            where: { id, isModerator: true },
        });

        if (!moderator) {
            return NextResponse.json({ error: "Moderator not found" }, { status: 404 });
        }

        const updates: Record<string, string | undefined> = {};
        if (validatedData.username) {
            updates.username = validatedData.username;
            updates.usernameLower = validatedData.username.toLowerCase();
        }
        if (validatedData.email) updates.email = validatedData.email;
        if (validatedData.password) updates.password = validatedData.password;
        if (validatedData.status) updates.status = validatedData.status;

        const updatedModerator = await prisma.user.update({
            where: { id },
            data: updates,
        });

        return NextResponse.json({
            success: true,
            moderator: {
                id: updatedModerator.id,
                username: updatedModerator.username,
                email: updatedModerator.email,
                status: updatedModerator.status,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Update moderator error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove a moderator
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminId = await checkSuperAdmin();
        if (!adminId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const moderator = await prisma.user.findFirst({
            where: { id, isModerator: true },
        });

        if (!moderator) {
            return NextResponse.json({ error: "Moderator not found" }, { status: 404 });
        }

        // Instead of completely deleting, we could just remove the isModerator flag
        // or delete the user entirely if they were created specifically as a moderator.
        // For now, let's just remove the flag to be safe, or delete if requested.
        // Given the prompt "CRUD", let's do a delete.
        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete moderator error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
