"use client";

import HealthDashboard from "@/components/admin/health/HealthDashboard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function ApplicationHealthPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;
        if (!session?.user?.isAdmin) {
            toast.error("Unauthorized: Admin access only");
            router.push("/admin/dashboard");
        }
    }, [session, status, router]);

    if (status === "loading") return <div className="p-8">Loading...</div>;
    if (!session?.user?.isAdmin) return null;

    return <HealthDashboard autoRefresh={true} refreshInterval={60} />;
}
