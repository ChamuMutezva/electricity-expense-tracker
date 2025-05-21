"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ElectricityReading } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageChartProps {
    readings: ElectricityReading[];
}

interface DailyConsumption {
    date: string;
    timestamp: Date;
    consumption: number;
    period: "morning" | "evening" | "night";
}

export default function UsageChart({ readings }: Readonly<UsageChartProps>) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [chartWidth, setChartWidth] = useState(0);
    const [chartHeight, setChartHeight] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dailyConsumption, setDailyConsumption] = useState<
        DailyConsumption[]
    >([]);

    // Calculate daily consumption from readings
    useEffect(() => {
        if (readings.length < 2) {
            setDailyConsumption([]);
            return;
        }

        // Sort readings by timestamp
        const sortedReadings = [...readings].sort((a, b) => {
            const timestampA =
                a.timestamp instanceof Date
                    ? a.timestamp
                    : new Date(a.timestamp);
            const timestampB =
                b.timestamp instanceof Date
                    ? b.timestamp
                    : new Date(b.timestamp);
            return timestampA.getTime() - timestampB.getTime();
        });

        // Group readings by day
        const readingsByDay: Record<string, ElectricityReading[]> = {};
        sortedReadings.forEach((reading) => {
            const date = reading.timestamp.toISOString().split("T")[0];
            if (!readingsByDay[date]) {
                readingsByDay[date] = [];
            }
            readingsByDay[date].push(reading);
        });
        // console.log("Readings by day:", readingsByDay);
        // Calculate consumption for each day and period
        const consumption: DailyConsumption[] = [];

        // Process each day
        Object.entries(readingsByDay).forEach(([date, dayReadings]) => {
            // Sort by timestamp
            dayReadings.sort(
                (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
            );

            // Calculate consumption between consecutive readings
            for (let i = 1; i < dayReadings.length; i++) {
                const prevReading = dayReadings[i - 1];
                const currentReading = dayReadings[i];

                const prevValue = Number(prevReading.reading);
                const currentValue = Number(currentReading.reading);

                // Only calculate if the current reading is greater than the previous one
                // (to handle cases where the meter might have been reset)
                if (prevValue >= currentValue) {
                    consumption.push({
                        date,
                        timestamp: currentReading.timestamp,
                        consumption: Number(
                            (prevValue - currentValue).toFixed(2)
                        ),
                        period: currentReading.period,
                    });
                }
            }
        });

        // Also calculate consumption between days (last reading of previous day to first reading of next day)
        const days = Object.keys(readingsByDay).sort();
        for (let i = 1; i < days.length; i++) {
            const prevDay = days[i - 1];
            const currentDay = days[i];

            const prevDayReadings = readingsByDay[prevDay];
            const currentDayReadings = readingsByDay[currentDay];

            if (prevDayReadings.length > 0 && currentDayReadings.length > 0) {
                const lastReadingPrevDay =
                    prevDayReadings[prevDayReadings.length - 1];
                const firstReadingCurrentDay = currentDayReadings[0];

                const prevValue = Number(lastReadingPrevDay.reading);
                const currentValue = Number(firstReadingCurrentDay.reading);

                // Only calculate if the current reading is greater than the previous one
                if (prevValue >= currentValue) {
                    consumption.push({
                        date: currentDay,
                        timestamp: firstReadingCurrentDay.timestamp,
                        consumption: Number(
                            (prevValue - currentValue).toFixed(2)
                        ),
                        period: firstReadingCurrentDay.period,
                    });
                }
            }
        }

        // Sort by timestamp
        consumption.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

        setDailyConsumption(consumption);
    }, [readings]);

    useEffect(() => {
        // Set canvas dimensions based on container
        const updateDimensions = () => {
            if (canvasRef.current) {
                const container = canvasRef.current.parentElement;
                if (container) {
                    setChartWidth(container.clientWidth);
                    setChartHeight(300); // Fixed height
                }
            }
        };

        // Initial update and listen for resize
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        setLoading(false);

        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    useEffect(() => {
        if (
            !canvasRef.current ||
            dailyConsumption.length === 0 ||
            chartWidth === 0
        )
            return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas dimensions
        canvas.width = chartWidth;
        canvas.height = chartHeight;

        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);

        // Find min and max values for scaling
        const consumptionValues = dailyConsumption.map((r) => r.consumption);
        const minConsumption = 0; // Math.min(...consumptionValues);
        const maxConsumption = Math.max(...consumptionValues);
        const range = maxConsumption - minConsumption || 1;

        // Set padding
        const padding = { top: 30, right: 20, bottom: 50, left: 60 };
        const chartInnerWidth = chartWidth - padding.left - padding.right;
        const chartInnerHeight = chartHeight - padding.top - padding.bottom;

        // Draw axes
        ctx.beginPath();
        ctx.strokeStyle = "#94a3b8"; // slate-400
        ctx.lineWidth = 1;

        // Y-axis
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, chartHeight - padding.bottom);

        // X-axis
        ctx.moveTo(padding.left, chartHeight - padding.bottom);
        ctx.lineTo(chartWidth - padding.right, chartHeight - padding.bottom);
        ctx.stroke();

        // Draw Y-axis labels
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#64748b"; // slate-500
        ctx.font = "12px sans-serif";

        const yLabelCount = 5;
        for (let i = 0; i <= yLabelCount; i++) {
            const y =
                padding.top +
                (chartInnerHeight * (yLabelCount - i)) / yLabelCount;
            const value = minConsumption + (range * i) / yLabelCount;

            ctx.fillText(value.toFixed(1) + " kWh", padding.left - 10, y);

            // Grid line
            ctx.beginPath();
            ctx.strokeStyle = "#e2e8f0"; // slate-200
            ctx.moveTo(padding.left, y);
            ctx.lineTo(chartWidth - padding.right, y);
            ctx.stroke();
        }

        // Group consumption by day for X-axis
        const dayGroups: Record<string, DailyConsumption[]> = {};
        dailyConsumption.forEach((item) => {
            if (!dayGroups[item.date]) {
                dayGroups[item.date] = [];
            }
            dayGroups[item.date].push(item);
        });

        const days = Object.keys(dayGroups);

        // Draw X-axis labels
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        days.forEach((day, i) => {
            const x =
                padding.left + (chartInnerWidth * i) / (days.length - 1 || 1);

            // Format date for display (e.g., "May 20")
            const dateObj = new Date(day);
            const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            });

            ctx.fillText(formattedDate, x, chartHeight - padding.bottom + 10);

            // Grid line
            ctx.beginPath();
            ctx.strokeStyle = "#e2e8f0"; // slate-200
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, chartHeight - padding.bottom);
            ctx.stroke();
        });

        // Draw bar chart
        const barWidth = Math.min(
            30,
            (chartInnerWidth / (dailyConsumption.length + 1)) * 0.8
        );

        dailyConsumption.forEach((item, index) => {
            // Calculate x position based on timestamp
            const dayIndex = days.indexOf(item.date);
            const dayX =
                padding.left +
                (chartInnerWidth * dayIndex) / (days.length - 1 || 1);

            // Calculate time offset within day (0-1)
            const date = new Date(item.timestamp);
            const timeOffset =
                (date.getHours() * 60 + date.getMinutes()) / (24 * 60);

            // Position bars within the day based on period
            let periodOffset = 0;
            if (item.period === "morning") periodOffset = -barWidth;
            else if (item.period === "evening") periodOffset = 0;
            else if (item.period === "night") periodOffset = barWidth;

            const x = dayX + periodOffset;

            // Calculate bar height based on consumption
            const normalizedValue =
                range === 0 ? 0.5 : (item.consumption - minConsumption) / range;
            const barHeight = normalizedValue * chartInnerHeight;

            // Draw bar
            ctx.fillStyle = getColorForPeriod(item.period);
            ctx.fillRect(
                x - barWidth / 2,
                chartHeight - padding.bottom - barHeight,
                barWidth,
                barHeight
            );

            // Draw consumption value above bar
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = "#334155"; // slate-700
            ctx.font = "10px sans-serif";
            ctx.fillText(
                item.consumption.toFixed(1),
                x,
                chartHeight - padding.bottom - barHeight - 5
            );
        });

        // Draw title
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#334155"; // slate-700
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("Daily Electricity Consumption", chartWidth / 2, 10);

        // Draw legend
        const legendY = chartHeight - 15;
        const legendSpacing = 80;

        // Morning
        ctx.fillStyle = getColorForPeriod("morning");
        ctx.fillRect(padding.left, legendY, 15, 10);
        ctx.textAlign = "left";
        ctx.fillStyle = "#334155";
        ctx.fillText("Morning", padding.left + 20, legendY + 5);

        // Evening
        ctx.fillStyle = getColorForPeriod("evening");
        ctx.fillRect(padding.left + legendSpacing, legendY, 15, 10);
        ctx.fillStyle = "#334155";
        ctx.fillText("Evening", padding.left + legendSpacing + 20, legendY + 5);

        // Night
        ctx.fillStyle = getColorForPeriod("night");
        ctx.fillRect(padding.left + legendSpacing * 2, legendY, 15, 10);
        ctx.fillStyle = "#334155";
        ctx.fillText(
            "Night",
            padding.left + legendSpacing * 2 + 20,
            legendY + 5
        );
    }, [dailyConsumption, chartWidth, chartHeight]);

    // Helper function to get color based on period
    const getColorForPeriod = (
        period: "morning" | "evening" | "night"
    ): string => {
        switch (period) {
            case "morning":
                return "#10b981"; // emerald-500
            case "evening":
                return "#f59e0b"; // amber-500
            case "night":
                return "#6366f1"; // indigo-500
            default:
                return "#10b981"; // default to emerald-500
        }
    };

    // Calculate average consumption by period
    const getAverageByPeriod = (
        period: "morning" | "evening" | "night"
    ): number => {
        const periodConsumption = dailyConsumption.filter(
            (item) => item.period === period
        );
        if (periodConsumption.length === 0) return 0;

        const total = periodConsumption.reduce(
            (sum, item) => sum + item.consumption,
            0
        );
        return Number((total / periodConsumption.length).toFixed(2));
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (readings.length < 2) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Not enough data to display chart. Add at least two readings.
            </div>
        );
    }

    if (dailyConsumption.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No consumption data available. Make sure you have multiple
                readings within the same day or consecutive days.
            </div>
        );
    }

    const morningAvg = getAverageByPeriod("morning");
    const eveningAvg = getAverageByPeriod("evening");
    const nightAvg = getAverageByPeriod("night");

    return (
        <div className="space-y-6">
            <div className="relative w-full h-[300px]">
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Morning Usage
                        </div>
                        <div className="text-lg font-bold text-emerald-600">
                            {morningAvg} kWh
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Average at 7:00 AM
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Evening Usage
                        </div>
                        <div className="text-lg font-bold text-amber-600">
                            {eveningAvg} kWh
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Average at 5:00 PM
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Night Usage
                        </div>
                        <div className="text-lg font-bold text-indigo-600">
                            {nightAvg} kWh
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Average at 9:00 PM
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
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
    );
}
