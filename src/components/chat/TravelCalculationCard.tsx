// src/components/chat/TravelCalculationCard.tsx
import React from "react";
import { TravelCalculation } from "@/types/chat";
import { Navigation, MapPin, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";

interface TravelCalculationCardProps {
    calculation: TravelCalculation;
}

const TravelCalculationCard: React.FC<TravelCalculationCardProps> = ({ calculation }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#F3CFC6] overflow-hidden shadow-sm max-w-sm w-full">
            <div className="bg-[#F3CFC6] px-4 py-2 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-black" />
                <span className="text-black font-bold text-sm">Travel Expense Proof</span>
            </div>

            <div className="p-4 space-y-4">
                {/* Route Info */}
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
                            <MapPin className="h-3 w-3 text-red-500" />
                        </div>
                        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                            <div className="text-xs">
                                <p className="text-muted-foreground font-medium">From</p>
                                <p className="font-semibold truncate text-black dark:text-white" title={calculation.fromAddress}>
                                    {calculation.fromAddress}
                                </p>
                            </div>
                            <div className="text-xs">
                                <p className="text-muted-foreground font-medium">To</p>
                                <p className="font-semibold truncate text-black dark:text-white" title={calculation.toAddress}>
                                    {calculation.toAddress}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Distance</span>
                        <div className="flex items-center gap-1">
                            <Navigation className="h-3 w-3 text-[#D8A7B1]" />
                            <span className="font-bold text-sm text-black dark:text-white">{calculation.distanceMiles.toFixed(1)} miles</span>
                        </div>
                    </div>
                    {calculation.durationMinutes && (
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Est. Time</span>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-[#D8A7B1]" />
                                <span className="font-bold text-sm text-black dark:text-white">{Math.round(calculation.durationMinutes)} mins</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Calculation Breakdown */}
                <div className="bg-[#F3CFC6]/10 p-3 rounded-xl border border-[#F3CFC6]/20">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Rate:</span>
                        <span className="text-xs font-semibold text-black dark:text-white">${calculation.ratePerMile.toFixed(2)} / mile</span>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                        <span className="text-sm text-black dark:text-white">Total Travel Fee:</span>
                        <div className="flex items-center text-[#D8A7B1]">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-lg">{calculation.fee.toFixed(2)}</span>
                        </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground text-center mt-2 italic">
                        Calculated on {format(new Date(calculation.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TravelCalculationCard;
