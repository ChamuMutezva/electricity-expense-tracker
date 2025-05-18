"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, Info, Zap } from "lucide-react"
import UsageSummary from "@/components/usage-summary"
import UsageChart from "@/components/usage-chart"
import { getNextUpdateTime, getTimeString } from "@/lib/date-utils"

// Define the structure for electricity readings
interface ElectricityReading {
  id: string
  timestamp: number
  reading: number
  period: "morning" | "evening" | "night"
}

// Define the structure for token purchases
interface TokenPurchase {
  id: string
  timestamp: number
  units: number
  newReading: number
}

export default function ElectricityTracker() {
  const [readings, setReadings] = useState<ElectricityReading[]>([])
  const [currentReading, setCurrentReading] = useState("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null)
  const [timeUntilUpdate, setTimeUntilUpdate] = useState<string>("")
  const [showNotification, setShowNotification] = useState(false)
  const [tokens, setTokens] = useState<TokenPurchase[]>([])
  const [tokenUnits, setTokenUnits] = useState("")

  // Load saved readings from localStorage on component mount
  useEffect(() => {
    const savedReadings = localStorage.getItem("electricityReadings")
    if (savedReadings) {
      setReadings(JSON.parse(savedReadings))
    }

    // Check if notifications were previously enabled
    const notifEnabled = localStorage.getItem("notificationsEnabled") === "true"
    setNotificationsEnabled(notifEnabled)

    // Request notification permission if previously enabled
    if (notifEnabled && "Notification" in window) {
      Notification.requestPermission()
    }
  }, [])

  // Load saved tokens from localStorage on component mount
  useEffect(() => {
    const savedTokens = localStorage.getItem("electricityTokens")
    if (savedTokens) {
      setTokens(JSON.parse(savedTokens))
    }
  }, [])

  // Save readings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("electricityReadings", JSON.stringify(readings))
  }, [readings])

  // Save tokens to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("electricityTokens", JSON.stringify(tokens))
  }, [tokens])

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
  const addReading = () => {
    if (!currentReading || isNaN(Number(currentReading))) return

    const now = new Date()
    const period = getPeriodFromHour(now.getHours())

    const newReading: ElectricityReading = {
      id: Date.now().toString(),
      timestamp: now.getTime(),
      reading: Number(currentReading),
      period,
    }

    setReadings((prev) => [...prev, newReading])
    setCurrentReading("")
  }

  // Add a new token purchase
  const addToken = () => {
    if (!tokenUnits || isNaN(Number(tokenUnits))) return

    const units = Number(tokenUnits)
    const latestReading = getLatestReading()
    const calculatedNewReading = latestReading + units

    // Create token purchase record
    const newToken: TokenPurchase = {
      id: Date.now().toString(),
      timestamp: new Date().getTime(),
      units,
      newReading: calculatedNewReading,
    }

    // Add to tokens list
    setTokens((prev) => [...prev, newToken])

    // Create a new reading entry with the updated meter value
    const now = new Date()
    const period = getPeriodFromHour(now.getHours())

    const newReadingEntry: ElectricityReading = {
      id: `token-${Date.now().toString()}`,
      timestamp: now.getTime(),
      reading: calculatedNewReading,
      period,
    }

    // Add to readings list
    setReadings((prev) => [...prev, newReadingEntry])

    // Clear input
    setTokenUnits("")
  }

  // Calculate total units used
  const calculateTotalUnits = (): number => {
    if (readings.length < 2) return 0

    // Sort readings by timestamp
    const sortedReadings = [...readings].sort((a, b) => a.timestamp - b.timestamp)

    // Calculate difference between first and last reading
    return sortedReadings[sortedReadings.length - 1].reading - sortedReadings[0].reading
  }

  // Get the latest reading
  const getLatestReading = (): number => {
    if (readings.length === 0) return 0

    const sortedReadings = [...readings].sort((a, b) => b.timestamp - a.timestamp)
    return sortedReadings[0].reading
  }

  return (
    <div className="grid gap-6">
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
                <p className="text-2xl font-bold">{getLatestReading()} kWh</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Units Used</h3>
                <p className="text-2xl font-bold">{calculateTotalUnits()} kWh</p>
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
                  <Button onClick={addReading}>Update</Button>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Usage Summary</TabsTrigger>
          <TabsTrigger value="chart">Usage Chart</TabsTrigger>
          <TabsTrigger value="token">Add Token</TabsTrigger>
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
                    <Button onClick={addToken}>Add Token</Button>
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
                        <div key={token.id} className="grid grid-cols-3 p-3 text-sm">
                          <div>{new Date(token.timestamp).toLocaleDateString()}</div>
                          <div>{token.units} kWh</div>
                          <div>{token.newReading} kWh</div>
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
      </Tabs>
    </div>
  )
}
