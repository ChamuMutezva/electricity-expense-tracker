"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Lightbulb, Battery, Clock, X } from "lucide-react"
import type { ElectricityReading, TokenPurchase } from "@/lib/types"

interface SmartAlertsProps {
  readings: ElectricityReading[]
  tokens: TokenPurchase[]
}

interface AlertItem {
  id: string
  type: "warning" | "info" | "success" | "critical"
  title: string
  message: string
  action?: string
  icon: React.ReactNode
  priority: number
}

export default function SmartAlerts({ readings, tokens }: SmartAlertsProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  useEffect(() => {
    const newAlerts: AlertItem[] = []

    // Check for unusual usage spikes
    if (readings.length >= 3) {
      const recent = readings.slice(-3)
      let totalUsage = 0
      let usageCount = 0

      for (let i = 1; i < recent.length; i++) {
        const usage = recent[i - 1].reading - recent[i].reading
        if (usage > 0) {
          totalUsage += usage
          usageCount++
        }
      }

      if (usageCount > 0) {
        const avgUsage = totalUsage / usageCount
        const lastUsage = recent[0].reading - recent[1].reading

        if (lastUsage > avgUsage * 1.5 && lastUsage > 0) {
          newAlerts.push({
            id: "usage-spike",
            type: "warning",
            title: "Unusual Usage Spike Detected",
            message: `Your last reading shows ${lastUsage.toFixed(1)} kWh usage, which is ${((lastUsage / avgUsage - 1) * 100).toFixed(0)}% higher than average.`,
            action: "Check appliances",
            icon: <TrendingUp className="h-4 w-4" />,
            priority: 2,
          })
        }
      }
    }

    // Check for low meter balance
    const latestReading = readings[readings.length - 1]?.reading || 0
    if (latestReading < 50) {
      const alertType = latestReading < 20 ? "critical" : "warning"
      newAlerts.push({
        id: "low-balance",
        type: alertType,
        title: latestReading < 20 ? "Critical: Very Low Balance" : "Low Meter Balance",
        message: `Your meter balance is ${latestReading.toFixed(1)} kWh. ${latestReading < 20 ? "Immediate action required!" : "Consider purchasing tokens soon."}`,
        action: "Buy tokens",
        icon: <Battery className="h-4 w-4" />,
        priority: latestReading < 20 ? 1 : 2,
      })
    }

    // Check for missed readings
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const todayReadings = readings.filter((r) => new Date(r.timestamp).toISOString().split("T")[0] === todayStr)

    const currentHour = today.getHours()
    const missedPeriods = []

    if (currentHour >= 8 && !todayReadings.some((r) => r.period === "morning")) {
      missedPeriods.push("morning")
    }
    if (currentHour >= 18 && !todayReadings.some((r) => r.period === "evening")) {
      missedPeriods.push("evening")
    }
    if (currentHour >= 22 && !todayReadings.some((r) => r.period === "night")) {
      missedPeriods.push("night")
    }

    if (missedPeriods.length > 0) {
      newAlerts.push({
        id: "missed-readings",
        type: "info",
        title: "Missed Readings",
        message: `You haven't recorded ${missedPeriods.join(", ")} reading(s) today.`,
        action: "Add reading",
        icon: <Clock className="h-4 w-4" />,
        priority: 3,
      })
    }

    // Energy efficiency tips
    if (readings.length >= 7) {
      let weeklyUsage = 0
      const weekReadings = readings.slice(-7)

      for (let i = 1; i < weekReadings.length; i++) {
        const usage = weekReadings[i - 1].reading - weekReadings[i].reading
        if (usage > 0) weeklyUsage += usage
      }

      if (weeklyUsage > 35) {
        newAlerts.push({
          id: "efficiency-tip",
          type: "info",
          title: "Energy Saving Tip",
          message: "Your weekly usage is above average. Try using energy-efficient appliances during off-peak hours.",
          icon: <Lightbulb className="h-4 w-4" />,
          priority: 4,
        })
      }
    }

    // Filter out dismissed alerts and sort by priority
    const filteredAlerts = newAlerts
      .filter((alert) => !dismissedAlerts.includes(alert.id))
      .sort((a, b) => a.priority - b.priority)

    setAlerts(filteredAlerts)
  }, [readings, tokens, dismissedAlerts])

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => [...prev, alertId])
  }

  const getAlertStyles = (type: AlertItem["type"]) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50 text-red-800 dark:bg-red-800 dark:text-red-50"
      case "warning":
        return "border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-800 dark:text-orange-50"
      case "success":
        return "border-green-200 bg-green-50 text-green-800 dark:bg-green-800 dark:text-green-50"
      default:
        return "border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-800 dark:text-blue-50"
    }
  }

  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id} className={getAlertStyles(alert.type)}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {alert.icon}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{alert.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {alert.type.toUpperCase()}
                  </Badge>
                </div>
                <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                {alert.action && (
                  <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                    {alert.action}
                  </Button>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  )
}
