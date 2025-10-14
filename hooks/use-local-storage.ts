"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Custom hook for managing localStorage with automatic sync
 * @param key - localStorage key
 * @param initialValue - default value if key doesn't exist
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
      return initialValue
    }
  })

  // Update localStorage whenever value changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function for useState-like API
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        // Save to localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error)
      }
    },
    [key, storedValue],
  )

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

/**
 * Hook specifically for managing electricity tracker localStorage
 */
export function useElectricityStorage(dbConnected: boolean) {
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage(
    "notificationsEnabled",
    false,
  )

  // Check if migration is needed
  const checkMigrationNeeded = useCallback(() => {
    if (!dbConnected) return false

    const savedReadings = localStorage.getItem("electricityReadings")
    const savedTokens = localStorage.getItem("electricityTokens")

    return Boolean(savedReadings || savedTokens)
  }, [dbConnected])

  // Clear all electricity data from localStorage
  const clearElectricityData = useCallback(() => {
    localStorage.removeItem("electricityReadings")
    localStorage.removeItem("electricityTokens")
  }, [])

  // Setup notifications on mount
  useEffect(() => {
    if (notificationsEnabled && "Notification" in window) {
      Notification.requestPermission()
    }
  }, [notificationsEnabled])

  return {
    notificationsEnabled,
    setNotificationsEnabled,
    checkMigrationNeeded,
    clearElectricityData,
  }
}
