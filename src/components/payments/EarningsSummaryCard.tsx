// src/components/payments/EarningsSummaryCard.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EarningsSummaryCardProps {
  title: string;
  gross: number;
  net: number;
  platformFee?: number;
  sessions: number;
  pending?: number;
  variant?: "current" | "lifetime";
}

export function EarningsSummaryCard({
  title,
  gross,
  net,
  platformFee,
  sessions,
  pending,
  variant = "current",
}: EarningsSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const isCurrent = variant === "current";

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        isCurrent
          ? "bg-gradient-to-br from-[#F3CFC6]/20 to-[#F3CFC6]/5 border-[#F3CFC6]/30"
          : "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200/30 dark:border-green-800/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </span>
          <div
            className={cn(
              "p-2 rounded-full",
              isCurrent
                ? "bg-[#F3CFC6]/30"
                : "bg-green-200/50 dark:bg-green-800/30"
            )}
          >
            {isCurrent ? (
              <Calendar className="w-4 h-4 text-[#D48C7E]" />
            ) : (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
          </div>
        </div>

        {/* Net Earnings (Primary) */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-black dark:text-white">
            {formatCurrency(net)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Net Earnings</p>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Gross</span>
            <span className="text-black dark:text-white">
              {formatCurrency(gross)}
            </span>
          </div>

          {platformFee !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platform Fee</span>
              <span className="text-[#D48C7E] font-medium">
                -{formatCurrency(platformFee)}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Sessions</span>
            <span className="text-black dark:text-white">{sessions}</span>
          </div>

          {pending !== undefined && pending > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pending</span>
              <span className="text-yellow-700 dark:text-yellow-400 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                {pending}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
