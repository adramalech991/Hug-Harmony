// src/app/dashboard/settings/blocked-users/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ban, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface BlockedUser {
    id: string;
    blockedId: string;
    blockedUser: {
        id: string;
        name: string;
        avatar?: string;
        isProfessional?: boolean;
    };
    createdAt: string;
}

export default function BlockedUsersPage() {
    const router = useRouter();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [unblockingId, setUnblockingId] = useState<string | null>(null);

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const fetchBlockedUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/blocks");

            if (!response.ok) {
                throw new Error("Failed to fetch blocked users");
            }

            const data = await response.json();
            setBlockedUsers(data.blocks || []);
        } catch (error) {
            console.error("Error fetching blocked users:", error);
            alert("Failed to load blocked users. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (blockedUserId: string) => {
        try {
            setUnblockingId(blockedUserId);
            const response = await fetch(`/api/blocks/${blockedUserId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to unblock user");
            }

            // Remove from list
            setBlockedUsers((prev) =>
                prev.filter((block) => block.blockedId !== blockedUserId)
            );
        } catch (error) {
            console.error("Error unblocking user:", error);
            alert("Failed to unblock user. Please try again.");
        } finally {
            setUnblockingId(null);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/dashboard/settings")}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white">
                        Blocked Users
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage users you&apos;ve blocked
                    </p>
                </div>
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Ban className="h-5 w-5 text-[#F3CFC6]" />
                        Blocked Users ({blockedUsers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-[#F3CFC6]" />
                        </div>
                    ) : blockedUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <Ban className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                                No blocked users
                            </p>
                            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                                You haven&apos;t blocked anyone yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {blockedUsers.map((block) => (
                                <div
                                    key={block.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-12 w-12 shrink-0">
                                            <AvatarImage
                                                src={block.blockedUser.avatar}
                                                alt={block.blockedUser.name}
                                            />
                                            <AvatarFallback>
                                                {block.blockedUser.name?.charAt(0) || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-black dark:text-white truncate">
                                                    {block.blockedUser.name}
                                                </p>
                                                {block.blockedUser.isProfessional && (
                                                    <span className="inline-block bg-black text-[var(--brand-pink)] text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0">
                                                        PRO
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Blocked {format(new Date(block.createdAt), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUnblock(block.blockedId)}
                                        disabled={unblockingId === block.blockedId}
                                        className="shrink-0"
                                    >
                                        {unblockingId === block.blockedId ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Unblocking...
                                            </>
                                        ) : (
                                            "Unblock"
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <CardContent className="pt-6">
                    <h3 className="font-semibold text-black dark:text-white mb-2">
                        What happens when you block someone?
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-[#F3CFC6] mt-0.5">•</span>
                            <span>They won&apos;t be able to view your profile</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#F3CFC6] mt-0.5">•</span>
                            <span>They won&apos;t be able to send you messages</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#F3CFC6] mt-0.5">•</span>
                            <span>They won&apos;t appear in your professionals directory</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#F3CFC6] mt-0.5">•</span>
                            <span>They won&apos;t be able to book appointments with you</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#F3CFC6] mt-0.5">•</span>
                            <span>Existing conversations will be hidden</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#F3CFC6] mt-0.5">•</span>
                            <span className="font-medium">They will not be notified</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
