"use client"

import { useCallback } from "react"
import { useElectricity } from "@/contexts/ElectricityContext"
import { addTokenPurchase } from "@/actions/electricity-actions"
import { useToast } from "@/hooks/use-toast"
import type { ElectricityReading, TokenPurchase } from "@/lib/types"

export function useElectricityTokens(dbConnected: boolean) {
  const { state, dispatch } = useElectricity()
  const { toast } = useToast()

  const getPeriodFromHour = (hour: number): "morning" | "evening" | "night" => {
    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 20) return "evening"
    return "night"
  }

  const handleAddToken = useCallback(async () => {
    if (!state.tokenUnits || Number.isNaN(state.tokenUnits)) return
    if (!state.tokenCost || Number.isNaN(state.tokenCost)) return

    try {
      dispatch({ type: "SET_IS_SUBMITTING", payload: true })

      if (dbConnected) {
        const newToken = await addTokenPurchase(Number(state.tokenUnits), Number(state.tokenCost))
        dispatch({ type: "ADD_TOKEN", payload: newToken })
        dispatch({ type: "SET_LATEST_READING", payload: Number(newToken.new_reading) })
      } else {
        const units = Number(state.tokenUnits)
        const costs = Number(state.tokenCost)
        const calculatedNewReading = state.latestReading + units

        const newToken: TokenPurchase = {
          id: Date.now(),
          token_id: `token-${Date.now()}`,
          timestamp: new Date(),
          units,
          new_reading: calculatedNewReading,
          total_cost: costs,
        }

        dispatch({ type: "ADD_TOKEN", payload: newToken })

        const now = new Date()
        const period = getPeriodFromHour(now.getHours())

        const newReadingEntry: ElectricityReading = {
          id: Date.now() + 1,
          reading_id: `token-reading-${Date.now()}`,
          timestamp: now,
          reading: calculatedNewReading,
          period,
        }

        dispatch({ type: "ADD_NEW_READING", payload: newReadingEntry })
        dispatch({ type: "SET_LATEST_READING", payload: calculatedNewReading })
      }

      dispatch({ type: "SET_TOKEN_UNITS", payload: "" })
      dispatch({ type: "SET_TOKEN_COST", payload: "" })

      toast({
        title: "Token Added",
        description: `${Number(state.tokenUnits)} kWh added to your meter.`,
      })
    } catch (error) {
      console.error("Error adding token:", error)
      toast({
        title: "Error",
        description: "Failed to add token. Please try again.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_IS_SUBMITTING", payload: false })
    }
  }, [state.tokenUnits, state.tokenCost, state.latestReading, dbConnected, dispatch, toast])

  return { handleAddToken }
}
