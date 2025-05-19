"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { ElectricityReading } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

interface UsageChartProps {
  readings: ElectricityReading[]
}

export default function UsageChart({ readings }: UsageChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [chartWidth, setChartWidth] = useState(0)
  const [chartHeight, setChartHeight] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set canvas dimensions based on container
    const updateDimensions = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement
        if (container) {
          setChartWidth(container.clientWidth)
          setChartHeight(300) // Fixed height
        }
      }
    }

    // Initial update and listen for resize
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    setLoading(false)

    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || readings.length < 2 || chartWidth === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = chartWidth
    canvas.height = chartHeight

    // Clear canvas
    ctx.clearRect(0, 0, chartWidth, chartHeight)

    // Sort readings by timestamp, ensuring timestamps are Date objects
    const sortedReadings = [...readings].sort((a, b) => {
      const timestampA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp)
      const timestampB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp)
      return timestampA.getTime() - timestampB.getTime()
    })

    // Find min and max values for scaling
    const readingValues = sortedReadings.map((r) => Number(r.reading))
    const minReading = Math.min(...readingValues)
    const maxReading = Math.max(...readingValues)
    const range = maxReading - minReading

    // Set padding
    const padding = { top: 30, right: 20, bottom: 50, left: 60 }
    const chartInnerWidth = chartWidth - padding.left - padding.right
    const chartInnerHeight = chartHeight - padding.top - padding.bottom

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = "#94a3b8" // slate-400
    ctx.lineWidth = 1

    // Y-axis
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, chartHeight - padding.bottom)

    // X-axis
    ctx.moveTo(padding.left, chartHeight - padding.bottom)
    ctx.lineTo(chartWidth - padding.right, chartHeight - padding.bottom)
    ctx.stroke()

    // Draw Y-axis labels
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "#64748b" // slate-500
    ctx.font = "12px sans-serif"

    const yLabelCount = 5
    for (let i = 0; i <= yLabelCount; i++) {
      const y = padding.top + (chartInnerHeight * (yLabelCount - i)) / yLabelCount
      const value = minReading + (range * i) / yLabelCount

      ctx.fillText(value.toFixed(1), padding.left - 10, y)

      // Grid line
      ctx.beginPath()
      ctx.strokeStyle = "#e2e8f0" // slate-200
      ctx.moveTo(padding.left, y)
      ctx.lineTo(chartWidth - padding.right, y)
      ctx.stroke()
    }

    // Group readings by day for X-axis
    const dayGroups: Record<string, ElectricityReading[]> = {}
    sortedReadings.forEach((reading) => {
      const date = reading.timestamp.toISOString().split("T")[0]
      if (!dayGroups[date]) {
        dayGroups[date] = []
      }
      dayGroups[date].push(reading)
    })

    const days = Object.keys(dayGroups)

    // Draw X-axis labels
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    days.forEach((day, i) => {
      const x = padding.left + (chartInnerWidth * i) / (days.length - 1 || 1)

      ctx.fillText(day, x, chartHeight - padding.bottom + 10)

      // Grid line
      ctx.beginPath()
      ctx.strokeStyle = "#e2e8f0" // slate-200
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, chartHeight - padding.bottom)
      ctx.stroke()
    })

    // Draw line chart
    ctx.beginPath()
    ctx.strokeStyle = "#10b981" // emerald-500
    ctx.lineWidth = 2

    // Map day and reading to coordinates
    const points: [number, number][] = []

    days.forEach((day, dayIndex) => {
      const dayReadings = dayGroups[day]

      dayReadings.forEach((reading) => {
        // Calculate x based on day and time within day
        const dayX = padding.left + (chartInnerWidth * dayIndex) / (days.length - 1 || 1)

        // Calculate time offset within day (0-1)
        const date = new Date(reading.timestamp)
        const timeOffset = (date.getHours() * 60 + date.getMinutes()) / (24 * 60)

        // If it's not the last day, blend with next day
        let x = dayX
        if (dayIndex < days.length - 1) {
          const nextDayX = padding.left + (chartInnerWidth * (dayIndex + 1)) / (days.length - 1)
          x = dayX + timeOffset * (nextDayX - dayX)
        }

        // Calculate y based on reading value
        const normalizedValue = range === 0 ? 0.5 : (Number(reading.reading) - minReading) / range
        const y = chartHeight - padding.bottom - normalizedValue * chartInnerHeight

        points.push([x, y])
      })
    })

    // Draw the line
    if (points.length > 0) {
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1])
      }

      ctx.stroke()

      // Draw points
      points.forEach(([x, y]) => {
        ctx.beginPath()
        ctx.fillStyle = "#10b981" // emerald-500
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = "#ffffff"
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw title
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillStyle = "#334155" // slate-700
    ctx.font = "bold 14px sans-serif"
    ctx.fillText("Electricity Usage Over Time", chartWidth / 2, 10)
  }, [readings, chartWidth, chartHeight])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (readings.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Not enough data to display chart. Add at least two readings.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative w-full h-[300px]">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Morning Usage</div>
            <div className="text-lg font-bold text-emerald-600">Lowest</div>
            <div className="text-sm text-muted-foreground">7:00 AM</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Evening Usage</div>
            <div className="text-lg font-bold text-amber-600">Moderate</div>
            <div className="text-sm text-muted-foreground">5:00 PM</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Night Usage</div>
            <div className="text-lg font-bold text-red-600">Highest</div>
            <div className="text-sm text-muted-foreground">9:00 PM</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full h-[300px]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
