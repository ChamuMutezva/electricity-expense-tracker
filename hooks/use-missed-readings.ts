"use client"

import { useEffect } from "react"
import { useElectricity } from "@/contexts/ElectricityContext"

export function useMissedReadings() {
  const { state, dispatch } = useElectricity()

  useEffect(() => {
    const checkMissedReadings = () => {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      const todayReadings = state.readings.filter((r) => {
        const readingDate = new Date(r.timestamp)
        return readingDate.toISOString().split("T")[0] === todayStr
      })

      const hasMorning = todayReadings.some((r) => r.period === "morning")
      const hasEvening = todayReadings.some((r) => r.period === "evening")
      const hasNight = todayReadings.some((r) => r.period === "night")

      const missed: string[] = []
      const currentHour = today.getHours()

      if (currentHour >= 8 && !hasMorning) {
        missed.push("morning (7:00 AM)")
      }

      if (currentHour >= 18 && !hasEvening) {
        missed.push("evening (5:00 PM)")
      }

      if (currentHour >= 22 && !hasNight) {
        missed.push("night (9:00 PM)")
      }

      dispatch({ type: "SET_MISSED_READINGS", payload: missed })
    }

    checkMissedReadings()

    // Check every hour
    const interval = setInterval(checkMissedReadings, 3600000)

    return () => clearInterval(interval)
  }, [state.readings, dispatch])
}
