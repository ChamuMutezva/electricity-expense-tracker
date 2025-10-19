/**
 * Displays a summary of electricity usage and token purchase history.
 *
 * Fetches and presents aggregated usage statistics such as average daily usage,
 * peak usage day, total tokens purchased, and a breakdown of daily usage.
 * Also displays a history of token purchases if available.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {ElectricityReading[]} props.readings - Array of electricity meter readings.
 * @param {TokenPurchase[]} props.tokens - Array of token purchase records.
 * @returns {JSX.Element} The rendered usage summary UI.
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "react-responsive";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type {
    ElectricityReading,
    TokenPurchase,
    UsageSummary as UsageSummaryType,
} from "@/lib/types";
import { getUsageSummary } from "@/actions/electricity-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/date-utils";
import { Calendar, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MobileSummaryTable from "./MobileSummaryTable";
import TokenMobileSummaryTable from "./TokenMobileSummaryTable";

interface UsageSummaryProps {
    readings: ElectricityReading[];
    tokens: TokenPurchase[];
}

type MonthOption = {
    value: string;
    label: string;
};

export default function UsageSummary({
    readings,
    tokens,
}: Readonly<UsageSummaryProps>) {
    const [summary, setSummary] = useState<UsageSummaryType | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
    const isMobile = useMediaQuery({ maxWidth: 768 });

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true);
                const data = await getUsageSummary();
                setSummary(data);
                //  console.log("Fetched usage summary:", data);
                // Extract unique months from daily usage
                const monthsSet = new Set<string>();
                for (const day of data.dailyUsage) {
                    const month = day.date.substring(0, 7); // YYYY-MM format
                    monthsSet.add(month);
                }

                const months: MonthOption[] = Array.from(monthsSet)
                    .sort((a, b) => a.localeCompare(b))
                    .reverse()
                    .map((month) => ({
                        value: month,
                        label: formatMonthLabel(month),
                    }));

                setAvailableMonths(months);

                // Default to current month if available
                const currentMonth = new Date().toISOString().substring(0, 7);
                if (monthsSet.has(currentMonth)) {
                    setSelectedMonth(currentMonth);
                } else if (months.length > 0) {
                    setSelectedMonth(months[0].value);
                }
            } catch (error) {
                console.error("Error fetching usage summary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [readings, tokens]);

    // Filter daily usage based on selected month
    const getFilteredDailyUsage = () => {
        if (!summary) return [];
        if (selectedMonth === "all") return summary.dailyUsage;
        return summary.dailyUsage.filter((day) =>
            day.date.startsWith(selectedMonth)
        );
    };

    const filteredDailyUsage = getFilteredDailyUsage();

    // Calculate statistics for selected period
    const calculatePeriodStats = () => {
        if (filteredDailyUsage.length === 0) {
            return {
                averageUsage: 0,
                peakUsageDay: { date: "", usage: 0 },
                totalUsage: 0,
                daysWithData: 0,
            };
        }

        // Sum up the daily totals (already calculated in the data)
        const totalUsage = filteredDailyUsage.reduce(
            (sum, day) => sum + (day.total || 0),
            0
        );
        const daysWithData = filteredDailyUsage.filter(
            (day) => day.total > 0
        ).length;
        const averageUsage = daysWithData > 0 ? totalUsage / daysWithData : 0;

        // Find peak usage day
        let peakUsageDay = filteredDailyUsage[0];
        for (const day of filteredDailyUsage) {
            if ((day.total || 0) > (peakUsageDay.total || 0)) {
                peakUsageDay = day;
            }
        }

        return {
            averageUsage,
            peakUsageDay: {
                date: peakUsageDay?.date || "",
                usage: peakUsageDay?.total || 0,
            },
            totalUsage,
            daysWithData,
        };
    };

    const periodStats = calculatePeriodStats();

    // Calculate trend compared to previous period
    const calculateTrend = () => {
        if (selectedMonth === "all" || !summary) return null;

        const [year, month] = selectedMonth.split("-").map(Number);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(
            2,
            "0"
        )}`;

        const prevMonthUsage = summary.dailyUsage.filter((day) =>
            day.date.startsWith(prevMonthStr)
        );

        if (prevMonthUsage.length === 0) return null;

        const prevTotal = prevMonthUsage.reduce(
            (sum, day) => sum + (day.total || 0),
            0
        );
        const currentTotal = periodStats.totalUsage;

        const percentChange =
            prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

        return {
            percentChange,
            isIncrease: percentChange > 0,
            isDecrease: percentChange < 0,
        };
    };

    const trend = calculateTrend();

    // Calculate total tokens for selected period
    const getFilteredTokens = () => {
        if (selectedMonth === "all") return tokens;
        return tokens.filter((token) => {
            const tokenDate = token.timestamp.toISOString().substring(0, 7);
            return tokenDate === selectedMonth;
        });
    };

    const filteredTokens = getFilteredTokens();
    const totalTokensInPeriod = filteredTokens.reduce(
        (sum, t) => sum + t.units,
        0
    );

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!summary || readings.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No readings recorded yet. Start by adding your first reading.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Month Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Usage Period</h3>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        {availableMonths.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                                {month.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Average Daily Usage
                        </div>
                        <div className="text-2xl font-bold">
                            {periodStats.averageUsage.toFixed(2)} kWh
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {periodStats.daysWithData} days with data
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Total Consumption
                        </div>
                        <div className="text-2xl font-bold">
                            {periodStats.totalUsage.toFixed(2)} kWh
                        </div>
                        {trend && (
                            <div className="flex items-center gap-1 mt-1">
                                {trend.isIncrease && (
                                    <TrendingUp className="h-3 w-3 text-red-500" />
                                )}
                                {trend.isDecrease && (
                                    <TrendingDown className="h-3 w-3 text-green-500" />
                                )}
                                {!trend.isIncrease && !trend.isDecrease && (
                                    <Minus className="h-3 w-3 text-gray-500" />
                                )}
                                <span
                                    className={`text-xs ${
                                        trend.isIncrease
                                            ? "text-red-500"
                                            : trend.isDecrease
                                            ? "text-green-500"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {Math.abs(trend.percentChange).toFixed(1)}%
                                    vs prev month
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Peak Usage Day
                        </div>
                        <div className="text-2xl font-bold">
                            {periodStats.peakUsageDay.usage.toFixed(2)} kWh
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {formatDateLabel(periodStats.peakUsageDay.date)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Tokens Purchased
                        </div>
                        <div className="text-2xl font-bold">
                            {totalTokensInPeriod.toFixed(2)} kWh
                        </div>
                        <Badge variant="secondary" className="mt-1">
                            {filteredTokens.length} purchases
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Usage Table */}
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                            Daily Usage Breakdown
                        </h4>
                        <span className="text-xs text-muted-foreground">
                            {filteredDailyUsage.length} days
                        </span>
                    </div>
                </div>
                {isMobile ? (
                    <MobileSummaryTable data={filteredDailyUsage} />
                ) : (
                    <div className="relative overflow-auto max-h-[500px]">
                        <table className="w-full">
                            {/* Header */}
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-muted text-sm font-medium border-b">
                                    <th className="p-3 text-left min-w-[100px]">
                                        Date
                                    </th>
                                    <th className="p-3 text-left min-w-[80px]">
                                        Morning
                                    </th>
                                    <th className="p-3 text-left min-w-[80px]">
                                        Evening
                                    </th>
                                    <th className="p-3 text-left min-w-[80px]">
                                        Night
                                    </th>
                                    <th className="p-3 text-left min-w-[100px]">
                                        Total Usage
                                    </th>
                                </tr>
                            </thead>

                            {/* Body */}
                            <tbody>
                                {filteredDailyUsage.length > 0 ? (
                                    filteredDailyUsage.map((day) => (
                                        <tr
                                            key={day.date}
                                            className="border-t text-sm hover:bg-muted/50 transition-colors"
                                        >
                                            <td className="p-3 font-medium">
                                                {formatDate(new Date(day.date))}
                                            </td>
                                            <td className="p-3">
                                                {day.morning !== undefined ? (
                                                    <span className="text-blue-600 font-medium">
                                                        {day.morning} kWh
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {day.evening !== undefined ? (
                                                    <span className="text-orange-600 font-medium">
                                                        {day.evening} kWh
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {day.night !== undefined ? (
                                                    <span className="text-purple-600 font-medium">
                                                        {day.night} kWh
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1">
                                                    <Zap className="h-4 w-4 text-yellow-500" />
                                                    <span className="font-bold">
                                                        {day.total?.toFixed(
                                                            2
                                                        ) || "0.00"}{" "}
                                                        kWh
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            No data available for selected
                                            period
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Token Purchase History */}
            {filteredTokens.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-green-500" />
                        Token Purchases{" "}
                        {selectedMonth !== "all" &&
                            `(${formatMonthLabel(selectedMonth)})`}
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="relative overflow-auto max-h-[300px]">
                            {isMobile ? (
                                <TokenMobileSummaryTable
                                    filteredTokens={filteredTokens}
                                />
                            ) : (
                                <table className="w-full">
                                    {/* Header */}
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-muted text-sm font-medium">
                                            <th className="p-3 text-left min-w-[100px]">
                                                Date
                                            </th>
                                            <th className="p-3 text-left min-w-[100px]">
                                                Units Added
                                            </th>
                                            <th className="p-3 text-left min-w-[100px]">
                                                New Reading
                                            </th>
                                            <th className="p-3 text-left min-w-[80px]">
                                                Total Cost
                                            </th>
                                        </tr>
                                    </thead>

                                    {/* Body */}
                                    <tbody>
                                        {filteredTokens.map((token) => (
                                            <tr
                                                key={token.token_id}
                                                className="border-t text-sm hover:bg-muted/50 transition-colors"
                                            >
                                                <td className="p-3">
                                                    {formatDate(
                                                        token.timestamp
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-green-600 font-semibold">
                                                        +{token.units} kWh
                                                    </span>
                                                </td>
                                                <td className="p-3 font-medium">
                                                    {token.new_reading} kWh
                                                </td>
                                                <td className="p-3">
                                                    {token.total_cost
                                                        ? `R ${token.total_cost.toFixed(
                                                              2
                                                          )}`
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Insights */}
            {filteredDailyUsage.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                        <span>📊</span> Usage Insights
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>
                            {selectedMonth === "all"
                                ? "Overall"
                                : formatMonthLabel(selectedMonth)}{" "}
                            average daily consumption:{" "}
                            <strong>
                                {periodStats.averageUsage.toFixed(2)} kWh
                            </strong>
                        </li>
                        <li>
                            Peak usage was on{" "}
                            <strong>
                                {formatDateLabel(periodStats.peakUsageDay.date)}
                            </strong>{" "}
                            with{" "}
                            <strong>
                                {periodStats.peakUsageDay.usage.toFixed(2)} kWh
                            </strong>
                        </li>
                        {trend && (
                            <li>
                                Usage{" "}
                                <strong
                                    className={
                                        trend.isIncrease
                                            ? "text-red-600"
                                            : trend.isDecrease
                                            ? "text-green-600"
                                            : ""
                                    }
                                >
                                    {trend.isIncrease
                                        ? "increased"
                                        : trend.isDecrease
                                        ? "decreased"
                                        : "remained stable"}
                                </strong>{" "}
                                by{" "}
                                <strong>
                                    {Math.abs(trend.percentChange).toFixed(1)}%
                                </strong>{" "}
                                compared to previous month
                            </li>
                        )}
                        <li>
                            Total consumption for this period:{" "}
                            <strong>
                                {periodStats.totalUsage.toFixed(2)} kWh
                            </strong>{" "}
                            over{" "}
                            <strong>{periodStats.daysWithData} days</strong>
                        </li>
                        {filteredTokens.length > 0 && (
                            <li>
                                You purchased{" "}
                                <strong>
                                    {totalTokensInPeriod.toFixed(2)} kWh
                                </strong>{" "}
                                in tokens (
                                <strong>
                                    {filteredTokens.length} purchases
                                </strong>
                                )
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

function formatMonthLabel(monthStr: string): string {
    try {
        const [year, month] = monthStr.split("-");
        const date = new Date(
            Number.parseInt(year),
            Number.parseInt(month) - 1,
            1
        );
        return date.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return monthStr;
    }
}

function formatDateLabel(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return dateStr;
    }
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-[200px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-8 w-24 mb-1" />
                            <Skeleton className="h-4 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3">
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="p-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-4 mb-3">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
