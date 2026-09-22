"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Warning {
    id: string;
    title: string;
    message: string;
    severity: "low" | "medium" | "high";
    isRead: boolean;
    createdAt: string;
    moderator: {
        firstName: string;
        lastName: string;
    };
}

export default function WarningBanner() {
    const [warnings, setWarnings] = useState<Warning[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWarnings();
    }, []);

    const fetchWarnings = async () => {
        try {
            const response = await fetch("/api/user/warnings");
            if (response.ok) {
                const data = await response.json();
                setWarnings(data.warnings || []);
            }
        } catch (error) {
            console.error("Failed to fetch warnings:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (warningId: string) => {
        try {
            const response = await fetch(`/api/user/warnings/${warningId}/read`, {
                method: "POST",
            });

            if (response.ok) {
                setDismissed((prev) => new Set(prev).add(warningId));
            }
        } catch (error) {
            console.error("Failed to mark warning as read:", error);
        }
    };

    const activeWarnings = warnings.filter((w) => !dismissed.has(w.id));

    if (loading || activeWarnings.length === 0) return null;

    const getSeverityVariant = (severity: string) => {
        switch (severity) {
            case "high":
                return "destructive";
            case "medium":
                return "default";
            case "low":
                return "default";
            default:
                return "default";
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "high":
                return "text-red-600";
            case "medium":
                return "text-orange-600";
            case "low":
                return "text-yellow-600";
            default:
                return "text-gray-600";
        }
    };

    return (
        <div className="space-y-2 mb-4">
            {activeWarnings.map((warning) => (
                <Alert
                    key={warning.id}
                    variant={getSeverityVariant(warning.severity)}
                    className="relative border-l-4"
                >
                    <AlertTriangle className={`h-4 w-4 ${getSeverityColor(warning.severity)}`} />
                    <AlertTitle className="font-semibold">{warning.title}</AlertTitle>
                    <AlertDescription className="mt-2">
                        {warning.message}
                    </AlertDescription>
                    <div className="mt-2 text-xs text-gray-500">
                        Issued by: {warning.moderator.firstName} {warning.moderator.lastName}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => markAsRead(warning.id)}
                        aria-label="Dismiss warning"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </Alert>
            ))}
        </div>
    );
}
