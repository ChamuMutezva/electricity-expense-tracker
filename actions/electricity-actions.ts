"use server"

import { sql, isDatabaseConnected } from "@/lib/db"
import type { ElectricityReading, TokenPurchase, UsageSummary, DailyUsage } from "@/lib/types"
import { getPeriodFromHour } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Check if database is connected before performing operations
const checkDbConnection = () => {
  if (!isDatabaseConnected()) {
    throw new Error("Database is not connected. Please set the DATABASE_URL environment variable.")
  }
}

// Add a new electricity reading
export async function addElectricityReading(reading: number): Promise<ElectricityReading> {
  checkDbConnection()

  const now = new Date()
  const period = getPeriodFromHour(now.getHours())
  const readingId = `reading-${Date.now()}`

  const result = await sql`
    INSERT INTO electricity_readings (reading_id, timestamp, reading, period)
    VALUES (${readingId}, ${now.toISOString()}, ${reading}, ${period})
    RETURNING id, reading_id, timestamp, reading, period, created_at
  `

  revalidatePath("/")

  // Ensure we return a properly typed object
  const newReading: ElectricityReading = {
    id: result[0].id,
    reading_id: result[0].reading_id,
    timestamp: new Date(result[0].timestamp),
    reading: Number(result[0].reading),
    period: result[0].period as "morning" | "evening" | "night",
    created_at: result[0].created_at ? new Date(result[0].created_at) : undefined,
  }

  return newReading
}

// Add a new token purchase
export async function addTokenPurchase(units: number): Promise<TokenPurchase> {
  checkDbConnection()

  // Get the latest reading
  const latestReading = await getLatestReading()
  const newReading = latestReading + units

  const now = new Date()
  const tokenId = `token-${Date.now()}`

  // Insert token purchase
  const tokenResult = await sql`
    INSERT INTO token_purchases (token_id, timestamp, units, new_reading)
    VALUES (${tokenId}, ${now.toISOString()}, ${units}, ${newReading})
    RETURNING id, token_id, timestamp, units, new_reading, created_at
  `

  // Also add a new reading entry with the updated meter value
  const period = getPeriodFromHour(now.getHours())
  const readingId = `token-reading-${Date.now()}`

  await sql`
    INSERT INTO electricity_readings (reading_id, timestamp, reading, period)
    VALUES (${readingId}, ${now.toISOString()}, ${newReading}, ${period})
  `

  revalidatePath("/")

  // Ensure we return a properly typed object
  const newToken: TokenPurchase = {
    id: tokenResult[0].id,
    token_id: tokenResult[0].token_id,
    timestamp: new Date(tokenResult[0].timestamp),
    units: Number(tokenResult[0].units),
    new_reading: Number(tokenResult[0].new_reading),
    created_at: tokenResult[0].created_at ? new Date(tokenResult[0].created_at) : undefined,
  }

  return newToken
}

// Get all electricity readings
export async function getElectricityReadings(): Promise<ElectricityReading[]> {
  if (!isDatabaseConnected()) {
    return []
  }

  const readings = await sql`
    SELECT id, reading_id, timestamp, reading, period, created_at
    FROM electricity_readings
    ORDER BY timestamp ASC
  `

  // Map the SQL result to properly typed objects
  return readings.map(
    (row): ElectricityReading => ({
      id: row.id,
      reading_id: row.reading_id,
      timestamp: new Date(row.timestamp),
      reading: Number(row.reading),
      period: row.period as "morning" | "evening" | "night",
      created_at: row.created_at ? new Date(row.created_at) : undefined,
    }),
  )
}

// Get all token purchases
export async function getTokenPurchases(): Promise<TokenPurchase[]> {
  if (!isDatabaseConnected()) {
    return []
  }

  const tokens = await sql`
    SELECT id, token_id, timestamp, units, new_reading, created_at
    FROM token_purchases
    ORDER BY timestamp ASC
  `

  // Map the SQL result to properly typed objects
  return tokens.map(
    (row): TokenPurchase => ({
      id: row.id,
      token_id: row.token_id,
      timestamp: new Date(row.timestamp),
      units: Number(row.units),
      new_reading: Number(row.new_reading),
      created_at: row.created_at ? new Date(row.created_at) : undefined,
    }),
  )
}

// Get the latest reading value
export async function getLatestReading(): Promise<number> {
  if (!isDatabaseConnected()) {
    return 0
  }

  const result = await sql`
    SELECT reading
    FROM electricity_readings
    ORDER BY timestamp DESC
    LIMIT 1
  `

  return result.length > 0 ? Number(result[0].reading) : 0
}

