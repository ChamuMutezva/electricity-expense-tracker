/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, Info, Zap, Database, BarChart3 } from "lucide-react"
import UsageSummary from "@/components/usage-summary"
import UsageChart from "@/components/usage-chart"
import MonthlyReport from "@/components/monthly-report"
import { getTimeString, getNextUpdateTime } from "@/lib/date-utils"
import type { ElectricityReading, TokenPurchase } from "@/lib/types"
import { addElectricityReading, addTokenPurchase, migrateFromLocalStorage } from "@/actions/electricity-actions"
import { useToast } from "@/hooks/use-toast"

interface ElectricityTrackerProps {
  initialReadings: ElectricityReading[]
  initialTokens: TokenPurchase[]
  initialLatestReading: number
  initialTotalUnits: number
}

export default function ElectricityTracker({
  initialReadings,
  initialTokens,
  initialLatestReading,
  initialTotalUnits,
}: ElectricityTrackerProps) {
  const [readings, setReadings] = useState<ElectricityReading[]>(initialReadings)
  const [tokens, setTokens] = useState<TokenPurchase[]>(initialTokens)
  const [currentReading, setCurrentReading] = useState("")
  const [tokenUnits, setTokenUnits] = useState("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null)
  const [timeUntilUpdate, setTimeUntilUpdate] = useState<string>("")
  const [showNotification, setShowNotification] = useState(false)
  const [latestReading, setLatestReading] = useState(initialLatestReading)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalUnits, setTotalUnits] = useState(initialTotalUnits)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMigrationAlert, setShowMigrationAlert] = useState(false)
  const { toast } = useToast()

  // Check for local storage data on component mount
  useEffect(() => {
    const savedReadings = localStorage.getItem("electricityReadings")
    const savedTokens = localStorage.getItem("electricityTokens")

    if (savedReadings || savedTokens) {
      setShowMigrationAlert(true)
    }

    // Check if notifications were previously enabled
    const notifEnabled = localStorage.getItem("notificationsEnabled") === "true"
    setNotificationsEnabled(notifEnabled)

    // Request notification permission if previously enabled
    if (notifEnabled && "Notification" in window) {
      Notification.requestPermission()
    }
  }, [])

  // Save notification preference
  useEffect(() => {
    localStorage.setItem("notificationsEnabled", notificationsEnabled.toString())
  }, [notificationsEnabled])

  // Calculate next update time and set timer
  useEffect(() => {
    const next = getNextUpdateTime()
    setNextUpdate(next)

    const interval = setInterval(() => {
      const now = new Date()
      const next = getNextUpdateTime()
      setNextUpdate(next)

      // Calculate time until next update
      const diffMs = next.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const remainingMins = diffMins % 60

      setTimeUntilUpdate(`${diffHours}h ${remainingMins}m`)

      // Show notification 5 minutes before update time
      if (notificationsEnabled && diffMins <= 5 && diffMins > 0) {
        const period = getPeriodFromHour(next.getHours())
        showUpdateNotification(period)
        setShowNotification(true)
      } else {
        setShowNotification(false)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [notificationsEnabled])

  // Enable notifications
  const enableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setNotificationsEnabled(true)
      }
    }
  }

  // Show browser notification
  const showUpdateNotification = (period: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Electricity Update Reminder", {
        body: `It's almost time for your ${period} electricity reading update!`,
        icon: "/favicon.ico",
      })
    }
  }

  // Get period name based on hour
  const getPeriodFromHour = (hour: number): "morning" | "evening" | "night" => {
    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 20) return "evening"
    return "night"
  }

  // Add a new reading
  const handleAddReading = async () => {
    if (!currentReading || isNaN(Number(currentReading))) return

    try {
      setIsSubmitting(true)
      const newReading = await addElectricityReading(Number(currentReading))

      // Update local state
      setReadings((prev) => [...prev, newReading])
      setLatestReading(Number(currentReading))
      setCurrentReading("")

      toast({
        title: "Reading Added",
        description: `New reading of ${newReading.reading} kWh has been recorded.`,
      })
    } catch (error) {
      console.error("Error adding reading:", error)
      toast({
        title: "Error",
        description: "Failed to add reading. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a new token purchase
  const handleAddToken = async () => {
    if (!tokenUnits || isNaN(Number(tokenUnits))) return

    try {
      setIsSubmitting(true)
      const newToken = await addTokenPurchase(Number(tokenUnits))

      // Update local state
      setTokens((prev) => [...prev, newToken])
      setLatestReading(Number(newToken.new_reading))
      setTokenUnits("")

      toast({
        title: "Token Added",
        description: `${newToken.units} kWh added to your meter.`,
      })
    } catch (error) {
      console.error("Error adding token:", error)
      toast({
        title: "Error",
        description: "Failed to add token. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Migrate data from local storage to database
  const handleMigrateData = async () => {
    try {
      const savedReadings = localStorage.getItem("electricityReadings")
      const savedTokens = localStorage.getItem("electricityTokens")

      if (!savedReadings && !savedTokens) {
        setShowMigrationAlert(false)
        return
      }

      setIsSubmitting(true)

      // Format data for migration
      const localReadings: ElectricityReading[] = savedReadings
        ? JSON.parse(savedReadings).map((r: any) => ({
            reading_id: r.id,
            timestamp: new Date(r.timestamp),
            reading: r.reading,
            period: r.period,
          }))
        : []

      const localTokens: TokenPurchase[] = savedTokens
        ? JSON.parse(savedTokens).map((t: any) => ({
            token_id: t.id,
            timestamp: new Date(t.timestamp),
            units: t.units,
            new_reading: t.newReading,
          }))
        : []

      const success = await migrateFromLocalStorage(localReadings, localTokens)

      if (success) {
        // Clear local storage after successful migration
        localStorage.removeItem("electricityReadings")
        localStorage.removeItem("electricityTokens")

        setShowMigrationAlert(false)

        toast({
          title: "Data Migrated",
          description: "Your local data has been successfully migrated to the database.",
        })

        // Refresh the page to get the latest data
        window.location.reload()
      } else {
        throw new Error("Migration failed")
      }
    } catch (error) {
      console.error("Migration error:", error)
      toast({
        title: "Migration Failed",
        description: "Failed to migrate data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6">
      {showMigrationAlert && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Local Data Detected</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>We found electricity data stored in your browser. Would you like to migrate it to the database?</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleMigrateData} disabled={isSubmitting}>
                {isSubmitting ? "Migrating..." : "Migrate Data"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowMigrationAlert(false)}>
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Current Electricity Status
          </CardTitle>
          <CardDescription>Track and update your electricity meter readings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Latest Reading</h3>
                <p className="text-2xl font-bold">{latestReading} kWh</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Units Used</h3>
                <p className="text-2xl font-bold">{totalUnits} kWh</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">Next Update</h3>
                <p className="text-2xl font-bold">{nextUpdate ? getTimeString(nextUpdate) : "--:--"}</p>
                <p className="text-sm">In {timeUntilUpdate}</p>
              </div>
            </div>

            {showNotification && (
              <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertTitle>Update Reminder</AlertTitle>
                <AlertDescription>It&apos;s almost time for your electricity reading update!</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="reading">Update Electricity Reading</Label>
                <div className="flex gap-2">
                  <Input
                    id="reading"
                    placeholder="Enter current meter reading"
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                  <Button onClick={handleAddReading} disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>

              {!notificationsEnabled && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-slate-500" />
                    <span>Enable notifications for update reminders</span>
                  </div>
                  <Button variant="outline" onClick={enableNotifications}>
                    Enable
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Usage Summary</TabsTrigger>
          <TabsTrigger value="chart">Usage Chart</TabsTrigger>
          <TabsTrigger value="token">Add Token</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Usage Summary</CardTitle>
              <CardDescription>View your electricity usage patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <UsageSummary readings={readings} tokens={tokens} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Usage Chart</CardTitle>
              <CardDescription>Visualize your electricity consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <UsageChart readings={readings} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="token">
          <Card>
            <CardHeader>
              <CardTitle>Add Electricity Token</CardTitle>
              <CardDescription>Enter units from purchased electricity token</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="tokenUnits">Token Units</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tokenUnits"
                      placeholder="Enter units from token"
                      value={tokenUnits}
                      onChange={(e) => setTokenUnits(e.target.value)}
                      type="number"
                      step="0.01"
                    />
                    <Button onClick={handleAddToken} disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Token"}
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden mt-4">
                  <div className="grid grid-cols-3 bg-muted p-3 text-sm font-medium">
                    <div>Date</div>
                    <div>Units Added</div>
                    <div>New Reading</div>
                  </div>
                  <div className="divide-y max-h-[300px] overflow-y-auto">
                    {tokens.length > 0 ? (
                      tokens.map((token) => (
                        <div key={token.token_id} className="grid grid-cols-3 p-3 text-sm">
                          <div>{token.timestamp.toLocaleDateString()}</div>
                          <div>{token.units} kWh</div>
                          <div>{token.new_reading} kWh</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">No token history available</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Monthly Reports
              </CardTitle>
              <CardDescription>View detailed monthly usage reports</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
