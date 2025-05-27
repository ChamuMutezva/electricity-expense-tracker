/**
 * @file db.ts
 * Provides a reusable SQL client for Neon Database, utility functions for date formatting,
 * period calculation based on hour, and database connection checks.
 * Handles missing DATABASE_URL gracefully for development/fallback scenarios.
 */

import { neon } from "@neondatabase/serverless";

/**
 * Represents the result of an SQL query as an array of type T.
 * @template T - The type of the query result rows.
 */
// Update the SqlQueryResult type definition to be more specific
export type SqlQueryResult<T = unknown> = T[];

/**
 * Reusable SQL client for executing queries against the Neon Database.
 * Falls back to a dummy function returning empty arrays if DATABASE_URL is not set.
 */
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

/**
 * Formats a JavaScript Date object to an ISO string (YYYY-MM-DD) without the time component.
 * @param date - The Date object to format.
 * @returns The formatted date string in YYYY-MM-DD format.
 */
// Helper function to format date to ISO string without time
export function formatDateForDb(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * Determines the period of the day ("morning", "evening", or "night") based on the provided hour.
 * @param hour - The hour of the day (0-23).
 * @returns The period of the day as a string.
 */
// Helper function to get the current period based on hour
export function getPeriodFromHour(
    hour: number
): "morning" | "evening" | "night" {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 20) return "evening";
    return "night";
}

/**
 * Checks if the database connection is available by verifying the presence of DATABASE_URL.
 * @returns True if the database is connected, false otherwise.
 */
// Check if database connection is available
export function isDatabaseConnected(): boolean {
    return !!process.env.DATABASE_URL;
}
