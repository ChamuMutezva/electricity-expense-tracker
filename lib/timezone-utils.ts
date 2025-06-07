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
 * Format a date to include timezone information
 */
export function formatDateWithTimezone(date: Date): string {
    return date.toISOString();
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