// Get total units used (difference between first and last reading)
export async function getTotalUnitsUsed(): Promise<number> {
  if (!isDatabaseConnected()) {
    return 0
  }

  const result = await sql`
    SELECT 
      (SELECT reading FROM electricity_readings ORDER BY timestamp ASC LIMIT 1) as first_reading,
      (SELECT reading FROM electricity_readings ORDER BY timestamp DESC LIMIT 1) as last_reading
  `

  if (result.length === 0 || !result[0].first_reading || !result[0].last_reading) {
    return 0
  }

  return Number(result[0].last_reading) - Number(result[0].first_reading)
}

// Get usage summary with daily breakdowns
export async function getUsageSummary(): Promise<UsageSummary> {
  if (!isDatabaseConnected()) {
    return {
      averageUsage: 0,
      peakUsageDay: { date: "", usage: 0 },
      totalTokensPurchased: 0,
      dailyUsage: [],
    }
  }

  // Get all readings
  const readings = await getElectricityReadings()

  // Get all token purchases
  const tokens = await getTokenPurchases()

  // Calculate total tokens purchased
  const totalTokensPurchased = tokens.reduce((sum, token) => sum + Number(token.units), 0)

  // Group readings by day
  const dailyReadingsMap: Record<string, ElectricityReading[]> = {}

  readings.forEach((reading) => {
    const date = reading.timestamp.toISOString().split("T")[0]
    if (!dailyReadingsMap[date]) {
      dailyReadingsMap[date] = []
    }
    dailyReadingsMap[date].push(reading)
  })

  // Calculate daily usage
  const dailyUsage: DailyUsage[] = []

  Object.entries(dailyReadingsMap).forEach(([date, dayReadings]) => {
    // Sort readings by timestamp
    dayReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Get readings by period
    const morningReading = dayReadings.find((r) => r.period === "morning")
    const eveningReading = dayReadings.find((r) => r.period === "evening")
    const nightReading = dayReadings.find((r) => r.period === "night")

    // Calculate differences between periods
    let morningToEvening = 0
    let eveningToNight = 0

    if (morningReading && eveningReading) {
      morningToEvening = Number(eveningReading.reading) - Number(morningReading.reading)
    }

    if (eveningReading && nightReading) {
      eveningToNight = Number(nightReading.reading) - Number(eveningReading.reading)
    }

    // Calculate total for the day
    const total = morningToEvening + eveningToNight

    dailyUsage.push({
      date,
      morning: morningReading ? Number(morningReading.reading) : undefined,
      evening: eveningReading ? Number(eveningReading.reading) : undefined,
      night: nightReading ? Number(nightReading.reading) : undefined,
      total,
    })
  })

  // Calculate average usage
  const totalDailyUsage = dailyUsage.reduce((sum, day) => sum + day.total, 0)
  const averageUsage = dailyUsage.length > 0 ? totalDailyUsage / dailyUsage.length : 0

  // Find peak usage day
  let peakUsageDay = { date: "", usage: 0 }

  dailyUsage.forEach((day) => {
    if (day.total > peakUsageDay.usage) {
      peakUsageDay = { date: day.date, usage: day.total }
    }
  })

  return {
    averageUsage,
    peakUsageDay,
    totalTokensPurchased,
    dailyUsage,
  }
}

// Get monthly usage data for reporting
export async function getMonthlyUsage(): Promise<{ month: string; usage: number }[]> {
  if (!isDatabaseConnected()) {
    return []
  }

  const result = await sql`
    WITH monthly_readings AS (
      SELECT 
        date_trunc('month', timestamp) as month,
        first_value(reading) OVER (PARTITION BY date_trunc('month', timestamp) ORDER BY timestamp ASC) as first_reading,
        first_value(reading) OVER (PARTITION BY date_trunc('month', timestamp) ORDER BY timestamp DESC) as last_reading
      FROM electricity_readings
    )
    SELECT DISTINCT
      to_char(month, 'YYYY-MM') as month,
      (last_reading - first_reading) as usage
    FROM monthly_readings
    ORDER BY month
  `

  return result.map((row) => ({
    month: row.month,
    usage: Number(row.usage),
  }))
}

// Migrate data from local storage to database
export async function migrateFromLocalStorage(
  readings: Omit<ElectricityReading, "id">[],
  tokens: Omit<TokenPurchase, "id">[],
): Promise<boolean> {
  try {
    checkDbConnection()

    // Begin transaction
    await sql`BEGIN`

    // Insert readings
    for (const reading of readings) {
      if (!reading.reading_id || !reading.timestamp || reading.reading === undefined || !reading.period) {
        console.warn("Skipping invalid reading:", reading)
        continue
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
      `
    }

    // Insert tokens
    for (const token of tokens) {
      if (!token.token_id || !token.timestamp || token.units === undefined || token.new_reading === undefined) {
        console.warn("Skipping invalid token:", token)
        continue
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
      `
    }

    // Commit transaction
    await sql`COMMIT`

    revalidatePath("/")
    return true
  } catch (error) {
    // Rollback on error
    await sql`ROLLBACK`
    console.error("Migration error:", error)
    return false
  }
}
