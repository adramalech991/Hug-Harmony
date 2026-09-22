// hooks/professionals/useFilters.ts

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { ProfessionalFilters } from "@/types/professional";

export interface Filters extends ProfessionalFilters {
  // UI-specific state
  selectedDate: Date | undefined;
  timeRange: [number, number];

  type: "" | "user" | "professional";
  race: string;
  ethnicity: string;
  bodyType: string;
  personalityType: string;
}

const initialFilters: Filters = {
  search: undefined,
  location: undefined,
  minRating: undefined,
  sortBy: "recommended",
  currentLat: undefined,
  currentLng: undefined,
  radius: undefined,
  unit: "miles",
  minAge: undefined,
  maxAge: undefined,
  onlineStatus: undefined,
  venue: undefined,
  selectedDate: undefined,
  timeRange: [0, 1410],
  page: 1,
  limit: 50,
  // Additional fields
  type: "",
  race: "",
  ethnicity: "",
  bodyType: "",
  personalityType: "",
  minRate: undefined,
  maxRate: undefined,
  languages: [],
  sex: undefined,
};

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);
  const { data: session } = useSession();
  const [hasAppliedDefaultSex, setHasAppliedDefaultSex] = useState(false);

  // Set default sex filter based on user's sex (opposite)
  useEffect(() => {
    if (session?.user?.sex && !filters.sex && !hasAppliedDefaultSex) {
      const userSex = session.user.sex;
      let targetSex: string | undefined;

      if (userSex === "Male") targetSex = "Female";
      else if (userSex === "Female") targetSex = "Male";

      if (targetSex) {
        console.log("Setting default sex filter:", targetSex);
        setFilters((prev) => ({ ...prev, sex: targetSex }));
        setAppliedFilters((prev) => ({ ...prev, sex: targetSex }));
        setHasAppliedDefaultSex(true);
      }
    }
  }, [session?.user?.sex, filters.sex, hasAppliedDefaultSex, setFilters, setAppliedFilters]);

  // Load captured location from login if available
  useEffect(() => {
    if (typeof window === "undefined") return;

    const captured = sessionStorage.getItem("hh_captured_location");
    if (captured) {
      try {
        const { lat, lng, name } = JSON.parse(captured);
        if (name || (lat && lng)) {
          console.log("Setting default location from login:", name);
          const locationFilters: Filters = {
            ...initialFilters,
            location: name || "Current Location",
            currentLat: lat,
            currentLng: lng,
            radius: 50, // Default 50 miles radius
          };
          setFilters(locationFilters);
          setAppliedFilters(locationFilters);

          // Clear it so it doesn't stick forever if the user manually clears filters
          // or we might want to keep it? The requirement says "default value instead of all locations"
          // Let's keep it in session for now but maybe clear it after first load?
          // Actually, session storage persists for the tab session, which is fine.
        }
      } catch (e) {
        console.error("Failed to parse captured location:", e);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, []);

  const removeFilter = useCallback((key: keyof Filters) => {
    const updateFn = (prev: Filters): Filters => {
      const updated = { ...prev };

      switch (key) {
        case "minAge":
        case "maxAge":
          updated.minAge = undefined;
          updated.maxAge = undefined;
          break;
        case "radius":
          updated.radius = undefined;
          updated.currentLat = undefined;
          updated.currentLng = undefined;
          updated.location = undefined;
          break;
        case "minRate":
        case "maxRate":
          updated.minRate = undefined;
          updated.maxRate = undefined;
          break;
        case "timeRange":
          updated.timeRange = [0, 1410];
          break;
        case "selectedDate":
          updated.selectedDate = undefined;
          updated.date = undefined;
          break;
        default:
          (updated as Record<string, unknown>)[key] = initialFilters[key];
      }

      return updated;
    };

    setFilters(updateFn);
    setAppliedFilters(updateFn);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    const f = appliedFilters;

    if (f.location) count++;
    if (f.radius && f.currentLat && f.currentLng) count++;
    if (f.minAge !== undefined || f.maxAge !== undefined) count++;
    if (f.selectedDate) count++;
    if (f.timeRange[0] !== 0 || f.timeRange[1] !== 1410) count++;
    // if (f.hasProfilePic) count++; // Removed
    if (f.onlineStatus) count++;
    if (f.venue) count++;
    if (f.type) count++;
    if (f.minRating && f.minRating > 0) count++;

    if (f.race) count++;
    if (f.ethnicity) count++;
    if (f.bodyType) count++;
    if (f.personalityType) count++;
    if (f.minRate !== undefined || f.maxRate !== undefined) count++;
    if (f.languages && f.languages.length > 0) count++;
    if (f.sex) count++;

    return count;
  }, [appliedFilters]);

  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(appliedFilters);
  }, [filters, appliedFilters]);

  const hasActiveFilters = useMemo(() => {
    const f = appliedFilters;
    return !!(
      f.location ||
      f.radius ||
      f.minAge !== undefined ||
      f.maxAge !== undefined ||
      f.selectedDate ||
      f.timeRange[0] !== 0 ||
      f.timeRange[1] !== 1410 ||
      f.hasProfilePic ||
      f.onlineStatus ||
      f.venue ||
      f.type ||
      (f.minRating && f.minRating > 0) ||
      f.minRate !== undefined ||
      f.maxRate !== undefined ||
      f.race ||
      f.ethnicity ||
      f.bodyType ||
      f.personalityType ||
      (f.languages && f.languages.length > 0) ||
      f.sex
    );
  }, [appliedFilters]);

  // Convert applied filters to API-compatible format
  const apiFilters = useMemo((): ProfessionalFilters => {
    const f = appliedFilters;
    return {
      search: f.search,
      location: f.location,
      venue: f.venue,
      minRating: f.minRating,
      minAge: f.minAge,
      maxAge: f.maxAge,
      hasProfilePic: f.hasProfilePic,
      onlineStatus: f.onlineStatus,
      currentLat: f.currentLat,
      currentLng: f.currentLng,
      radius: f.radius,
      unit: f.unit,
      date: f.selectedDate?.toISOString().split("T")[0],

      race: f.race || undefined,
      ethnicity: f.ethnicity || undefined,
      bodyType: f.bodyType || undefined,
      personalityType: f.personalityType || undefined,

      timeRangeStart: f.timeRange[0] !== 0 ? f.timeRange[0] : undefined,
      timeRangeEnd: f.timeRange[1] !== 1410 ? f.timeRange[1] : undefined,
      sortBy: f.sortBy,
      page: f.page,
      limit: f.limit,
      minRate: f.minRate,
      maxRate: f.maxRate,
      languages: f.languages && f.languages.length > 0 ? f.languages : undefined,
      sex: f.sex,
    };
  }, [appliedFilters]);

  return {
    filters,
    setFilters,
    appliedFilters,
    setAppliedFilters,
    apiFilters,
    reset,
    removeFilter,
    activeFilterCount,
    hasPendingChanges,
    hasActiveFilters,
  };
}
