"use server";

import { sql, isDatabaseConnected, type SqlQueryResult } from "@/lib/db";
import type {
    ElectricityReading,
    ElectricityReadingDBResult,
    TokenPurchase,
    TokenPurchaseDBResult,
    UsageSummary,
    DailyUsage,
    Period,
} from "@/lib/types";
import { revalidatePath } from "next/cache";
import { stackServerApp } from "@/stack/server";

// Import the new timezone utilities
import {
    getCurrentLocalTime,
    getLocalDateString,
    formatDateWithTimezone,
    getPeriodFromHour,
    logTimezoneInfo,
} from "@/lib/timezone-utils";

/**
 * Get the current authenticated user
 */
async function getCurrentUser() {
    try {
        return await stackServerApp.getUser();
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

/**
 * Require authentication and throw if not authenticated
 */
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Authentication required");
    }
    return user;
}

/**
 * Checks if the database connection is established.
 *
 * @throws {Error} If the database is not connected, throws an error with a message
 *         instructing to set the DATABASE_URL environment variable.
 */

const checkDbConnection = () => {
    if (!isDatabaseConnected()) {
        throw new Error(
            "Database is not connected. Please set the DATABASE_URL environment variable."
        );
    }
};

/**
 * Gets the current period based on the current hour
 */
function getCurrentPeriod(): Period {
    const now = new Date();
    const localHour = now.getHours();
    return getPeriodFromHour(localHour) as Period;
}

/**
 * Gets the period from a date
 */
function getPeriodFromDate(date: Date): Period {
    const localHour = date.getHours();
    return getPeriodFromHour(localHour) as Period;
}

type MonthlyUsageRow = {
    month: string;
    usage: number | string; // usage may come as string from SQL, so handle both
};

/**
 * Checks if a reading already exists for the current period today
 * FIXED: Now properly handles timezone by comparing local dates and using period
 */
export async function checkExistingReading(
    period: Period
): Promise<ElectricityReading | null> {
    checkDbConnection();
    const user = await requireAuth();

    const todayStr = getLocalDateString(); // Use local date

    // FIXED: Query by date and period, not trying to do timezone conversion in SQL
    const result = (await sql`
      SELECT id, reading_id, timestamp, reading, period, created_at
      FROM electricity_readings
      WHERE DATE(timestamp) = ${todayStr} 
      AND period = ${period}
      AND user_id = ${user.id}
      ORDER BY timestamp DESC
      LIMIT 1
  `) as SqlQueryResult<ElectricityReadingDBResult>;

    if (result.length === 0) {
        return null;
    }

    return {
        id: result[0]?.id,
        reading_id: result[0]?.reading_id,
        timestamp: new Date(result[0]?.timestamp),
        reading: Number(result[0]?.reading),
        period: result[0]?.period as Period,
        created_at: result[0]?.created_at
            ? new Date(result[0]?.created_at)
            : undefined,
    };
}

/**
 * Updates an existing electricity reading
 */
export async function updateElectricityReading(
    readingId: string,
    newReading: number
): Promise<ElectricityReading> {
    checkDbConnection();
    const user = await requireAuth();

    const result = (await sql`
      UPDATE electricity_readings 
      SET reading = ${newReading}, created_at = NOW()
      WHERE reading_id = ${readingId} AND user_id = ${user.id}
      RETURNING id, reading_id, timestamp, reading, period, created_at
  `) as SqlQueryResult<ElectricityReadingDBResult>;

    if (result.length === 0) {
        throw new Error(
            "Reading not found or you don't have permission to update it"
        );
    }

    revalidatePath("/");

    return {
        id: result[0]?.id,
        reading_id: result[0]?.reading_id,
        timestamp: new Date(result[0]?.timestamp),
        reading: Number(result[0]?.reading),
        period: result[0]?.period as Period,
        created_at: result[0]?.created_at
            ? new Date(result[0]?.created_at)
            : undefined,
    };
}

/**
 * Adds a new electricity reading to the database.
 * Preserve the user's local time intent correctly
 */
