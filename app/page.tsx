import type { Metadata } from "next"
import ElectricityTracker from "@/components/electricity-tracker"

export const metadata: Metadata = {
  title: "Electricity Expense Tracker",
  description: "Track your daily electricity usage and expenses",
}

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Electricity Expense Tracker</h1>
      <ElectricityTracker />
    </div>
  )
}
