"use server"

import { sql } from "@/lib/db"
import type { ElectricityReading, TokenPurchase, UsageSummary, DailyUsage } from "@/lib/types"
import { getPeriodFromHour } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Add a new electricity reading
export async function addElectricityReading(reading: number): Promise<ElectricityReading> {
  const now = new Date()
  const period = getPeriodFromHour(now.getHours())
  const readingId = `reading-${Date.now()}`

  const result = await sql`
    INSERT INTO electricity_readings (reading_id, timestamp, reading, period)
    VALUES (${readingId}, ${now.toISOString()}, ${reading}, ${period})
    RETURNING id, reading_id, timestamp, reading, period, created_at
  `

  revalidatePath("/")
  return result[0] as ElectricityReading
}

// Add a new token purchase
export async function addTokenPurchase(units: number): Promise<TokenPurchase> {
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
  return tokenResult[0] as TokenPurchase
}

// Get all electricity readings
export async function getElectricityReadings(): Promise<ElectricityReading[]> {
  const readings = await sql`
    SELECT id, reading_id, timestamp, reading, period, created_at
    FROM electricity_readings
    ORDER BY timestamp ASC
  `

  return readings.map((reading) => ({
    ...reading,
    timestamp: new Date(reading.timestamp),
    created_at: reading.created_at ? new Date(reading.created_at) : undefined,
  })) as ElectricityReading[]
}

// Get all token purchases
export async function getTokenPurchases(): Promise<TokenPurchase[]> {
  const tokens = await sql`
    SELECT id, token_id, timestamp, units, new_reading, created_at
    FROM token_purchases
    ORDER BY timestamp ASC
  `

  return tokens.map((token) => ({
    ...token,
    timestamp: new Date(token.timestamp),
    created_at: token.created_at ? new Date(token.created_at) : undefined,
  })) as TokenPurchase[]
}

// Get the latest reading value
export async function getLatestReading(): Promise<number> {
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

// Migrate data from local storage to database (if needed)
export async function migrateFromLocalStorage(
  readings: ElectricityReading[],
  tokens: TokenPurchase[],
): Promise<boolean> {
  try {
    // Begin transaction
    await sql`BEGIN`

    // Insert readings
    for (const reading of readings) {
      await sql`
        INSERT INTO electricity_readings (reading_id, timestamp, reading, period)
        VALUES (${reading.reading_id}, ${reading.timestamp.toISOString()}, ${reading.reading}, ${reading.period})
        ON CONFLICT (reading_id) DO NOTHING
      `
    }

    // Insert tokens
    for (const token of tokens) {
      await sql`
        INSERT INTO token_purchases (token_id, timestamp, units, new_reading)
        VALUES (${token.token_id}, ${token.timestamp.toISOString()}, ${token.units}, ${token.new_reading})
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