export async function addElectricityReading(
    reading: number,
    forceUpdate = false
): Promise<{
    reading: ElectricityReading;
    isUpdate: boolean;
    existingReading?: ElectricityReading;
}> {
    checkDbConnection();
    const user = await requireAuth();

    const now = getCurrentLocalTime(); 
    const period = getCurrentPeriod(); // Calculate period based on current hour

    // Debug logging
    logTimezoneInfo("[SERVER] Adding electricity reading", now);

    // Check if reading already exists for this period today
    const existingReading = await checkExistingReading(period);

    if (existingReading && !forceUpdate) {
        return {
            reading: existingReading,
            isUpdate: false,
            existingReading,
        };
    }

    if (existingReading && forceUpdate) {
        const updatedReading = await updateElectricityReading(
            existingReading.reading_id,
            reading
        );
        return {
            reading: updatedReading,
            isUpdate: true,
            existingReading,
        };
    }

    // Create new reading with proper timezone handling
    const readingId = `reading-${Date.now()}-${user.id}`;
    const formattedTimestamp = formatDateWithTimezone(now);

    const result = (await sql`
      INSERT INTO electricity_readings (reading_id, timestamp, reading, period, user_id)
      VALUES (${readingId}, ${formattedTimestamp}, ${reading}, ${period}, ${user.id})
      RETURNING id, reading_id, timestamp, reading, period, created_at
  `) as SqlQueryResult<ElectricityReadingDBResult>;

    revalidatePath("/");

    const newReading: ElectricityReading = {
        id: result[0]?.id,
        reading_id: result[0]?.reading_id,
        timestamp: new Date(result[0]?.timestamp),
        reading: Number(result[0]?.reading),
        period: result[0]?.period as Period,
        created_at: result[0]?.created_at
            ? new Date(result[0]?.created_at)
            : undefined,
    };

    return {
        reading: newReading,
        isUpdate: false,
    };
}

/**
 * Adds a backdated electricity reading to the database.
 * FIXED: Now correctly preserves the intended time and calculates period properly
 */
export async function addBackdatedReading(
    readingData: Omit<ElectricityReading, "id" | "reading_id">
): Promise<ElectricityReading> {
    checkDbConnection();
    const user = await requireAuth();

    const readingId = `reading-backdated-${Date.now()}-${user.id}`;

    // Important: Calculate period based on the timestamp's hour, not just copy the provided period
    const calculatedPeriod = getPeriodFromDate(readingData.timestamp);

    // Debug logging
    logTimezoneInfo("[SERVER] Adding backdated reading", readingData.timestamp);

    // FIXED: Use the simplified formatDateWithTimezone that preserves local time
    const formattedTimestamp = formatDateWithTimezone(readingData.timestamp);

    const result = (await sql`
    INSERT INTO electricity_readings (reading_id, timestamp, reading, period, user_id)
    VALUES (${readingId}, ${formattedTimestamp}, ${readingData.reading}, ${calculatedPeriod}, ${user.id})
    RETURNING id, reading_id, timestamp, reading, period, created_at
  `) as SqlQueryResult<ElectricityReadingDBResult>;

    revalidatePath("/");

    const newReading: ElectricityReading = {
        id: result[0]?.id,
        reading_id: result[0]?.reading_id,
        timestamp: new Date(result[0]?.timestamp),
        reading: Number(result[0]?.reading),
        period: result[0]?.period as Period,
        created_at: result[0]?.created_at
            ? new Date(result[0]?.created_at)
            : undefined,
    };

    return newReading;
}

/* Adds a new token purchase to the database and updates the electricity readings accordingly.
 *
 * @param units - The number of electricity units purchased.
 * @param cost - The total cost of the token purchase.
 * @returns A promise that resolves to the newly created {@link TokenPurchase} object.
 * @throws {Error} If the database connection is not established.
 *
 * @remarks
 * - Retrieves the latest electricity reading and calculates the new reading after the token purchase.
 * - Inserts a new record into the `token_purchases` table and a corresponding reading into the `electricity_readings` table.
 * - Triggers a cache revalidation for the root path.
 * - The returned object includes the database-generated ID, token ID, timestamp, units, new reading, creation date, and total cost.
 */
