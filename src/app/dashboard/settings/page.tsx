// src/app/dashboard/settings/page.tsx

"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Ban, Bell, Lock, User, Mail } from "lucide-react";

export default function SettingsPage() {
    const settingsSections = [
        {
            title: "Privacy & Safety",
            icon: Shield,
            items: [
                {
                    name: "Blocked Users",
                    description: "Manage users you've blocked",
                    href: "/dashboard/settings/blocked-users",
                    icon: Ban,
                },
            ],
        },
        {
            title: "Account",
            icon: User,
            items: [
                {
                    name: "Profile Settings",
                    description: "Update your profile information",
                    href: "/dashboard/edit-profile",
                    icon: User,
                },
            ],
        },
        {
            title: "Notifications",
            icon: Bell,
            items: [
                {
                    name: "Notification Preferences",
                    description: "Manage how you receive notifications",
                    href: "/dashboard/settings/notifications",
                    icon: Bell,
                },
            ],
        },
        {
            title: "Security",
            icon: Lock,
            items: [
                {
                    name: "Password & Security",
                    description: "Update your password and security settings",
                    href: "/dashboard/settings/security",
                    icon: Lock,
                },
                {
                    name: "Email Preferences",
                    description: "Manage email notifications",
                    href: "/dashboard/settings/email",
                    icon: Mail,
                },
            ],
        },
    ];

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-black dark:text-white">
                    Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {settingsSections.map((section) => (
                    <Card key={section.title} className="shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <section.icon className="h-5 w-5 text-[#F3CFC6]" />
                                {section.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {section.items.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <item.icon className="h-5 w-5 text-[#F3CFC6] mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-black dark:text-white">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
