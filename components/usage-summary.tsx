"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/date-utils"

interface ElectricityReading {
  id: string
  timestamp: number
  reading: number
  period: "morning" | "evening" | "night"
}

interface TokenPurchase {
  id: string
  timestamp: number
  units: number
  newReading: number
}

interface UsageSummaryProps {
  readings: ElectricityReading[]
  tokens?: TokenPurchase[]
}

export default function UsageSummary({ readings, tokens }: UsageSummaryProps) {
  // Group readings by day
  const dailyReadings = useMemo(() => {
    const grouped: Record<string, ElectricityReading[]> = {}

    // Sort readings by timestamp
    const sortedReadings = [...readings].sort((a, b) => a.timestamp - b.timestamp)

    sortedReadings.forEach((reading) => {
      const date = formatDate(new Date(reading.timestamp))
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(reading)
    })

    return grouped
  }, [readings])

  // Calculate daily usage
  const dailyUsage = useMemo(() => {
    const usage: Record<
      string,
      {
        morning?: number
        evening?: number
        night?: number
        total: number
      }
    > = {}

    Object.entries(dailyReadings).forEach(([date, dayReadings]) => {
      if (dayReadings.length < 2) {
        usage[date] = { total: 0 }
        return
      }

      // Get readings by period
      const morningReading = dayReadings.find((r) => r.period === "morning")
      const eveningReading = dayReadings.find((r) => r.period === "evening")
      const nightReading = dayReadings.find((r) => r.period === "night")

      // Calculate differences between periods
      let morningToEvening = 0
      let eveningToNight = 0
      const nightToNextMorning = 0

      if (morningReading && eveningReading) {
        morningToEvening = eveningReading.reading - morningReading.reading
      }

      if (eveningReading && nightReading) {
        eveningToNight = nightReading.reading - eveningReading.reading
      }

      // Calculate total for the day
      const total = morningToEvening + eveningToNight + nightToNextMorning

      usage[date] = {
        morning: morningReading?.reading,
        evening: eveningReading?.reading,
        night: nightReading?.reading,
        total,
      }
    })

    return usage
  }, [dailyReadings])

  // Calculate average usage
  const averageUsage = useMemo(() => {
    const days = Object.values(dailyUsage)
    if (days.length === 0) return 0

    const totalUsage = days.reduce((sum, day) => sum + day.total, 0)
    return totalUsage / days.length
  }, [dailyUsage])

  // Calculate total tokens purchased
  const totalTokensPurchased = useMemo(() => {
    if (!tokens || tokens.length === 0) return 0
    return tokens.reduce((sum, token) => sum + token.units, 0)
  }, [tokens])

  // Calculate peak usage day
  const peakUsageDay = useMemo(() => {
    let maxUsage = 0
    let peakDay = ""

    Object.entries(dailyUsage).forEach(([date, usage]) => {
      if (usage.total > maxUsage) {
        maxUsage = usage.total
        peakDay = date
      }
    })

    return { date: peakDay, usage: maxUsage }
  }, [dailyUsage])

  if (readings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No readings recorded yet. Start by adding your first reading.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Average Daily Usage</div>
            <div className="text-2xl font-bold">{averageUsage.toFixed(2)} kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Peak Usage Day</div>
            <div className="text-2xl font-bold">{peakUsageDay.usage.toFixed(2)} kWh</div>
            <div className="text-sm text-muted-foreground">{peakUsageDay.date || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Tokens Purchased</div>
            <div className="text-2xl font-bold">{tokens ? totalTokensPurchased.toFixed(2) : "0"} kWh</div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 bg-muted p-3 text-sm font-medium">
          <div>Date</div>
          <div>Morning</div>
          <div>Evening</div>
          <div>Night</div>
        </div>
        <div className="divide-y">
          {Object.entries(dailyUsage).length > 0 ? (
            Object.entries(dailyUsage).map(([date, usage]) => (
              <div key={date} className="grid grid-cols-4 p-3 text-sm">
                <div>{date}</div>
                <div>{usage.morning !== undefined ? `${usage.morning} kWh` : "-"}</div>
                <div>{usage.evening !== undefined ? `${usage.evening} kWh` : "-"}</div>
                <div>{usage.night !== undefined ? `${usage.night} kWh` : "-"}</div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-muted-foreground">No daily data available</div>
          )}
        </div>
      </div>
      {tokens && tokens.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Token Purchase History</h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 bg-muted p-3 text-sm font-medium">
              <div>Date</div>
              <div>Units Added</div>
              <div>New Reading</div>
            </div>
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {tokens.map((token) => (
                <div key={token.id} className="grid grid-cols-3 p-3 text-sm">
                  <div>{formatDate(new Date(token.timestamp))}</div>
                  <div>{token.units} kWh</div>
                  <div>{token.newReading} kWh</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
