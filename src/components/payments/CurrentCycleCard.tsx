// src/app/dashboard/payment/components/CurrentCycleCard.tsx

"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CurrentCycleCardProps {
  daysRemaining: number;
  hoursUntilDeadline: number;
  hoursUntilCutoff: number;
  progress: number;
  isProcessing: boolean;
}

export function CurrentCycleCard({
  daysRemaining,
  hoursUntilCutoff,
  progress,
  isProcessing,
}: CurrentCycleCardProps) {
  // Format time until cutoff
  const formatCutoffTime = () => {
    if (hoursUntilCutoff <= 0) return "Processing...";

    const days = Math.floor(hoursUntilCutoff / 24);
    const hours = hoursUntilCutoff % 24;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours} hours`;
  };

  // Determine urgency color
  const getUrgencyColor = () => {
    if (daysRemaining <= 1) return "text-red-500";
    if (daysRemaining <= 3) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className="bg-white dark:bg-gray-800 border border-[#F3CFC6]/30 dark:border-[#C4C4C4]/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Cycle Progress
            </span>
            <div className="p-2 rounded-full bg-[#F3CFC6]/20">
              {isProcessing ? (
                <Loader2 className="w-4 h-4 text-[#D48C7E] animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 text-[#D48C7E]" />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
            <div className="flex justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>Mon</span>
              <span>Sun</span>
            </div>
          </div>

          {/* Days Remaining */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${getUrgencyColor()}`}>
                {daysRemaining}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                day{daysRemaining !== 1 ? "s" : ""} remaining
              </p>
            </div>

            {/* Cutoff Time */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-black dark:text-white">
                <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span className="font-semibold">{formatCutoffTime()}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">until payout</p>
            </div>
          </div>

          {/* Processing Badge */}
          {isProcessing && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-xs text-[#D48C7E] font-bold">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Processing payouts...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
