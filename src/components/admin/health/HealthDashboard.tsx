"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { RefreshCw, Activity, LayoutDashboard } from "lucide-react";
import PerformanceCard from "./PerformanceCard";
import ApiMetricsCard from "./ApiMetricsCard";
import DataVolumeChart from "./DataVolumeChart";
import VendorMetricsCard from "./VendorMetricsCard";
import type {
    WebPerformanceMetrics,
    ApiPerformanceData,
    DataVolumeStats,
    VendorMetricsData,
} from "@/types/health";

interface HealthDashboardProps {
    autoRefresh?: boolean;
    refreshInterval?: number; // in seconds
}

export default function HealthDashboard({
    autoRefresh = true,
    refreshInterval = 60,
}: HealthDashboardProps) {
    const [performanceData, setPerformanceData] = useState<WebPerformanceMetrics | null>(null);
    const [apiData, setApiData] = useState<ApiPerformanceData | null>(null);
    const [volumeData, setVolumeData] = useState<DataVolumeStats | null>(null);
    const [vendorData, setVendorData] = useState<VendorMetricsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAllData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [healthRes, apiRes, volumeRes, vendorRes] = await Promise.all([
                fetch("/api/admin/health"),
                fetch("/api/admin/health/api-performance"),
                fetch("/api/admin/health/data-volume"),
                fetch("/api/admin/health/vendor-metrics"),
            ]);

            if (healthRes.ok) {
                const healthData = await healthRes.json();
                setPerformanceData(healthData.webPerformance);
            }

            if (apiRes.ok) {
                const apiData = await apiRes.json();
                setApiData(apiData);
            }

            if (volumeRes.ok) {
                const volumeData = await volumeRes.json();
                setVolumeData(volumeData);
            }

            if (vendorRes.ok) {
                const vendorData = await vendorRes.json();
                setVendorData(vendorData);
            }

            setLastRefresh(new Date());
        } catch (error) {
            console.error("Failed to fetch health data:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();

        if (autoRefresh) {
            const interval = setInterval(fetchAllData, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [fetchAllData, autoRefresh, refreshInterval]);

    const getSystemStatus = () => {
        if (!performanceData || !apiData || !vendorData) {
            return { status: "Unknown", color: "bg-gray-500" };
        }

        const hasIssues =
            apiData.overallHealth !== "healthy" ||
            vendorData.overallStatus !== "all_operational" ||
            performanceData.serverResponseTime > 300;

        const hasCritical =
            apiData.overallHealth === "critical" ||
            vendorData.overallStatus === "major_outage" ||
            performanceData.serverResponseTime > 500;

        if (hasCritical) {
            return { status: "Critical", color: "bg-red-500" };
        }
        if (hasIssues) {
            return { status: "Warning", color: "bg-yellow-500" };
        }
        return { status: "Healthy", color: "bg-green-500" };
    };

    const systemStatus = getSystemStatus();

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-black/60 mb-2">
                <Link
                    href="/admin/dashboard"
                    className="flex items-center hover:text-black transition-colors"
                >
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    Dashboard
                </Link>
                <span>/</span>
                <span className="text-black font-medium">Application Health</span>
            </nav>

            {/* Header */}
            <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] text-black dark:text-white shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-black">
                        <div className="flex items-center gap-3">
                            <Activity className="h-8 w-8" />
                            <div>
                                <CardTitle className="text-2xl font-bold">
                                    Application Health
                                </CardTitle>
                                <p className="text-sm opacity-80">
                                    Monitor system performance and vendor status
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm opacity-80 font-medium text-black">
                                    System Status:
                                </span>
                                <Badge className={`${systemStatus.color} text-white border-0 shadow-sm`}>
                                    {systemStatus.status}
                                </Badge>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchAllData}
                                disabled={isRefreshing}
                                className="bg-white/20 border-white/30 hover:bg-white/40 text-black flex items-center gap-2"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Last Refresh Info */}
            {lastRefresh && (
                <div className="text-xs text-gray-400 text-right">
                    Last updated: {lastRefresh.toLocaleTimeString()} | Auto-refresh:{" "}
                    {autoRefresh ? `every ${refreshInterval}s` : "off"}
                </div>
            )}

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Web Performance */}
                <PerformanceCard metrics={performanceData} isLoading={isLoading} />

                {/* Vendor Metrics */}
                <VendorMetricsCard data={vendorData} isLoading={isLoading} />
            </div>

            {/* API Performance - Full Width */}
            <ApiMetricsCard data={apiData} isLoading={isLoading} />

            {/* Data Volume - Full Width */}
            <DataVolumeChart data={volumeData} isLoading={isLoading} />
        </div>
    );
}
