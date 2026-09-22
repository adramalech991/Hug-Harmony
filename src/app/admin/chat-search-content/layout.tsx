"use client";

import React from "react";
import AdminSessionProvider from "@/components/admin/AdminSessionProvider";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminHelpCenterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AdminSessionProvider>
            <AdminLayout>{children}</AdminLayout>
        </AdminSessionProvider>
    );
}