export async function addTokenPurchase(
    units: number,
    cost: number
): Promise<TokenPurchase> {
    checkDbConnection();
    const user = await requireAuth();

    // Get the latest reading
    const latestReading = await getLatestReading();
    const newReading = latestReading + units;

    const now = getCurrentLocalTime(); // Use local time
    const tokenId = `token-${Date.now()}-${user.id}`;

    // Insert token purchase
    const tokenResult = (await sql`
    INSERT INTO token_purchases (token_id, timestamp, units, new_reading, total_cost, user_id)
    VALUES (${tokenId}, ${formatDateWithTimezone(
        now
    )}, ${units}, ${newReading}, ${cost}, ${user.id})
    RETURNING id, token_id, timestamp, units, new_reading, created_at, total_cost
  `) as SqlQueryResult<TokenPurchaseDBResult>;

    // Also add a new reading entry with the updated meter value using local time
    const period = getCurrentPeriod(); // Use local time for period
    const readingId = `token-reading-${Date.now()}-${user.id}`;

    await sql`
    INSERT INTO electricity_readings (reading_id, timestamp, reading, period, user_id)
    VALUES (${readingId}, ${formatDateWithTimezone(
        now
    )}, ${newReading}, ${period}, ${user.id})
  `;

    revalidatePath("/");

    const newToken: TokenPurchase = {
        id: tokenResult[0]?.id,
        token_id: tokenResult[0]?.token_id,
        timestamp: new Date(tokenResult[0]?.timestamp),
        units: Number(tokenResult[0]?.units),
        new_reading: Number(tokenResult[0]?.new_reading),
        created_at: tokenResult[0]?.created_at
            ? new Date(tokenResult[0]?.created_at)
            : undefined,
        total_cost: Number(tokenResult[0]?.total_cost),
    };

    return newToken;
}

/* Retrieves all electricity readings from the database.
 *
 * @returns A promise that resolves to an array of {@link ElectricityReading} objects,
 *          ordered by timestamp in ascending order. If the database is not connected,
 *          returns an empty array.
 *
 * @remarks
 * - Each reading includes its ID, reading ID, timestamp, reading value, period, and creation date.
 * - Ensures proper type conversion for each field.
 */
export async function getElectricityReadings(): Promise<ElectricityReading[]> {
    if (!isDatabaseConnected()) {
        return [];
    }

    const user = await getCurrentUser();
    if (!user) {
        console.log("[SERVER] No user authenticated, returning empty readings");
        return [];
    }

    const readings = (await sql`
    SELECT id, reading_id, timestamp, reading, period, created_at
    FROM electricity_readings
     WHERE user_id = ${user.id}
    ORDER BY timestamp ASC
  `) as ElectricityReadingDBResult[];

    // Ensure readings is treated as an array with a map method
    const readingsArray = Array.isArray(readings) ? readings : [];

    // Map the SQL result to properly typed objects
    return readingsArray.map(
        (row): ElectricityReading => ({
            id: row.id,
            reading_id: row.reading_id,
            timestamp: new Date(row.timestamp),
            reading: Number(row.reading),
            period: row.period as "morning" | "evening" | "night",
            created_at: row.created_at ? new Date(row.created_at) : undefined,
        })
    );
}

/* Retrieves all token purchases from the database.
 *
 * @returns A promise that resolves to an array of {@link TokenPurchase} objects,
 *          ordered by timestamp in ascending order. If the database is not connected,
 *          returns an empty array.
 *
 * @remarks
 * - Each token purchase includes its ID, token ID, timestamp, units, new reading, creation date, and total cost.
 * - Ensures proper type conversion for each field.
 */
