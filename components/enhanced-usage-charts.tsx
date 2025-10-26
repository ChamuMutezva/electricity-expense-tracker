/**
 * EnhancedUsageCharts component displays interactive electricity consumption charts and statistics.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {ElectricityReading[]} props.readings - Array of electricity readings to visualize.
 *
 * @description
 * This component provides a dashboard for visualizing electricity usage trends over time.
 * It supports multiple chart types (area, line, bar, radial, composed) and allows users to filter data
 * by weekly, monthly, or all-time periods. Users can navigate between weeks or months and view
 * detailed statistics for morning, evening, and night consumption.
 *
 * Features:
 * - Interactive chart type and period selection.
 * - Navigation controls for weekly/monthly views.
 * - Multiple chart visualizations using Recharts.
 * - Consumption breakdown by period with statistics cards and pie chart.
 * - Responsive and accessible UI.
 *
 * @example
 * ```tsx
 * <EnhancedUsageCharts readings={myReadingsArray} />
 * ```
 */
"use client";

import { useMemo, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    RadialBarChart,
    RadialBar,
    ComposedChart,
} from "recharts";
import {
    Calendar,
    TrendingUp,
    Zap,
    Clock,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import type { ElectricityReading } from "@/lib/types";

interface EnhancedUsageChartsProps {
    readings: ElectricityReading[];
}

interface ProcessedData {
    date: string;
    morning: number;
    evening: number;
    night: number;
    total: number;
    formattedDate: string;
    dayOfWeek: string;
}

type TimePeriod = "weekly" | "monthly" | "all";
type ChartType = "area" | "line" | "bar" | "radial" | "composed";

const chartConfig = {
    morning: {
        label: "Morning",
        color: "hsl(var(--chart-1))",
    },
    evening: {
        label: "Evening",
        color: "hsl(var(--chart-2))",
    },
    night: {
        label: "Night",
        color: "hsl(var(--chart-3))",
    },
    total: {
        label: "Total",
        color: "hsl(var(--chart-4))",
    },
};

const PERIOD_COLORS = {
    morning: "#10b981", // emerald-500
    evening: "#f59e0b", // amber-500
    night: "#6366f1", // indigo-500
};

export default function EnhancedUsageCharts({
    readings,
}: Readonly<EnhancedUsageChartsProps>) {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");
    const [chartType, setChartType] = useState<ChartType>("area");
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 6);
        startOfWeek.setHours(0, 0, 0, 0); // Optional: set to start of day
        return startOfWeek;
    });

    // Process readings into chart data
    const processedData = useMemo(() => {
        if (readings.length < 2) return [];

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

        const data: ProcessedData[] = [];
        const dates = Object.keys(readingsByDay).sort();

        dates.forEach((date, index) => {
            const dayReadings = readingsByDay[date].toSorted(
                (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
            );

            let morningConsumption = 0;
            let eveningConsumption = 0;
            let nightConsumption = 0;

            // Calculate consumption between consecutive readings within the day
            for (let i = 1; i < dayReadings.length; i++) {
                const prevReading = dayReadings[i - 1];
                const currentReading = dayReadings[i];
                const consumption = Math.max(
                    0,
                    prevReading.reading - currentReading.reading
                );

                if (currentReading.period === "morning")
                    morningConsumption += consumption;
                else if (currentReading.period === "evening")
                    eveningConsumption += consumption;
                else if (currentReading.period === "night")
                    nightConsumption += consumption;
            }

            // Calculate consumption from previous day's last reading to current day's first reading
            if (index > 0) {
                const prevDayReadings = readingsByDay[dates[index - 1]];
                if (prevDayReadings.length > 0 && dayReadings.length > 0) {
                    const lastPrevReading =
                        prevDayReadings[prevDayReadings.length - 1];
                    const firstCurrentReading = dayReadings[0];
                    const overnightConsumption = Math.max(
                        0,
                        lastPrevReading.reading - firstCurrentReading.reading
                    );

                    if (firstCurrentReading.period === "morning")
                        morningConsumption += overnightConsumption;
                }
            }

            const dateObj = new Date(date);
            const total =
                morningConsumption + eveningConsumption + nightConsumption;

            data.push({
                date,
                morning: Number(morningConsumption.toFixed(2)),
                evening: Number(eveningConsumption.toFixed(2)),
                night: Number(nightConsumption.toFixed(2)),
                total: Number(total.toFixed(2)),
                formattedDate: dateObj.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                }),
                dayOfWeek: dateObj.toLocaleDateString(undefined, {
                    weekday: "short",
                }),
            });
        });

        return data;
    }, [readings]);

    // Filter data based on time period
    const filteredData = useMemo(() => {
        if (timePeriod === "all") return processedData;

        // Helper function to normalize dates (remove time component)
        const normalizeDate = (date: Date) => {
            const normalized = new Date(date);
            normalized.setHours(0, 0, 0, 0);
            return normalized;
        };

        if (timePeriod === "weekly") {
            const weekStart = normalizeDate(currentWeekStart);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            return processedData.filter((item) => {
                const itemDate = normalizeDate(new Date(item.date));
                return itemDate >= weekStart && itemDate <= weekEnd;
            });
        }

        if (timePeriod === "monthly") {
            const monthStart = new Date(currentWeekStart);
            monthStart.setDate(1);
            const normalizedMonthStart = normalizeDate(monthStart);

            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0); // Last day of current month
            const normalizedMonthEnd = normalizeDate(monthEnd);

            return processedData.filter((item) => {
                const itemDate = normalizeDate(new Date(item.date));
                return (
                    itemDate >= normalizedMonthStart &&
                    itemDate <= normalizedMonthEnd
                );
            });
        }

        return processedData;
    }, [processedData, timePeriod, currentWeekStart]);

    // Calculate period statistics
    const periodStats = useMemo(() => {
        const totals = filteredData.reduce(
            (acc, day) => ({
                morning: acc.morning + day.morning,
                evening: acc.evening + day.evening,
                night: acc.night + day.night,
            }),
            { morning: 0, evening: 0, night: 0 }
        );

        const grandTotal = totals.morning + totals.evening + totals.night;

        return [
            {
                period: "Morning",
                consumption: Number(totals.morning.toFixed(2)),
                percentage:
                    grandTotal > 0
                        ? Number(
                              ((totals.morning / grandTotal) * 100).toFixed(1)
                          )
                        : 0,
                color: PERIOD_COLORS.morning,
            },
            {
                period: "Evening",
                consumption: Number(totals.evening.toFixed(2)),
                percentage:
                    grandTotal > 0
                        ? Number(
                              ((totals.evening / grandTotal) * 100).toFixed(1)
                          )
                        : 0,
                color: PERIOD_COLORS.evening,
            },
            {
                period: "Night",
                consumption: Number(totals.night.toFixed(2)),
                percentage:
                    grandTotal > 0
                        ? Number(((totals.night / grandTotal) * 100).toFixed(1))
                        : 0,
                color: PERIOD_COLORS.night,
            },
        ];
    }, [filteredData]);

    // Navigation functions
    const goToPrevious = () => {
        const newDate = new Date(currentWeekStart);
        if (timePeriod === "weekly") {
            newDate.setDate(newDate.getDate() - 7);
        } else if (timePeriod === "monthly") {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentWeekStart(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(currentWeekStart);
        const today = new Date();

        if (timePeriod === "weekly") {
            newDate.setDate(newDate.getDate() + 7);
            if (newDate > today) return;
        } else if (timePeriod === "monthly") {
            newDate.setMonth(newDate.getMonth() + 1);
            if (
                newDate.getMonth() > today.getMonth() &&
                newDate.getFullYear() >= today.getFullYear()
            )
                return;
        }

        setCurrentWeekStart(newDate);
    };

    const formatCurrentPeriod = (): string => {
        if (timePeriod === "weekly") {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${currentWeekStart.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            })} - ${weekEnd.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
            })}`;
        } else if (timePeriod === "monthly") {
            return currentWeekStart.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
            });
        }
        return "All Data";
    };

    if (readings.length < 2) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Not enough data to display charts.</p>
                <p className="text-sm">
                    Add at least two readings to see your consumption patterns.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                            View Options
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={timePeriod}
                            onValueChange={(value) =>
                                setTimePeriod(value as TimePeriod)
                            }
                        >
                            <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">
                                    📅 Weekly
                                </SelectItem>
                                <SelectItem value="monthly">
                                    📊 Monthly
                                </SelectItem>
                                <SelectItem value="all">🔍 All Data</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={chartType}
                            onValueChange={(value) =>
                                setChartType(value as ChartType)
                            }
                        >
                            <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="area">
                                    📈 Area Chart
                                </SelectItem>
                                <SelectItem value="line">
                                    📉 Line Chart
                                </SelectItem>
                                <SelectItem value="bar">
                                    📊 Bar Chart
                                </SelectItem>
                                <SelectItem value="radial">
                                    🎯 Radial Chart
                                </SelectItem>
                                <SelectItem value="composed">
                                    🔄 Combined
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {timePeriod !== "all" && (
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={goToPrevious}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[200px] text-center px-3 py-1">
                            <span className="text-sm font-medium">
                                {formatCurrentPeriod()}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={goToNext}
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Chart */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Electricity Consumption Trends
                    </CardTitle>
                    <CardDescription>
                        Daily consumption patterns across different periods
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={chartConfig}
                        className="h-[400px] w-full"
                    >
                        {chartType === "area" && (
                            <AreaChart data={filteredData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="opacity-30"
                                />
                                <XAxis
                                    dataKey="formattedDate"
                                    tick={{ fontSize: 12 }}
                                    tickLine={{ stroke: "#e2e8f0" }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={{ stroke: "#e2e8f0" }}
                                    label={{
                                        value: "kWh",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="morning"
                                    stackId="1"
                                    stroke={PERIOD_COLORS.morning}
                                    fill={PERIOD_COLORS.morning}
                                    fillOpacity={0.6}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="evening"
                                    stackId="1"
                                    stroke={PERIOD_COLORS.evening}
                                    fill={PERIOD_COLORS.evening}
                                    fillOpacity={0.6}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="night"
                                    stackId="1"
                                    stroke={PERIOD_COLORS.night}
                                    fill={PERIOD_COLORS.night}
                                    fillOpacity={0.6}
                                />
                            </AreaChart>
                        )}

                        {chartType === "line" && (
                            <LineChart data={filteredData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="opacity-30"
                                />
                                <XAxis
                                    dataKey="formattedDate"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={{
                                        value: "kWh",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Line
                                    type="monotone"
                                    dataKey="morning"
                                    stroke={PERIOD_COLORS.morning}
                                    strokeWidth={3}
                                    dot={{
                                        fill: PERIOD_COLORS.morning,
                                        strokeWidth: 2,
                                        r: 4,
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="evening"
                                    stroke={PERIOD_COLORS.evening}
                                    strokeWidth={3}
                                    dot={{
                                        fill: PERIOD_COLORS.evening,
                                        strokeWidth: 2,
                                        r: 4,
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="night"
                                    stroke={PERIOD_COLORS.night}
                                    strokeWidth={3}
                                    dot={{
                                        fill: PERIOD_COLORS.night,
                                        strokeWidth: 2,
                                        r: 4,
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#64748b"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{
                                        fill: "#64748b",
                                        strokeWidth: 2,
                                        r: 3,
                                    }}
                                />
                            </LineChart>
                        )}

                        {chartType === "bar" && (
                            <BarChart data={filteredData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="opacity-30"
                                />
                                <XAxis
                                    dataKey="formattedDate"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={{
                                        value: "kWh",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar
                                    dataKey="morning"
                                    fill={PERIOD_COLORS.morning}
                                    radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                    dataKey="evening"
                                    fill={PERIOD_COLORS.evening}
                                    radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                    dataKey="night"
                                    fill={PERIOD_COLORS.night}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        )}

                        {chartType === "composed" && (
                            <ComposedChart data={filteredData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="opacity-30"
                                />
                                <XAxis
                                    dataKey="formattedDate"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={{
                                        value: "kWh",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar
                                    dataKey="morning"
                                    fill={PERIOD_COLORS.morning}
                                    radius={[2, 2, 0, 0]}
                                />
                                <Bar
                                    dataKey="evening"
                                    fill={PERIOD_COLORS.evening}
                                    radius={[2, 2, 0, 0]}
                                />
                                <Bar
                                    dataKey="night"
                                    fill={PERIOD_COLORS.night}
                                    radius={[2, 2, 0, 0]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{
                                        fill: "#ef4444",
                                        strokeWidth: 2,
                                        r: 4,
                                    }}
                                />
                            </ComposedChart>
                        )}

                        {chartType === "radial" && (
                            <RadialBarChart
                                data={periodStats}
                                innerRadius="30%"
                                outerRadius="90%"
                            >
                                <RadialBar
                                    dataKey="consumption"
                                    cornerRadius={10}
                                    fill={(entry) => entry.color}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                            </RadialBarChart>
                        )}
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {periodStats.map((stat) => (
                    <Card
                        key={stat.period}
                        className="relative overflow-hidden"
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{
                                            backgroundColor: `${stat.color}20`,
                                        }}
                                    >
                                        <Clock
                                            className="h-5 w-5"
                                            style={{ color: stat.color }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {stat.period}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {stat.percentage}% of total
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div
                                    className="text-3xl font-bold"
                                    style={{ color: stat.color }}
                                >
                                    {stat.consumption} kWh
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${stat.percentage}%`,
                                            backgroundColor: stat.color,
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Period Breakdown Pie Chart */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        Consumption by Period
                    </CardTitle>
                    <CardDescription>
                        Distribution of electricity usage across different time
                        periods
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={chartConfig}
                        className="h-[300px] w-full"
                    >
                        <PieChart>
                            <Pie
                                data={periodStats}
                                dataKey="consumption"
                                nameKey="period"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ period, percentage }) =>
                                    `${period}: ${percentage}%`
                                }
                            >
                                {periodStats.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
