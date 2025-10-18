"use client"

import { useEffect } from "react"
import { useElectricity } from "@/contexts/ElectricityContext"
import { getNextUpdateTime } from "@/lib/date-utils"

export function useElectricityNotifications(notificationsEnabled: boolean) {
  const { dispatch } = useElectricity()

  useEffect(() => {
    const next = getNextUpdateTime()
    dispatch({ type: "SET_NEXT_UPDATE", payload: next })

    const interval = setInterval(() => {
      const now = new Date()
      const next = getNextUpdateTime()
      dispatch({ type: "SET_NEXT_UPDATE", payload: next })

      // Calculate time until next update
      const diffMs = next.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const remainingMins = diffMins % 60

      dispatch({
        type: "SET_TIME_UNTIL_UPDATE",
        payload: `${diffHours}h ${remainingMins}m`,
      })

      // Show notification 5 minutes before update time
      if (notificationsEnabled && diffMins <= 5 && diffMins > 0) {
        const period = getPeriodFromHour(next.getHours())
        showUpdateNotification(period)
        dispatch({ type: "SET_SHOW_NOTIFICATION", payload: true })
      } else {
        dispatch({ type: "SET_SHOW_NOTIFICATION", payload: false })
      }
    }, 60000) // Check every 1 minute

    return () => clearInterval(interval)
  }, [notificationsEnabled, dispatch])

  const showUpdateNotification = (period: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Electricity Update Reminder", {
        body: `It's almost time for your ${period} electricity reading update!`,
        icon: "/favicon.ico",
      })
    }
  }

  const enableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }

  return { enableNotifications }
}

function getPeriodFromHour(hour: number): "morning" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 20) return "evening"
  return "night"
}
