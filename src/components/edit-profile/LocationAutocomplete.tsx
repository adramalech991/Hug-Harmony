import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapPin, Search, AlertCircle, X, Navigation, Loader2 } from "lucide-react";
import { LocationResult } from "@/types/edit-profile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useLocationSearch } from "@/hooks/edit-profile/useLocationSearch";

interface Props {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  suggestions?: LocationResult[];
  loading?: boolean;
  error?: string | null;
  disabled: boolean;
}

export function LocationAutocomplete({
  name = "location",
  value,
  onChange,
  searchTerm: propsSearchTerm,
  setSearchTerm: propsSetSearchTerm,
  suggestions: propsSuggestions,
  loading: propsLoading,
  error: propsError,
  disabled,
}: Props) {
  const internalLocationSearch = useLocationSearch();
  const [isLocating, setIsLocating] = useState(false);

  // Use props if provided, otherwise use internal state
  const searchTerm = propsSearchTerm !== undefined ? propsSearchTerm : internalLocationSearch.searchTerm;
  const setSearchTerm = propsSetSearchTerm || internalLocationSearch.setSearchTerm;
  const suggestions = propsSuggestions || internalLocationSearch.suggestions;
  const loading = propsLoading !== undefined ? propsLoading : internalLocationSearch.loading;
  const error = propsError !== undefined ? propsError : internalLocationSearch.error;

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

          onChange(locationName);
          setSearchTerm("");
          toast.success("Location updated");
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
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Popover
            open={!!searchTerm.trim()}
            onOpenChange={(open) => !open && setSearchTerm("")}
            modal={false}
          >
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search city, address, or place..."
                  value={disabled ? value : searchTerm || value}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  disabled={disabled}
                  className="border-[#F3CFC6] focus:ring-[#F3CFC6] pr-10"
                  autoComplete="off"
                />
                {searchTerm && !disabled && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </PopoverTrigger>

            <PopoverContent
              className="w-full p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {loading ? (
                <div className="flex items-center gap-2 p-3 text-sm">
                  <Search className="h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : error ? (
                <div className="p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              ) : suggestions.length === 0 && searchTerm ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No locations found
                </div>
              ) : (
                <div className="max-h-64 overflow-auto">
                  {suggestions.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex items-center gap-3"
                      onClick={() => {
                        onChange(item.display_name);
                        setSearchTerm("");
                      }}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGetCurrentLocation}
          disabled={disabled || isLocating}
          title="Get current location"
          className="border-[#F3CFC6] text-[#F3CFC6] hover:bg-[#F3CFC6]/10 flex-shrink-0"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      <input type="hidden" name={name} value={value || ""} />

      {!searchTerm && value && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {value}
        </p>
      )}
    </div>
  );
}
