import { neon } from "@neondatabase/serverless";

// Update the SqlQueryResult type definition to be more specific
export type SqlQueryResult<T = unknown> = T[];

// Create a reusable SQL client with error handling for missing DATABASE_URL
let sql: ReturnType<typeof neon>;

try {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(process.env.DATABASE_URL);
} catch (error) {
    console.error("Database connection error:", error);
    // Create a dummy SQL function that returns empty arrays for development/fallback
    sql = (() => {
        const dummyFn = () => Promise.resolve([]);
        return dummyFn as unknown as ReturnType<typeof neon>;
    })();
}

export { sql };

// Helper function to format date to ISO string without time
export function formatDateForDb(date: Date): string {
    return date.toISOString().split("T")[0];
}

// Update the getPeriodFromHour function to use local time consistently
export function getPeriodFromHour(
    hour: number
): "morning" | "evening" | "night" {
    // Ensure hour is in 0-23 range
    const normalizedHour = hour % 24;

    if (normalizedHour >= 5 && normalizedHour < 12) return "morning";
    if (normalizedHour >= 12 && normalizedHour < 20) return "evening";
    return "night";
}

// Add a new function to get current period using local time
export function getCurrentPeriod(): "morning" | "evening" | "night" {
    const now = new Date();
    const localHour = now.getHours(); // This uses local timezone
    return getPeriodFromHour(localHour);
}

// Add function to get period from a specific date
export function getPeriodFromDate(date: Date): "morning" | "evening" | "night" {
    const localHour = date.getHours(); // This uses local timezone
    return getPeriodFromHour(localHour);
}

// Check if database connection is available
export function isDatabaseConnected(): boolean {
    return !!process.env.DATABASE_URL;
}
