import { neon } from "@neondatabase/serverless"

// Create a reusable SQL client with error handling for missing DATABASE_URL
let sql: ReturnType<typeof neon>

try {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  sql = neon(process.env.DATABASE_URL)
} catch (error) {
  console.error("Database connection error:", error)
  // Create a dummy SQL function that returns empty arrays for development/fallback
  sql = (() => {
    const dummyFn = () => Promise.resolve([])
    return dummyFn as unknown as ReturnType<typeof neon>
  })()
}

export { sql }

// Helper function to format date to ISO string without time
export function formatDateForDb(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Helper function to get the current period based on hour
export function getPeriodFromHour(hour: number): "morning" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 20) return "evening"
  return "night"
}

// Check if database connection is available
export function isDatabaseConnected(): boolean {
  return !!process.env.DATABASE_URL
}
