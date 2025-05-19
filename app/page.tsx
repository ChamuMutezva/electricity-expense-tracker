import type { Metadata } from "next"
import ElectricityTracker from "@/components/electricity-tracker"
import {
  getElectricityReadings,
  getTokenPurchases,
  getLatestReading,
  getTotalUnitsUsed,
} from "@/actions/electricity-actions"

export const metadata: Metadata = {
  title: "Electricity Expense Tracker",
  description: "Track your daily electricity usage and expenses",
}

export default async function HomePage() {
  // Fetch initial data from the database
  const readings = await getElectricityReadings()
  const tokens = await getTokenPurchases()
  const latestReading = await getLatestReading()
  const totalUnits = await getTotalUnitsUsed()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Electricity Expense Tracker</h1>
      <ElectricityTracker
        initialReadings={readings}
        initialTokens={tokens}
        initialLatestReading={latestReading}
        initialTotalUnits={totalUnits}
      />
    </div>
  )
}