export async function getTokenPurchases(): Promise<TokenPurchase[]> {
    if (!isDatabaseConnected()) {
        return [];
    }

    const user = await getCurrentUser();
    if (!user) {
        console.log("[SERVER] No user authenticated, returning empty tokens");
        return [];
    }

    const tokens = (await sql`
    SELECT id, token_id, timestamp, units, new_reading, created_at, total_cost
    FROM token_purchases
    WHERE user_id = ${user.id}
    ORDER BY timestamp ASC
  `) as TokenPurchaseDBResult[];

    // Ensure tokens is treated as an array with a map method
    const tokensArray = Array.isArray(tokens) ? tokens : [];

    // Map the SQL result to properly typed objects
    return tokensArray.map(
        (row): TokenPurchase => ({
            id: row.id,
            token_id: row.token_id,
            timestamp: new Date(row.timestamp),
            units: Number(row.units),
            new_reading: Number(row.new_reading),
            created_at: row.created_at ? new Date(row.created_at) : undefined,
            total_cost: Number(row.total_cost),
        })
    );
}

/* Retrieves the latest electricity meter reading from the database.
 *
 * @returns A promise that resolves to the latest reading value as a number.
 *          If the database is not connected or there are no readings, returns 0.
 *
 * @throws No explicit errors are thrown; returns 0 if the database is not connected.
 *
 * @remarks
 * - Queries the `electricity_readings` table for the most recent reading based on timestamp.
 * - Ensures the returned value is a number.
 */
export async function getLatestReading(): Promise<number> {
    if (!isDatabaseConnected()) {
        return 0;
    }

    
  const user = await getCurrentUser()
  if (!user) {
    return 0
  }

    const result = (await sql`
    SELECT reading
    FROM electricity_readings
    WHERE user_id = ${user.id}
    ORDER BY timestamp DESC
    LIMIT 1
  `) as SqlQueryResult<ElectricityReadingDBResult>;

    return result.length > 0 ? Number(result[0]?.reading) : 0;
}

/* Retrieves the total units of electricity used, calculated as the difference between
 * the first and last meter readings in the database.
 *
 * @returns A promise that resolves to the total units used as a number, rounded to two decimal places.
 *          Returns 0 if the database is not connected or if readings are unavailable.
 *
 * @remarks
 * - Queries the `electricity_readings` table for the earliest and latest readings based on timestamp.
 * - If either reading is missing, returns 0.
 * - Ensures the returned value is a number with two decimal precision.
 */
export async function getTotalUnitsUsed(): Promise<number> {
    if (!isDatabaseConnected()) {
        return 0;
    }

    const user = await getCurrentUser()
  if (!user) {
    return 0
  }

    const readings = (await sql`
    SELECT reading, timestamp
    FROM electricity_readings
     WHERE user_id = ${user.id} 
    ORDER BY timestamp ASC
  `) as SqlQueryResult<{ reading: number; timestamp: string, reading_id: string }>;

    if (readings.length < 2) {
        return 0;
    }

    let totalConsumption = 0;
    // Calculate consumption between consecutive readings
    for (let i = 1; i < readings.length; i++) {
        const prevReading = Number(readings[i - 1].reading);
        const currentReading = Number(readings[i].reading);
        // const isTokenReading = readings[i].reading_id.startsWith("token-reading-")

        // Only count decreases (actual consumption)
        // Ignore increases (token purchases)
        if ( prevReading > currentReading) {
            totalConsumption += prevReading - currentReading;
        }
    }

    return Number.parseFloat(totalConsumption.toFixed(2));
}

/**
 * SIMPLIFIED & FIXED: Enhanced getUsageSummary with correct token handling
 *
 * Key insight: For days with token purchases, calculate usage as:
 * Daily usage = (Starting reading + All tokens purchased) - Ending reading
 *
 * Example:
 * - Morning: 50 kWh
 * - Token added: 50 kWh
 * - Evening: 92 kWh
 * - Usage = (50 + 50) - 92 = 8 kWh ✅
 */
