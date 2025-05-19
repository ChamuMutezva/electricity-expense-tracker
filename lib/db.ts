import { neon } from "@neondatabase/serverless"

// Create a reusable SQL client using the DATABASE_URL environment variable
export const sql = neon(process.env.DATABASE_URL!)

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
