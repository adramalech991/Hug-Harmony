import { toZonedTime, format as formatTz } from "date-fns-tz";
import { format as formatFns } from "date-fns";

/**
 * Standard format strings
 */
export const TIME_FORMATS = {
    DISPLAY_DATE: "MMM d, yyyy",
    DISPLAY_TIME: "h:mm a",
    DISPLAY_DATETIME: "MMM d, yyyy h:mm a",
    ISO_DATE: "yyyy-MM-dd",
};

/**
 * Format a date (UTC) to a user's local timezone.
 * Defaults to system timezone if no timezone is provided.
 */
export function formatInTimezone(
    date: Date | string | number | null | undefined,
    pattern: string,
    timezone?: string | null
): string {
    if (!date) return "";

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "";

    // If timezone is explicitly provided, convert to that zone
    if (timezone) {
        try {
            const zonedDate = toZonedTime(dateObj, timezone);
            return formatTz(zonedDate, pattern, { timeZone: timezone });
        } catch (e) {
            console.warn(`Invalid timezone: ${timezone}, falling back to local`);
        }
    }

    // Fallback to local system time
    return formatFns(dateObj, pattern);
}

/**
 * Get current time in a specific timezone
 */
export function nowInTimezone(timezone: string): Date {
    return toZonedTime(new Date(), timezone);
}

/**
 * Common IANA Timezones list for selection
 */
export const COMMON_TIMEZONES = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
    { value: "America/Chicago", label: "Central Time (US & Canada)" },
    { value: "America/Denver", label: "Mountain Time (US & Canada)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
    { value: "America/Anchorage", label: "Alaska Time" },
    { value: "Pacific/Honolulu", label: "Hawaii Time" },
    { value: "Europe/London", label: "London, Edinburgh, Dublin" },
    { value: "Europe/Paris", label: "Paris, Berlin, Rome" },
    { value: "Asia/Tokyo", label: "Tokyo, Osaka" },
    { value: "Asia/Dubai", label: "Dubai" },
    { value: "Australia/Sydney", label: "Sydney, Melbourne" },
    // Add more as needed or fetch from a library
].sort((a, b) => a.label.localeCompare(b.label));
