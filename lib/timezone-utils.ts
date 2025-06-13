/**
 * Timezone utilities to ensure consistent time handling between frontend and backend
 */

/**
 * Get the user's local timezone offset in minutes
 */
export function getTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
}

/**
 * Convert a date to the user's local timezone for display
 */
export function toLocalTime(date: Date): Date {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

/**
 * Convert a local date to UTC for database storage
 */
export function toUTCTime(date: Date): Date {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

/**
 * Get the current local time as a proper Date object
 */
export function getCurrentLocalTime(): Date {
    return new Date();
}

/**
 * Format a date to include timezone information for server storage
 * This is the critical function that ensures timezone info is preserved
 */
export function formatDateWithTimezone(date: Date): string {
    // Include timezone offset in the ISO string to ensure server interprets it correctly
    // Get local timezone offset in hours:minutes format
    const offsetMinutes = date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetMins = Math.abs(offsetMinutes % 60);

    // Format offset string: +/-HH:MM
    const offsetSign = offsetMinutes <= 0 ? "+" : "-";
    const offsetString = `${offsetSign}${String(offsetHours).padStart(
        2,
        "0"
    )}:${String(offsetMins).padStart(2, "0")}`;

    // Create ISO string with timezone info
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // Return ISO format with timezone offset
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
}

/**
 * Get the local hour from a date (0-23) in user's timezone
 */
export function getLocalHour(date?: Date): number {
    const now = date || new Date();
    return now.getHours(); // This automatically uses local timezone
}

/**
 * Get the local date string (YYYY-MM-DD) in user's timezone
 */
export function getLocalDateString(date?: Date): string {
    const now = date || new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Create a date with local timezone consideration
 */
export function createLocalDate(
    year: number,
    month: number,
    day: number,
    hour = 0,
    minute = 0
): Date {
    return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * Parse a date string and ensure it's in local timezone
 */
export function parseLocalDate(dateString: string): Date {
    // If it's an ISO string, parse it normally
    if (dateString.includes("T")) {
        return new Date(dateString);
    }

    // If it's just a date string (YYYY-MM-DD), create it in local timezone
    const [year, month, day] = dateString.split("-").map(Number);
    return createLocalDate(year, month, day);
}

/**
 * Debug function to log timezone information
 */
export function logTimezoneInfo(label: string, date: Date): void {
    console.log(`[TIMEZONE DEBUG] ${label}:`, {
        date: date.toString(),
        iso: date.toISOString(),
        localeString: date.toLocaleString(),
        timezoneOffset: date.getTimezoneOffset(),
        hours: date.getHours(),
        calculatedPeriod: getPeriodFromHour(date.getHours()),
    });
}

/**
 * Get period based on hour
 */
export function getPeriodFromHour(
    hour: number
): "morning" | "evening" | "night" {
    // Ensure hour is in 0-23 range
    const normalizedHour = hour % 24;

    if (normalizedHour >= 5 && normalizedHour < 12) return "morning";
    if (normalizedHour >= 12 && normalizedHour < 20) return "evening";
    return "night";
}
