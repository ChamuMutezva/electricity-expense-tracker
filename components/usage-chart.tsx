/**
 * UsageChart component displays electricity consumption data in a visually enhanced chart.
 *
 * - Renders a tabbed interface with two main views: "Enhanced Charts" and "Quick Overview".
 * - The "Enhanced Charts" tab shows a custom-drawn bar chart of daily electricity consumption,
 *   grouped by period (morning, evening, night), with gradients, shadows, and legends.
 * - The "Quick Overview" tab provides summary statistics and period distribution.
 * - Handles responsive resizing and updates chart dimensions on window resize or tab switch.
 * - Calculates daily consumption from an array of electricity readings, supporting
 *   grouping by day and period, and handles meter resets.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {ElectricityReading[]} props.readings - Array of electricity readings to visualize.
 * @returns {JSX.Element} The rendered UsageChart component.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { ElectricityReading, Period } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedUsageCharts from "./enhanced-usage-charts";
import { BarChart3, TrendingUp, PieChart, Activity } from "lucide-react";

interface UsageChartProps {
    readings: ElectricityReading[];
}

interface DailyConsumption {
    date: string;
    timestamp: Date;
    consumption: number;
    period: Period;
}

type TimePeriod = "weekly" | "monthly" | "all";

export default function UsageChart({ readings }: Readonly<UsageChartProps>) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [chartWidth, setChartWidth] = useState(0);
    const [chartHeight, setChartHeight] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dailyConsumption, setDailyConsumption] = useState<
        DailyConsumption[]
    >([]);
    const [timePeriod] = useState<TimePeriod>("weekly");
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

    // Calculate daily consumption from readings - KEEPING ORIGINAL LOGIC
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
        for (const reading of sortedReadings) {
            const date = reading.timestamp.toISOString().split("T")[0];
            if (!readingsByDay[date]) {
                readingsByDay[date] = [];
            }
            readingsByDay[date].push(reading);
        }

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
        const days = Object.keys(readingsByDay).sort((a, b) => a.localeCompare(b));
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

        // Set current week to the most recent week
        if (consumption.length > 0) {
            const latestDate = new Date(
                consumption[consumption.length - 1].date
            );
            const weekStart = new Date(latestDate);
            weekStart.setDate(weekStart.getDate() - 6); // Start of the week (7 days including today)
            setCurrentWeekStart(weekStart);
        }
    }, [readings]);

    // KEEPING ORIGINAL DIMENSION LOGIC BUT ADDING TAB SWITCH DETECTION
    useEffect(() => {
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

        // Add a small delay to handle tab switching
        const timeoutId = setTimeout(updateDimensions, 100);

        return () => {
            window.removeEventListener("resize", updateDimensions);
            clearTimeout(timeoutId);
        };
    }, []);

    // Add effect to handle tab switching - trigger when component receives new data
    useEffect(() => {
        if (dailyConsumption.length > 0) {
            const updateDimensions = () => {
                if (canvasRef.current) {
                    const container = canvasRef.current.parentElement;
                    if (container) {
                        setChartWidth(container.clientWidth);
                        setChartHeight(300);
                    }
                }
            };

            // Small delay to ensure tab is fully switched
            const timeoutId = setTimeout(updateDimensions, 50);
            return () => clearTimeout(timeoutId);
        }
    }, [dailyConsumption]);

    // Filter data based on time period
    const getFilteredData = (): DailyConsumption[] => {
        if (timePeriod === "all") {
            return dailyConsumption;
        }

        if (timePeriod === "weekly") {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            return dailyConsumption.filter((item) => {
                const itemDate = new Date(item.date);
                return itemDate >= currentWeekStart && itemDate <= weekEnd;
            });
        }

        if (timePeriod === "monthly") {
            const monthStart = new Date(currentWeekStart);
            monthStart.setDate(1);

            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);

            return dailyConsumption.filter((item) => {
                const itemDate = new Date(item.date);
                return itemDate >= monthStart && itemDate <= monthEnd;
            });
        }

        return dailyConsumption;
    };

    const filteredData = getFilteredData();

    // Enhanced drawing with gradients and shadows
    useEffect(() => {
        if (!canvasRef.current || filteredData.length === 0 || chartWidth === 0)
            return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas dimensions with device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = chartWidth * dpr;
        canvas.height = chartHeight * dpr;
        canvas.style.width = chartWidth + "px";
        canvas.style.height = chartHeight + "px";
        ctx.scale(dpr, dpr);

        // Clear canvas with subtle background
        ctx.fillStyle = "#fafafa";
        ctx.fillRect(0, 0, chartWidth, chartHeight);

        // Find min and max values for scaling
        const consumptionValues = filteredData.map((r) => r.consumption);
        const minConsumption = 0;
        const maxConsumption = Math.max(...consumptionValues);
        const range = maxConsumption - minConsumption || 1;

        // Set padding
        const padding = { top: 40, right: 30, bottom: 70, left: 80 };
        const chartInnerWidth = chartWidth - padding.left - padding.right;
        const chartInnerHeight = chartHeight - padding.top - padding.bottom;

        // Draw subtle background grid
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 1;

        const yLabelCount = 5;
        for (let i = 0; i <= yLabelCount; i++) {
            const y =
                padding.top +
                (chartInnerHeight * (yLabelCount - i)) / yLabelCount;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(chartWidth - padding.right, y);
            ctx.stroke();
        }

        // Draw main axes with enhanced styling
        ctx.beginPath();
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;

        // Y-axis
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, chartHeight - padding.bottom);

        // X-axis
        ctx.moveTo(padding.left, chartHeight - padding.bottom);
        ctx.lineTo(chartWidth - padding.right, chartHeight - padding.bottom);
        ctx.stroke();

        // Enhanced Y-axis labels with better typography
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#475569";
        ctx.font = "600 12px system-ui, -apple-system, sans-serif";

        for (let i = 0; i <= yLabelCount; i++) {
            const y =
                padding.top +
                (chartInnerHeight * (yLabelCount - i)) / yLabelCount;
            const value = minConsumption + (range * i) / yLabelCount;
            ctx.fillText(value.toFixed(1) + " kWh", padding.left - 15, y);
        }

        // Group consumption by day for X-axis
        const dayGroups: Record<string, DailyConsumption[]> = {};
        filteredData.forEach((item) => {
            if (!dayGroups[item.date]) {
                dayGroups[item.date] = [];
            }
            dayGroups[item.date].push(item);
        });

        const days = Object.keys(dayGroups).sort();

        // Enhanced X-axis labels
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#475569";
        ctx.font = "500 11px system-ui, -apple-system, sans-serif";

        days.forEach((day, i) => {
            const x =
                padding.left + (chartInnerWidth * i) / (days.length - 1 || 1);
            const dateObj = new Date(day);
            const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            });
            ctx.fillText(formattedDate, x, chartHeight - padding.bottom + 15);
        });

        // Enhanced bar chart with gradients and shadows
        const totalDays = days.length;
        const availableWidth = chartInnerWidth - 40; // Leave 20px margin on each side
        const dayWidth = availableWidth / totalDays;
        const maxBarWidth = Math.min(25, dayWidth * 0.25); // Smaller bars, max 25px
        const periodSpacing = maxBarWidth * 0.8; // Spacing between periods within a day

        filteredData.forEach((item) => {
            const dayIndex = days.indexOf(item.date);

            // Calculate day center position with proper margins
            const dayCenter =
                padding.left + 20 + dayIndex * dayWidth + dayWidth / 2;

            // Position bars within the day based on period with tighter spacing
            let periodOffset = 0;
            if (item.period === "morning") periodOffset = -periodSpacing;
            else if (item.period === "evening") periodOffset = 0;
            else if (item.period === "night") periodOffset = periodSpacing;

            const x = dayCenter + periodOffset;
            const normalizedValue =
                range === 0 ? 0.5 : (item.consumption - minConsumption) / range;
            const barHeight = normalizedValue * chartInnerHeight;

            // Ensure bars don't go outside chart boundaries
            const barLeft = Math.max(padding.left + 10, x - maxBarWidth / 2);
            const barRight = Math.min(
                chartWidth - padding.right - 10,
                x + maxBarWidth / 2
            );
            const actualBarWidth = barRight - barLeft;

            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(
                0,
                chartHeight - padding.bottom - barHeight,
                0,
                chartHeight - padding.bottom
            );
            const colors = getEnhancedColorsForPeriod(item.period);
            gradient.addColorStop(0, colors.top);
            gradient.addColorStop(1, colors.bottom);

            // Draw shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;

            // Draw bar with gradient using corrected positioning
            ctx.fillStyle = gradient;
            ctx.fillRect(
                barLeft,
                chartHeight - padding.bottom - barHeight,
                actualBarWidth,
                barHeight
            );

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Enhanced consumption value labels with better positioning
            if (barHeight > 20 && actualBarWidth > 15) {
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillStyle = "#1e293b";
                ctx.font = "600 9px system-ui, -apple-system, sans-serif";

                // Add subtle background for text readability
                const textWidth = ctx.measureText(
                    item.consumption.toFixed(1)
                ).width;
                const textX = barLeft + actualBarWidth / 2;

                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.fillRect(
                    textX - textWidth / 2 - 2,
                    chartHeight - padding.bottom - barHeight - 18,
                    textWidth + 4,
                    14
                );

                ctx.fillStyle = "#1e293b";
                ctx.fillText(
                    item.consumption.toFixed(1),
                    textX,
                    chartHeight - padding.bottom - barHeight - 6
                );
            }
        });

        // Enhanced X-axis labels with improved positioning
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#475569";
        ctx.font = "500 11px system-ui, -apple-system, sans-serif";

        days.forEach((day, i) => {
            // Match the day center calculation from bar positioning
            const dayCenter = padding.left + 20 + i * dayWidth + dayWidth / 2;
            const dateObj = new Date(day);
            const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            });
            ctx.fillText(
                formattedDate,
                dayCenter,
                chartHeight - padding.bottom + 15
            );
        });

        // Enhanced title with better typography
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#1e293b";
        ctx.font = "700 16px system-ui, -apple-system, sans-serif";
        ctx.fillText("Daily Electricity Consumption", chartWidth / 2, 15);

        // Enhanced legend with better spacing and styling
        const legendY = chartHeight - 25;
        const legendSpacing = 100;
        const legendStartX = (chartWidth - legendSpacing * 2) / 2;

        const periods = [
            { name: "Morning", period: "morning" as const },
            { name: "Evening", period: "evening" as const },
            { name: "Night", period: "night" as const },
        ];

        periods.forEach((item, index) => {
            const x = legendStartX + legendSpacing * index;
            const colors = getEnhancedColorsForPeriod(item.period);

            // Create mini gradient for legend
            const legendGradient = ctx.createLinearGradient(
                0,
                legendY,
                0,
                legendY + 12
            );
            legendGradient.addColorStop(0, colors.top);
            legendGradient.addColorStop(1, colors.bottom);

            ctx.fillStyle = legendGradient;
            ctx.fillRect(x, legendY, 18, 12);

            // Legend text
            ctx.textAlign = "left";
            ctx.fillStyle = "#374151";
            ctx.font = "500 12px system-ui, -apple-system, sans-serif";
            ctx.fillText(item.name, x + 25, legendY + 6);
        });
    }, [filteredData, chartWidth, chartHeight]);

    // Enhanced color function with gradients
    const getEnhancedColorsForPeriod = (
        period: "morning" | "evening" | "night"
    ) => {
        switch (period) {
            case "morning":
                return {
                    top: "#34d399", // emerald-400
                    bottom: "#059669", // emerald-600
                    solid: "#10b981", // emerald-500
                };
            case "evening":
                return {
                    top: "#fbbf24", // amber-400
                    bottom: "#d97706", // amber-600
                    solid: "#f59e0b", // amber-500
                };
            case "night":
                return {
                    top: "#818cf8", // indigo-400
                    bottom: "#4338ca", // indigo-600
                    solid: "#6366f1", // indigo-500
                };
            default:
                return {
                    top: "#34d399",
                    bottom: "#059669",
                    solid: "#10b981",
                };
        }
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

    return (
        <div className="space-y-6">
            <Tabs defaultValue="enhanced" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                        value="enhanced"
                        className="flex items-center gap-2"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Enhanced Charts
                    </TabsTrigger>
                    <TabsTrigger
                        value="overview"
                        className="flex items-center gap-2"
                    >
                        <Activity className="h-4 w-4" />
                        Quick Overview
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="enhanced" className="space-y-6">
                    <EnhancedUsageCharts readings={readings} />
                </TabsContent>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                    Quick Stats
                                </CardTitle>
                                <CardDescription>
                                    At-a-glance consumption metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                        <span className="text-sm font-medium">
                                            Total Readings
                                        </span>
                                        <span className="text-lg font-bold text-blue-600">
                                            {readings.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                        <span className="text-sm font-medium">
                                            Days Tracked
                                        </span>
                                        <span className="text-lg font-bold text-green-600">
                                            {
                                                new Set(
                                                    readings.map(
                                                        (r) =>
                                                            r.timestamp
                                                                .toISOString()
                                                                .split("T")[0]
                                                    )
                                                ).size
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                        <span className="text-sm font-medium">
                                            Latest Reading
                                        </span>
                                        <span className="text-lg font-bold text-purple-600">
                                            {readings.length > 0
                                                ? `${
                                                      readings[
                                                          readings.length - 1
                                                      ].reading
                                                  } kWh`
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="h-5 w-5 text-orange-600" />
                                    Period Distribution
                                </CardTitle>
                                <CardDescription>
                                    Readings by time period
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {["morning", "evening", "night"].map(
                                        (period) => {
                                            const count = readings.filter(
                                                (r) => r.period === period
                                            ).length;
                                            const percentage =
                                                readings.length > 0
                                                    ? (
                                                          (count /
                                                              readings.length) *
                                                          100
                                                      ).toFixed(1)
                                                    : "0";
                                            const colors = {
                                                morning: "bg-emerald-500",
                                                evening: "bg-amber-500",
                                                night: "bg-indigo-500",
                                            };

                                            return (
                                                <div
                                                    key={period}
                                                    className="space-y-2"
                                                >
                                                    <div className="flex justify-between text-sm">
                                                        <span className="capitalize font-medium">
                                                            {period}
                                                        </span>
                                                        <span>
                                                            {count} readings (
                                                            {percentage}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                colors[
                                                                    period as keyof typeof colors
                                                                ]
                                                            } transition-all duration-500`}
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
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