export async function getUsageSummary(): Promise<UsageSummary> {
    if (!isDatabaseConnected()) {
        return {
            averageUsage: 0,
            peakUsageDay: { date: "", usage: 0 },
            totalTokensPurchased: 0,
            dailyUsage: [],
        };
    }

     const user = await getCurrentUser()
  if (!user) {
    return {
      averageUsage: 0,
      peakUsageDay: { date: "", usage: 0 },
      totalTokensPurchased: 0,
      dailyUsage: [],
    }
  }

    // Get all readings and identify token readings
    const readings = (await getElectricityReadings())
        .map((r) => ({
            ...r,
            reading: Number(r.reading),
            isTokenReading: r.reading_id.startsWith("token-reading-"),
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const tokens = await getTokenPurchases();
    const totalTokensPurchased = tokens.reduce(
        (sum, token) => sum + Number(token.units),
        0
    );

    // Group readings by date
    const dailyReadingsMap: Record<
        string,
        (ElectricityReading & { isTokenReading: boolean })[]
    > = {};
    for (const reading of readings) {
        const date = reading.timestamp.toISOString().split("T")[0];
        if (!dailyReadingsMap[date]) {
            dailyReadingsMap[date] = [];
        }
        dailyReadingsMap[date].push(reading);
    }

    // Group tokens by date for easier lookup
    const dailyTokensMap: Record<string, TokenPurchase[]> = {};
    for (const token of tokens) {
        const date = token.timestamp.toISOString().split("T")[0];
        if (!dailyTokensMap[date]) {
            dailyTokensMap[date] = [];
        }
        dailyTokensMap[date].push(token);
    }

    const allDates = Object.keys(dailyReadingsMap).sort((a, b) =>
        a.localeCompare(b)
    );

    const dailyUsage: DailyUsage[] = [];
    let previousEndingReading: number | null = null;

    for (const element of allDates) {
        const date = element;
        const dayReadings = dailyReadingsMap[date];
        const dayTokens = dailyTokensMap[date] || [];

        dayReadings.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

        // Get only regular readings (not token readings)
        // const regularReadings = dayReadings.filter((r) => !r.isTokenReading);
        // Find first and last regular readings of the day
        const firstReading = dayReadings[0];
        const lastReading = dayReadings.at(-1);

        // Get period-specific readings for display
        const morningReading = dayReadings.find((r) => r.period === "morning");
        const eveningReading = dayReadings.find((r) => r.period === "evening");
        const nightReading = dayReadings.find((r) => r.period === "night");
        // Calculate daily usage using the simplified formula
        let dailyTotal = 0;

        if (firstReading && lastReading) {
            // Starting point: use previous day's ending or first reading
            const startingReading =
                previousEndingReading ?? firstReading.reading;

            // Sum all tokens purchased on this day
            const tokensAddedToday = dayTokens.reduce(
                (sum, token) => sum + Number(token.units),
                0
            );

            // Daily usage = (Starting + Tokens) - Ending
            // This works because the meter counts down as you use electricity
            dailyTotal =
                startingReading + tokensAddedToday - lastReading.reading;

            // Ensure non-negative
            dailyTotal = Math.max(0, dailyTotal);
        }

        dailyUsage.push({
            date,
            morning: morningReading?.reading,
            evening: eveningReading?.reading,
            night: nightReading?.reading,
            total: dailyTotal,
        });

        // Update previous ending reading for next iteration
        if (lastReading) {
            previousEndingReading = lastReading.reading;
        }
    }

    const totalDailyUsage = dailyUsage.reduce((sum, day) => sum + day.total, 0);
    const daysWithUsage = dailyUsage.filter((day) => day.total > 0).length;
    const averageUsage =
        daysWithUsage > 0 ? totalDailyUsage / daysWithUsage : 0;

    let peakUsageDay = { date: "", usage: 0 };

    for (const day of dailyUsage) {
        if (day.total > peakUsageDay.usage) {
            peakUsageDay = { date: day.date, usage: day.total };
        }
    }

    return {
        averageUsage,
        peakUsageDay,
        totalTokensPurchased,
        dailyUsage,
    };
}
/**
 * Retrieves the monthly electricity usage based on readings from the database.
 *
 * This function calculates the total consumption for each month by summing up
 * only the decreases in the electricity meter readings (i.e., actual consumption).
 * It returns an array of objects, each containing the month (in 'YYYY-MM' format)
 * and the corresponding usage value.
 *
 * If the database is not connected, an empty array is returned.
 *
 * @returns {Promise<{ month: string; usage: number }[]>} A promise that resolves to an array of monthly usage objects.
 */
export async function getMonthlyUsage(): Promise<
    { month: string; usage: number }[]
> {
    if (!isDatabaseConnected()) {
        return [];
    }

    const user = await getCurrentUser()
  if (!user) {
    return []
  }

    const result = (await sql`
WITH reading_changes AS (
  SELECT 
    timestamp,
    reading,
    LAG(reading) OVER (ORDER BY timestamp) as prev_reading,
    date_trunc('month', timestamp) as month
  FROM electricity_readings
  WHERE user_id = ${user.id}
),
consumption_periods AS (
  SELECT
    month,
    -- Only count decreases in reading (actual consumption)
    SUM(CASE WHEN reading < prev_reading THEN prev_reading - reading ELSE 0 END) as usage
  FROM reading_changes
  WHERE prev_reading IS NOT NULL
  GROUP BY month
)
SELECT 
  to_char(month, 'YYYY-MM') as month,
  usage
FROM consumption_periods
ORDER BY month
  `) as MonthlyUsageRow[];

    // Ensure result is treated as an array with a map method
    const resultArray = Array.isArray(result) ? result : [];

    return resultArray.map((row) => ({
        month: row.month,
        usage: Number(row.usage),
    }));
}

/* Migrates electricity readings and token purchases from local storage to the database.
 *
 * @param readings - An array of electricity readings to migrate, each omitting the `id` field.
 * @param tokens - An array of token purchases to migrate, each omitting the `id` field.
 * @returns A promise that resolves to `true` if the migration succeeds, or `false` if an error occurs.
 *
 * @remarks
 * - Begins a database transaction to ensure atomicity of the migration.
 * - Each reading and token is inserted into the respective table if it does not already exist (using `ON CONFLICT DO NOTHING`).
 * - Skips invalid readings or tokens and logs a warning to the console.
 * - Commits the transaction on success, or rolls back if any error occurs.
 * - Triggers a cache revalidation for the root path after successful migration.
 * - Returns `false` and logs an error if the migration fails.
 */
export async function migrateFromLocalStorage(
    readings: Omit<ElectricityReading, "id">[],
    tokens: Omit<TokenPurchase, "id">[]
): Promise<boolean> {
    try {
        checkDbConnection();
        const user = await requireAuth()

        // Begin transaction
        await sql`BEGIN`;

        // Insert readings
        for (const reading of readings) {
            if (
                !reading.reading_id ||
                !reading.timestamp ||
                reading.reading === undefined ||
                !reading.period
            ) {
                console.warn("Skipping invalid reading:", reading);
                continue;
            }

            await sql`
        INSERT INTO electricity_readings (reading_id, timestamp, reading, period, user_id)
        VALUES (
          ${reading.reading_id}, 
          ${reading.timestamp.toISOString()}, 
          ${Number(reading.reading)}, 
          ${reading.period},
          ${user.id}
        )
        ON CONFLICT (reading_id) DO NOTHING
      `;
        }

        // Insert tokens
        for (const token of tokens) {
            if (
                !token.token_id ||
                !token.timestamp ||
                token.units === undefined ||
                token.new_reading === undefined
            ) {
                console.warn("Skipping invalid token:", token);
                continue;
            }

            await sql`
        INSERT INTO token_purchases (token_id, timestamp, units, new_reading, user_id, total_cost)
        VALUES (
          ${token.token_id}, 
          ${token.timestamp.toISOString()}, 
          ${Number(token.units)}, 
          ${Number(token.new_reading)},
          ${user.id},
          ${Number(token.total_cost || 0)}
        )
        ON CONFLICT (token_id) DO NOTHING
      `;
        }

        // Commit transaction
        await sql`COMMIT`;

        revalidatePath("/");
        return true;
    } catch (error) {
        // Rollback on error
        await sql`ROLLBACK`;
        console.error("Migration error:", error);
        return false;
    }
}
