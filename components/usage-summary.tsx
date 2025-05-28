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
import type {
    ElectricityReading,
    TokenPurchase,
    UsageSummary as UsageSummaryType,
} from "@/lib/types";
import { getUsageSummary } from "@/actions/electricity-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageSummaryProps {
    readings: ElectricityReading[];
    tokens: TokenPurchase[];
}

export default function UsageSummary({
    readings,
    tokens,
}: Readonly<UsageSummaryProps>) {
    const [summary, setSummary] = useState<UsageSummaryType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true);
                const data = await getUsageSummary();
                setSummary(data);
            } catch (error) {
                console.error("Error fetching usage summary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [readings, tokens]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Average Daily Usage
                        </div>
                        <div className="text-2xl font-bold">
                            {summary.averageUsage.toFixed(2)} kWh
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Peak Usage Day
                        </div>
                        <div className="text-2xl font-bold">
                            {summary.peakUsageDay.usage.toFixed(2)} kWh
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {summary.peakUsageDay.date || "N/A"}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground">
                            Total Tokens Purchased
                        </div>
                        <div className="text-2xl font-bold">
                            {summary.totalTokensPurchased.toFixed(2)} kWh
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <div className="relative overflow-auto max-h-[400px]">
                    <table className="w-full">
                        {/* Header */}
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-muted text-sm font-medium">
                                <th className="p-3 text-left min-w-[120px]">
                                    Date
                                </th>
                                <th className="p-3 text-left min-w-[120px]">
                                    Morning
                                </th>
                                <th className="p-3 text-left min-w-[120px]">
                                    Evening
                                </th>
                                <th className="p-3 text-left min-w-[120px]">
                                    Night
                                </th>
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody>
                            {summary.dailyUsage.length > 0 ? (
                                summary.dailyUsage.map((day) => (
                                    <tr
                                        key={day.date}
                                        className="border-t text-sm"
                                    >
                                        <td className="p-3">{day.date}</td>
                                        <td className="p-3">
                                            {day.morning ?? "-"}
                                            {day.morning !== undefined &&
                                                " kWh"}
                                        </td>
                                        <td className="p-3">
                                            {day.evening ?? "-"}
                                            {day.evening !== undefined &&
                                                " kWh"}
                                        </td>
                                        <td className="p-3">
                                            {day.night ?? "-"}
                                            {day.night !== undefined && " kWh"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-t">
                                    <td
                                        colSpan={4}
                                        className="p-3 text-center text-muted-foreground"
                                    >
                                        No daily data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {tokens.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">
                        Token Purchase History
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="relative overflow-auto max-h-[300px]">
                            <table className="w-full">
                                {/* Header */}
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-muted text-sm font-medium">
                                        <th className="p-3 text-left min-w-[120px]">
                                            Date
                                        </th>
                                        <th className="p-3 text-left min-w-[120px]">
                                            Units Added
                                        </th>
                                        <th className="p-3 text-left min-w-[120px]">
                                            New Reading
                                        </th>
                                        <th className="p-3 text-left min-w-[120px]">
                                            Total Cost
                                        </th>
                                    </tr>
                                </thead>

                                {/* Body */}
                                <tbody>
                                    {tokens.map((token) => (
                                        <tr
                                            key={token.token_id}
                                            className="border-t text-sm"
                                        >
                                            <td className="p-3">
                                                {token.timestamp.toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                                {token.units} kWh
                                            </td>
                                            <td className="p-3">
                                                {token.new_reading} kWh
                                            </td>
                                            <td className="p-3">
                                                {token.total_cost
                                                    ? `$${token.total_cost.toFixed(
                                                          2
                                                      )}`
                                                    : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-8 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 bg-muted p-3 text-sm font-medium">
                    <div>Date</div>
                    <div>Morning</div>
                    <div>Evening</div>
                    <div>Night</div>
                </div>
                <div className="divide-y">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="grid grid-cols-4 p-3">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
