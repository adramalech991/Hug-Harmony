// src/lib/services/blocking.service.ts

import prisma from "@/lib/prisma";

/**
 * Centralized blocking service for consistent block enforcement across the app
 */

export interface BlockStatus {
    isBlocked: boolean;
    user1BlockedUser2: boolean;
    user2BlockedUser1: boolean;
}

/**
 * Check bidirectional block status between two users
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @returns Block status object indicating if either user has blocked the other
 */
export async function checkBlockStatus(
    userId1: string,
    userId2: string
): Promise<BlockStatus> {
    if (!userId1 || !userId2) {
        return {
            isBlocked: false,
            user1BlockedUser2: false,
            user2BlockedUser1: false,
        };
    }

    // Check both directions in a single query
    const blocks = await prisma.block.findMany({
        where: {
            OR: [
                { blockerId: userId1, blockedId: userId2 },
                { blockerId: userId2, blockedId: userId1 },
            ],
        },
        select: {
            blockerId: true,
            blockedId: true,
        },
    });

    const user1BlockedUser2 = blocks.some(
        (b) => b.blockerId === userId1 && b.blockedId === userId2
    );
    const user2BlockedUser1 = blocks.some(
        (b) => b.blockerId === userId2 && b.blockedId === userId1
    );

    return {
        isBlocked: blocks.length > 0,
        user1BlockedUser2,
        user2BlockedUser1,
    };
}

/**
 * Check if two users can interact (no blocks between them)
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @returns True if users can interact, false if blocked
 */
export async function canUsersInteract(
    userId1: string,
    userId2: string
): Promise<boolean> {
    const status = await checkBlockStatus(userId1, userId2);
    return !status.isBlocked;
}

/**
 * Check if a specific user is blocked by another user
 * @param blockerId User who may have blocked
 * @param blockedId User who may be blocked
 * @returns True if blocked, false otherwise
 */
export async function isUserBlocked(
    blockerId: string,
    blockedId: string
): Promise<boolean> {
    const block = await prisma.block.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId,
                blockedId,
            },
        },
    });

    return !!block;
}

/**
 * Get all user IDs that the current user has blocked
 * @param userId Current user ID
 * @returns Array of blocked user IDs
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
    });

    return blocks.map((b) => b.blockedId);
}

/**
 * Get all user IDs who have blocked the current user
 * @param userId Current user ID
 * @returns Array of user IDs who blocked this user
 */
export async function getUsersWhoBlockedMe(userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
    });

    return blocks.map((b) => b.blockerId);
}

/**
 * Get all user IDs involved in blocks (both directions)
 * @param userId Current user ID
 * @returns Array of user IDs that cannot interact with current user
 */
export async function getAllBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
        where: {
            OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: {
            blockerId: true,
            blockedId: true,
        },
    });

    const blockedIds = new Set<string>();
    blocks.forEach((block) => {
        if (block.blockerId === userId) {
            blockedIds.add(block.blockedId);
        } else {
            blockedIds.add(block.blockerId);
        }
    });

    return Array.from(blockedIds);
}

/**
 * Filter out blocked users from an array of user IDs
 * @param currentUserId Current user ID
 * @param userIds Array of user IDs to filter
 * @returns Filtered array with blocked users removed
 */
export async function filterBlockedUsers(
    currentUserId: string,
    userIds: string[]
): Promise<string[]> {
    if (userIds.length === 0) return [];

    const blockedIds = await getAllBlockedUserIds(currentUserId);
    return userIds.filter((id) => !blockedIds.includes(id));
}

/**
 * Resolve professional ID to user ID for blocking
 * @param professionalId Professional ID
 * @returns User ID associated with the professional, or null if not found
 */
export async function resolveProfessionalToUserId(
    professionalId: string
): Promise<string | null> {
    const application = await prisma.professionalApplication.findFirst({
        where: { professionalId },
        select: { userId: true },
    });

    return application?.userId || null;
}

/**
 * Check if a user has blocked a professional
 * @param userId User ID
 * @param professionalId Professional ID
 * @returns True if blocked, false otherwise
 */
export async function isProfessionalBlocked(
    userId: string,
    professionalId: string
): Promise<boolean> {
    const professionalUserId = await resolveProfessionalToUserId(professionalId);
    if (!professionalUserId) return false;

    return isUserBlocked(userId, professionalUserId);
}

/**
 * Check if two users can interact, with professional ID support
 * @param userId1 First user ID
 * @param targetId Second user ID or professional ID
 * @param targetType Type of target ('user' or 'professional')
 * @returns True if users can interact, false if blocked
 */
export async function canInteractWithTarget(
    userId1: string,
    targetId: string,
    targetType: "user" | "professional" = "user"
): Promise<boolean> {
    let userId2 = targetId;

    if (targetType === "professional") {
        const resolvedId = await resolveProfessionalToUserId(targetId);
        if (!resolvedId) return false;
        userId2 = resolvedId;
    }

    return canUsersInteract(userId1, userId2);
}
