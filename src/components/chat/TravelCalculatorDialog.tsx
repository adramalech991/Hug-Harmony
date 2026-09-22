// src/components/chat/TravelCalculatorDialog.tsx
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
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { LocationResult } from "@/types/location";
import { cn } from "@/lib/utils";

// Dynamic import for TravelMap to avoid SSR issues
const TravelMap = dynamic(() => import("./TravelMap"), { ssr: false });

interface TravelCalculatorDialogProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    conversationId: string;
    onSuccess: (message: unknown) => void;
}

// Reusable Location Input Component with Autocomplete
const LocationInput = ({
    id,
    label,
    value,
    onChange,
    onSelect,
    placeholder,
    className,
    showCurrentLocation = false
}: {
    id: string;
    label: string;
    value: string;
    onChange: (val: string) => void;
    onSelect: (coords: [number, number] | null) => void;
    placeholder: string;
    className?: string;
    showCurrentLocation?: boolean;
}) => {
    const { searchTerm, setSearchTerm, suggestions, loading } = useLocationSearch();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Sync external value with internal search term
    useEffect(() => {
        if (value !== searchTerm) {
            setSearchTerm(value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Handle clicks outside to close dropdown
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
        onSelect(null); // Reset coords on manual typing
        setIsOpen(true);
    };

    const handleSelect = (result: LocationResult) => {
        setSearchTerm(result.display_name);
        onChange(result.display_name);
        onSelect([parseFloat(result.lat), parseFloat(result.lon)]);
        setIsOpen(false);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Use Nominatim (OpenStreetMap) for free reverse geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
                    );

                    if (!response.ok) throw new Error("Failed to get location name");

                    const data = await response.json();
                    const locationName = data.display_name;

                    setSearchTerm(locationName);
                    onChange(locationName);
                    onSelect([latitude, longitude]);
                    toast.success("Location updated to current position");
                } catch (error) {
                    console.error("Error geocoding:", error);
                    toast.error("Failed to get location name");
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                let message = "Failed to get your location";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "Please enable location permissions in your browser";
                }
                toast.error(message);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    return (
        <div className={cn("space-y-2 relative", className)} ref={wrapperRef}>
            <Label htmlFor={id}>{label}</Label>
            <div className="flex gap-2">
                <div className="relative flex-1">
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
                {showCurrentLocation && (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        title="Use my current location"
                        className="border-[#F3CFC6] text-[#F3CFC6] hover:bg-[#F3CFC6]/10 shrink-0"
                    >
                        {isLocating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Navigation className="h-4 w-4" />
                        )}
                    </Button>
                )}
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

const TravelCalculatorDialog: React.FC<TravelCalculatorDialogProps> = ({
    isOpen,
    setIsOpen,
    conversationId,
    onSuccess,
}) => {
    const [fromAddress, setFromAddress] = useState("");
    const [toAddress, setToAddress] = useState("");
    const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
    const [toCoords, setToCoords] = useState<[number, number] | null>(null);

    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [fee, setFee] = useState<number | null>(null);
    const [ratePerMile, setRatePerMile] = useState<number>(1.5);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [route, setRoute] = useState<[number, number][]>([]);
    const [markers, setMarkers] = useState<{ from?: [number, number], to?: [number, number] }>({});

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

    // Fallback geocoding if user didn't select from dropdown
    const geocode = async (address: string) => {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await res.json();
        if (data && data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number];
        }
        throw new Error(`Address not found: ${address}`);
    };

    const calculateRoute = async () => {
        if (!fromAddress || !toAddress) {
            toast.error("Please enter both addresses");
            return;
        }

        setLoading(true);
        try {
            // Use pre-selected coords or geocode if needed
            const startCoords = fromCoords ?? (await geocode(fromAddress));
            const endCoords = toCoords ?? (await geocode(toAddress));

            // Ensure we have coords before proceeding
            if (!startCoords || !endCoords) {
                throw new Error("Could not determine coordinates");
            }

            setMarkers({ from: startCoords, to: endCoords });

            const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`);
            const osrmData = await osrmRes.json();

            if (osrmData.routes && osrmData.routes.length > 0) {
                const routeData = osrmData.routes[0];
                const distMiles = (routeData.distance / 1609.34);
                setDistance(distMiles);
                setDuration(routeData.duration / 60);
                setFee(distMiles * ratePerMile);

                // Convert coordinates for Leaflet [[lat, lon], ...]
                const geometry = routeData.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
                setRoute(geometry);
            } else {
                throw new Error("No route found between these locations");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to calculate route";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (distance === null || fee === null) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/conversations/${conversationId}/travel-calculation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromAddress,
                    toAddress,
                    distanceMiles: distance,
                    durationMinutes: duration,
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
            setFromCoords(null);
            setToCoords(null);
            setDistance(null);
            setFee(null);
            setRoute([]);
            setMarkers({});
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Submission failed";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl bg-white dark:bg-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Navigation className="h-6 w-6 text-[#F3CFC6]" />
                        Travel Expense Calculator
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <LocationInput
                            id="from"
                            label="From Location"
                            placeholder="Enter starting address..."
                            value={fromAddress}
                            onChange={setFromAddress}
                            onSelect={setFromCoords}
                            showCurrentLocation
                        />
                        <LocationInput
                            id="to"
                            label="To Location"
                            placeholder="Enter destination address..."
                            value={toAddress}
                            onChange={setToAddress}
                            onSelect={setToCoords}
                        />

                        <Button
                            onClick={calculateRoute}
                            disabled={loading || !fromAddress || !toAddress}
                            className="w-full bg-[#F3CFC6] hover:bg-[#D8A7B1] text-black transition-colors"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                            Calculate Distance
                        </Button>

                        {distance !== null && (
                            <div className="mt-6 p-4 bg-[#F3CFC6]/10 rounded-xl border border-[#F3CFC6]/30 space-y-2 animate-in fade-in slide-in-from-top-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Distance:</span>
                                    <span className="font-semibold">{distance.toFixed(1)} miles</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">System Rate:</span>
                                    <span className="font-semibold">${ratePerMile.toFixed(2)} / mile</span>
                                </div>
                                <div className="pt-2 border-t border-[#F3CFC6]/50 flex justify-between">
                                    <span className="font-bold">Total Travel Fee:</span>
                                    <span className="font-bold text-xl text-[#D8A7B1]">${fee?.toFixed(2) ?? "0.00"}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground pt-1 italic">
                                    * Calculated as {distance.toFixed(2)} mi × ${ratePerMile.toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="h-[300px] md:h-full min-h-[300px] bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden relative border border-gray-200 dark:border-gray-700 shadow-inner">
                        <TravelMap route={route} markers={markers} />

                        {!route.length && !markers.from && !markers.to && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/50 dark:bg-gray-900/50 z-[1000] pointer-events-none text-center p-4">
                                <Navigation className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                                <p className="text-sm text-muted-foreground">Enter locations and calculate to see route</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || distance === null || fee === null}
                        className="bg-[#D8A7B1] hover:bg-[#F3CFC6] text-white transition-colors"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit to Chat"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TravelCalculatorDialog;
