import type { Metadata } from "next"
import ElectricityTracker from "@/components/electricity-tracker"
import {
  getElectricityReadings,
  getTokenPurchases,
  getLatestReading,
  getTotalUnitsUsed,
} from "@/actions/electricity-actions"
import { isDatabaseConnected } from "@/lib/db"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Database } from "lucide-react"
import { ElectricityReading, TokenPurchase } from "@/lib/types"

export const metadata: Metadata = {
  title: "Electricity Expense Tracker",
  description: "Track your daily electricity usage and expenses",
}

export default async function HomePage() {
  const dbConnected = isDatabaseConnected()

  // Default values in case database is not connected
  let readings: ElectricityReading[] = []
  let tokens: TokenPurchase[] = []
  let latestReading = 0
  let totalUnits = 0

  // Only try to fetch data if database is connected
  if (dbConnected) {
    try {
      // Fetch initial data from the database
      readings = await getElectricityReadings()
      tokens = await getTokenPurchases()
      latestReading = await getLatestReading()
      totalUnits = await getTotalUnitsUsed()
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Electricity Expense Tracker</h1>

      {!dbConnected && (
        <Alert className="mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Database Connection Issue</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              The application cannot connect to the database. Please make sure your DATABASE_URL environment variable is
              set correctly.
            </p>
            <p className="text-sm">
              The app will run in local storage mode until the database connection is established.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <ElectricityTracker
        initialReadings={readings}
        initialTokens={tokens}
        initialLatestReading={latestReading}
        initialTotalUnits={totalUnits}
        dbConnected={dbConnected}
      />
    </div>
  )
}
