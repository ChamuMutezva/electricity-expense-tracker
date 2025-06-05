"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Clock, RefreshCw } from "lucide-react"
import { getPeriodFromHour } from "@/lib/db"

type UpdateMeterReadingProps = {
  currentReading: string | number
  setCurrentReading: (value: string) => void
  handleAddReading: (forceUpdate?: boolean) => Promise<void>
  isSubmitting: boolean
  isSubmitted: boolean
  label?: string
  placeholder?: string
  buttonText?: string
  loadingText?: string
}

export const UpdateMeterReading = ({
  currentReading,
  setCurrentReading,
  handleAddReading,
  isSubmitting,
  isSubmitted,
  label = "Update Electricity Reading",
  placeholder = "Enter current meter reading",
  buttonText = "Update",
  loadingText = "Updating...",
}: UpdateMeterReadingProps) => {
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false)
  type Reading = { reading: number } | null
  const [existingReading, setExistingReading] = useState<Reading>(null)
  const [pendingReading, setPendingReading] = useState<string>("")

  // Get current period for display
  const getCurrentPeriod = () => {
    const hour = new Date().getHours()
    return getPeriodFromHour(hour)
  }

  const getPeriodDisplayName = (period: string) => {
    switch (period) {
      case "morning":
        return "Morning (5:00 AM - 12:00 PM)"
      case "evening":
        return "Evening (12:00 PM - 8:00 PM)"
      case "night":
        return "Night (8:00 PM - 5:00 AM)"
      default:
        return period
    }
  }

  const handleSubmit = async () => {
    if (!currentReading || isNaN(Number(currentReading))) {
      return
    }

    setPendingReading(currentReading.toString())

    try {
      await handleAddReading(false) // First try without force update
    } catch (error: unknown) {
      // Check if this is a duplicate reading error
      if (
        typeof error === "object" &&
        error !== null &&
        "existingReading" in error
      ) {
        setExistingReading((error as { existingReading: { reading: number } }).existingReading)
        setShowDuplicateAlert(true)
      }
    }
  }

  const handleForceUpdate = async () => {
    try {
      await handleAddReading(true) // Force update
      setShowDuplicateAlert(false)
      setExistingReading(null)
      setPendingReading("")
    } catch (error) {
      console.error("Error forcing update:", error)
    }
  }

  const handleCancelUpdate = () => {
    setShowDuplicateAlert(false)
    setExistingReading(null)
    setPendingReading("")
    setCurrentReading("")
  }

  const currentPeriod = getCurrentPeriod()

  return (
    <div className="space-y-4">
      {/* Duplicate Reading Alert */}
      {showDuplicateAlert && existingReading && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Reading Already Exists for {getPeriodDisplayName(currentPeriod)}
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  Current {currentPeriod} reading: <strong>{existingReading.reading} kWh</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>
                  New reading: <strong>{pendingReading} kWh</strong>
                </span>
              </div>
              <p className="text-sm">
                Would you like to update the existing {currentPeriod} reading with the new value?
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleForceUpdate}
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmitting ? "Updating..." : "Yes, Update Reading"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelUpdate}
                  disabled={isSubmitting}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Period Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Current Period: {getPeriodDisplayName(currentPeriod)}</span>
        </div>
      </div>

      {/* Reading Input */}
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="reading">{label}</Label>
        <div className="flex gap-2">
          <Input
            id="reading"
            placeholder={placeholder}
            value={currentReading}
            onChange={(e) => setCurrentReading(e.target.value)}
            type="number"
            step="0.01"
            className={!currentReading && isSubmitted ? "border-red-500" : ""}
            disabled={showDuplicateAlert}
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || showDuplicateAlert}
            className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
          >
            {isSubmitting ? loadingText : buttonText}
          </Button>
        </div>
        {/* Error message display */}
        {!currentReading && isSubmitted && <p className="text-sm text-red-500">Please enter a valid reading</p>}
      </div>
    </div>
  )
}
