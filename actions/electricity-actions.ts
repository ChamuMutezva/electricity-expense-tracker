/**
 * Provides server-side actions for managing electricity readings and token purchases.
 *
 * This module includes functions to:
 * - Add, update, and backdate electricity readings.
 * - Add token purchases and update readings accordingly.
 * - Retrieve all readings and token purchases.
 * - Calculate usage summaries, total units used, and monthly usage.
 * - Migrate data from local storage to the database.
 * - Ensure proper timezone handling for all date and time operations.
 *
 * All actions ensure the database connection is established before proceeding,
 * and trigger cache revalidation as needed.
 *
 * @module actions/electricity-actions
 */
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

// Import the new timezone utilities
import {
    getCurrentLocalTime,
    getLocalDateString,
    formatDateWithTimezone,
    getPeriodFromHour,
    logTimezoneInfo,
} from "@/lib/timezone-utils";

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
 */

/**
 * Checks if a reading already exists for the current period today
 */
export async function checkExistingReading(
    period: Period
): Promise<ElectricityReading | null> {
    checkDbConnection();

    const todayStr = getLocalDateString(); // Use local date

    console.log(
        `[SERVER] Checking for existing reading on ${todayStr} for period ${period}`
    );

    // Use AT TIME ZONE to ensure consistent timezone handling
    const result = (await sql`
      SELECT id, reading_id, timestamp, reading, period, created_at
      FROM electricity_readings
      WHERE DATE(timestamp AT TIME ZONE 'UTC') = ${todayStr} 
      AND period = ${period}
      ORDER BY timestamp DESC
      LIMIT 1
  `) as SqlQueryResult<ElectricityReadingDBResult>;

    if (result.length === 0) {
        return null;
    }

    console.log(
        `[SERVER] Found existing reading for ${period} on ${todayStr}:`,
        result[0]
    );

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

    const result = (await sql`
      UPDATE electricity_readings 
      SET reading = ${newReading}, created_at = NOW()
      WHERE reading_id = ${readingId}
      RETURNING id, reading_id, timestamp, reading, period, created_at
  `) as SqlQueryResult<ElectricityReadingDBResult>;

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
 *
 * @param reading - The meter reading value to be added.
 * @param forceUpdate - Whether to force update if reading exists for this period
 * @returns A promise that resolves to the newly created {@link ElectricityReading} object.
 * @throws {Error} If the database connection is not established.
 *
 * @remarks
 * - Generates a unique reading ID and determines the period (morning, evening, or night) based on the current hour.
 * - Inserts the reading into the `electricity_readings` table and revalidates the root path cache.
 * - The returned object includes the database-generated ID, reading ID, timestamp, reading value, period, and creation date.
 */
/**
 * Adds a new electricity reading to the database.
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

    const now = getCurrentLocalTime(); // Get current local time
    const period = getCurrentPeriod(); // Calculate period based on current hour

    // Debug logging
    logTimezoneInfo("[SERVER] Adding electricity reading", now);
    console.log(`[SERVER] Current period: ${period}, Hour: ${now.getHours()}`);

    // Check if reading already exists for this period today
    const existingReading = await checkExistingReading(period);

    if (existingReading && !forceUpdate) {
        console.log(
            `[SERVER] Existing reading found for ${period}, not updating`
        );
        return {
            reading: existingReading,
            isUpdate: false,
            existingReading,
        };
    }

    if (existingReading && forceUpdate) {
        console.log(`[SERVER] Force updating existing reading for ${period}`);
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
    const readingId = `reading-${Date.now()}`;
    const formattedTimestamp = formatDateWithTimezone(now);

    console.log(
        `[SERVER] Creating new reading with ID: ${readingId}, timestamp: ${formattedTimestamp}, period: ${period}`
    );

    const result = (await sql`
      INSERT INTO electricity_readings (reading_id, timestamp, reading, period)
      VALUES (${readingId}, ${formattedTimestamp}, ${reading}, ${period})
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
 *
 * This function inserts a new electricity reading record with a generated backdated reading ID,
 * and returns the newly created reading as a typed object. It also triggers a revalidation of the root path.
 *
 * @param readingData - The electricity reading data to insert, excluding `id` and `reading_id`.
 * @returns A promise that resolves to the newly created `ElectricityReading` object.
 *
 * @throws Will throw an error if the database connection is not available or if the insertion fails.
 */
/**
 * Adds a backdated electricity reading to the database.
 */
export async function addBackdatedReading(
    readingData: Omit<ElectricityReading, "id" | "reading_id">
): Promise<ElectricityReading> {
    checkDbConnection();

    const readingId = `reading-backdated-${Date.now()}`;

    // Important: Calculate period based on the timestamp's hour, not just copy the provided period
    const calculatedPeriod = getPeriodFromDate(readingData.timestamp);

    // Debug logging
    logTimezoneInfo("[SERVER] Adding backdated reading", readingData.timestamp);
    console.log(
        `[SERVER] Original period: ${readingData.period}, Calculated period: ${calculatedPeriod}`
    );

    // Format the timestamp with timezone information
    const formattedTimestamp = formatDateWithTimezone(readingData.timestamp);

    console.log(
        `[SERVER] Inserting backdated reading with timestamp: ${formattedTimestamp}, period: ${calculatedPeriod}`
    );

    const result = (await sql`
    INSERT INTO electricity_readings (reading_id, timestamp, reading, period)
    VALUES (${readingId}, ${formattedTimestamp}, ${readingData.reading}, ${calculatedPeriod})
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

    // Get the latest reading
    const latestReading = await getLatestReading();
    const newReading = latestReading + units;

    const now = getCurrentLocalTime(); // Use local time
    const tokenId = `token-${Date.now()}`;

    // Insert token purchase
    const tokenResult = (await sql`
    INSERT INTO token_purchases (token_id, timestamp, units, new_reading, total_cost)
    VALUES (${tokenId}, ${formatDateWithTimezone(
        now
    )}, ${units}, ${newReading}, ${cost})
    RETURNING id, token_id, timestamp, units, new_reading, created_at, total_cost
  `) as SqlQueryResult<TokenPurchaseDBResult>;

    // Also add a new reading entry with the updated meter value using local time
    const period = getCurrentPeriod(); // Use local time for period
    const readingId = `token-reading-${Date.now()}`;

    await sql`
    INSERT INTO electricity_readings (reading_id, timestamp, reading, period)
    VALUES (${readingId}, ${formatDateWithTimezone(
        now
    )}, ${newReading}, ${period})
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

    const readings = (await sql`
    SELECT id, reading_id, timestamp, reading, period, created_at
    FROM electricity_readings
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

    const tokens = (await sql`
    SELECT id, token_id, timestamp, units, new_reading, created_at, total_cost
    FROM token_purchases
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

    const result = (await sql`
    SELECT reading
    FROM electricity_readings
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

    const result = (await sql`
    SELECT 
      (SELECT reading FROM electricity_readings ORDER BY timestamp ASC LIMIT 1) as first_reading,
      (SELECT reading FROM electricity_readings ORDER BY timestamp DESC LIMIT 1) as last_reading
  `) as SqlQueryResult<{ first_reading: number; last_reading: number }>;

    if (
        result.length === 0 ||
        !result[0]?.first_reading ||
        !result[0]?.last_reading
    ) {
        return 0;
    }

    const difference =
        Number(result[0]?.last_reading) - Number(result[0]?.first_reading);
    return Number.parseFloat(difference.toFixed(2)); // Round to 2 decimal places
}

/* Retrieves a usage summary of electricity consumption and token purchases.
 *
 * @returns A promise that resolves to a {@link UsageSummary} object containing:
 * - `averageUsage`: The average daily electricity usage.
 * - `peakUsageDay`: An object with the date and usage value of the day with the highest usage.
 * - `totalTokensPurchased`: The total number of electricity units purchased via tokens.
 * - `dailyUsage`: An array of daily usage breakdowns, each including readings for morning, evening, night, and total usage for the day.
 *
 * @remarks
 * - If the database is not connected, returns a summary with zeroed/default values.
 * - Groups all electricity readings by day and calculates usage between periods (morning, evening, night).
 * - Calculates the average daily usage and identifies the day with the highest usage.
 * - Sums all token purchases to compute the total tokens purchased.
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

    // Get all readings and sort chronologically
    const readings = (await getElectricityReadings())
        .map((r) => ({ ...r, reading: Number(r.reading) }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Get all token purchases
    const tokens = await getTokenPurchases();
    const totalTokensPurchased = tokens.reduce(
        (sum, token) => sum + Number(token.units),
        0
    );

    // Group readings by date (day)
    const dailyReadingsMap: Record<string, ElectricityReading[]> = {};
    readings.forEach((reading) => {
        const date = reading.timestamp.toISOString().split("T")[0];
        if (!dailyReadingsMap[date]) {
            dailyReadingsMap[date] = [];
        }
        dailyReadingsMap[date].push(reading);
    });

    // Get all unique dates sorted
    const allDates = Object.keys(dailyReadingsMap).sort();

    const dailyUsage: DailyUsage[] = [];
    let previousNightReading: number | null = null;

    for (let i = 0; i < allDates.length; i++) {
        const date = allDates[i];
        const dayReadings = dailyReadingsMap[date];

        // Sort readings within the day
        dayReadings.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

        // Find readings by period
        const morningReading = dayReadings.find((r) => r.period === "morning");
        const eveningReading = dayReadings.find((r) => r.period === "evening");
        const nightReading = dayReadings.find((r) => r.period === "night");

        // Calculate consumption periods
        let morningUsage = 0;
        let eveningUsage = 0;
        let nightUsage = 0;

        // 1. Morning usage (from previous night to current morning)
        if (morningReading) {
            if (i > 0) {
                // Get previous day's night reading
                const prevDate = allDates[i - 1];
                const prevDayReadings = dailyReadingsMap[prevDate];
                const prevNightReading = prevDayReadings.find(
                    (r) => r.period === "night"
                );

                if (prevNightReading) {
                    morningUsage =
                        prevNightReading.reading - morningReading.reading;
                }
            } else if (previousNightReading !== null) {
                // For first day if we have a previous night reading
                morningUsage = previousNightReading - morningReading.reading;
            }
        }

        // 2. Evening usage (from morning to evening)
        if (morningReading && eveningReading) {
            eveningUsage = morningReading.reading - eveningReading.reading;
        }

        // 3. Night usage (from evening to night)
        if (eveningReading && nightReading) {
            nightUsage = eveningReading.reading - nightReading.reading;
        }

        // Store the last night reading for next day's morning calculation
        if (nightReading) {
            previousNightReading = nightReading.reading;
        }

        // Calculate total for the day
        const total = morningUsage + eveningUsage + nightUsage;

        dailyUsage.push({
            date,
            morning: morningReading?.reading,
            evening: eveningReading?.reading,
            night: nightReading?.reading,
            total,
        });
    }

    // Calculate average usage
    const totalDailyUsage = dailyUsage.reduce((sum, day) => sum + day.total, 0);
    const averageUsage =
        dailyUsage.length > 0 ? totalDailyUsage / dailyUsage.length : 0;

    // Find peak usage day
    let peakUsageDay = { date: "", usage: 0 };
    dailyUsage.forEach((day) => {
        if (day.total > peakUsageDay.usage) {
            peakUsageDay = { date: day.date, usage: day.total };
        }
    });

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

    const result = (await sql`
WITH reading_changes AS (
  SELECT 
    timestamp,
    reading,
    LAG(reading) OVER (ORDER BY timestamp) as prev_reading,
    date_trunc('month', timestamp) as month
  FROM electricity_readings
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

    console.log("Monthly Usage Result:", result);
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
        INSERT INTO electricity_readings (reading_id, timestamp, reading, period)
        VALUES (
          ${reading.reading_id}, 
          ${reading.timestamp.toISOString()}, 
          ${Number(reading.reading)}, 
          ${reading.period}
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
        INSERT INTO token_purchases (token_id, timestamp, units, new_reading)
        VALUES (
          ${token.token_id}, 
          ${token.timestamp.toISOString()}, 
          ${Number(token.units)}, 
          ${Number(token.new_reading)}
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
