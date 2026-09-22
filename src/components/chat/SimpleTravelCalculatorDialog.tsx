// src/components/chat/SimpleTravelCalculatorDialog.tsx
import React, { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation, Loader2, Search, MapPin, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { LocationResult } from "@/types/location";
import { cn } from "@/lib/utils";

interface SimpleTravelCalculatorDialogProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    conversationId: string;
    onSuccess: (message: unknown) => void;
}

// Reusable Location Input Component (Simplified version of the one in TravelCalculatorDialog)
const LocationInput = ({
    id,
    label,
    value,
    onChange,
    placeholder,
    className,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    className?: string;
}) => {
    const { searchTerm, setSearchTerm, suggestions, loading } = useLocationSearch();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value !== searchTerm) {
            setSearchTerm(value);
        }
    }, [value, searchTerm, setSearchTerm]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        onChange(val);
        setIsOpen(true);
    };

    const handleSelect = (result: LocationResult) => {
        setSearchTerm(result.display_name);
        onChange(result.display_name);
        setIsOpen(false);
    };

    return (
        <div className={cn("space-y-2 relative", className)} ref={wrapperRef}>
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="border-[#C4C4C4] focus:ring-[#F3CFC6] pr-10"
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                        <Search className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                    {suggestions.map((item, i) => (
                        <button
                            key={i}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-[#F3CFC6]/20 transition-colors flex items-start gap-2"
                            onClick={() => handleSelect(item)}
                        >
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="line-clamp-2">{item.display_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const SimpleTravelCalculatorDialog: React.FC<SimpleTravelCalculatorDialogProps> = ({
    isOpen,
    setIsOpen,
    conversationId,
    onSuccess,
}) => {
    const [fromAddress, setFromAddress] = useState("");
    const [toAddress, setToAddress] = useState("");
    const [distance, setDistance] = useState<string>("");
    const [ratePerMile, setRatePerMile] = useState<number>(1.5);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchRate = async () => {
                try {
                    const res = await fetch("/api/settings/travel-rate");
                    if (res.ok) {
                        const data = await res.json();
                        setRatePerMile(data.travelRatePerMile);
                    }
                } catch (err) {
                    console.error("Failed to fetch rate:", err);
                }
            };
            fetchRate();
        }
    }, [isOpen]);

    const numericDistance = parseFloat(distance) || 0;
    const fee = numericDistance * ratePerMile;

    const handleSubmit = async () => {
        if (!fromAddress || !toAddress || !distance || numericDistance <= 0) {
            toast.error("Please fill in all fields with valid values");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/conversations/${conversationId}/travel-calculation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromAddress,
                    toAddress,
                    distanceMiles: numericDistance,
                    durationMinutes: null, // Manual mode doesn't have duration
                    fee,
                    ratePerMile,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to submit calculation");
            }

            const data = await res.json();
            onSuccess(data.message);
            setIsOpen(false);
            toast.success("Travel calculation submitted to chat");

            // Reset state
            setFromAddress("");
            setToAddress("");
            setDistance("");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Submission failed";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md bg-white dark:bg-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-[#F3CFC6]" />
                        Simple Travel Calculator
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <LocationInput
                        id="from-simple"
                        label="From Location"
                        placeholder="Starting point..."
                        value={fromAddress}
                        onChange={setFromAddress}
                    />
                    <LocationInput
                        id="to-simple"
                        label="To Location"
                        placeholder="Destination..."
                        value={toAddress}
                        onChange={setToAddress}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="distance-simple">Distance (miles)</Label>
                        <Input
                            id="distance-simple"
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="Enter distance in miles"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            className="border-[#C4C4C4] focus:ring-[#F3CFC6]"
                        />
                    </div>

                    {numericDistance > 0 && (
                        <div className="mt-6 p-4 bg-[#F3CFC6]/10 rounded-xl border border-[#F3CFC6]/30 space-y-2 animate-in fade-in slide-in-from-top-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Rate:</span>
                                <span className="font-semibold">${ratePerMile.toFixed(2)} / mile</span>
                            </div>
                            <div className="pt-2 border-t border-[#F3CFC6]/50 flex justify-between">
                                <span className="font-bold">Total Travel Fee:</span>
                                <span className="font-bold text-xl text-[#D8A7B1]">${fee.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !fromAddress || !toAddress || numericDistance <= 0}
                        className="bg-[#D8A7B1] hover:bg-[#F3CFC6] text-white transition-colors"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit to Chat"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SimpleTravelCalculatorDialog;
