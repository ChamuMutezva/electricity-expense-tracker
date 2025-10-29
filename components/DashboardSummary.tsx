/**
 * Displays a summary dashboard with the latest electricity reading, total units used, and the next update time.
 *
 * @component
 * @param latestReading - The most recent electricity meter reading in kWh.
 * @param totalUnits - The total units of electricity used, as a number.
 * @param nextUpdate - (Optional) The Date object representing the next scheduled update.
 * @param getTimeString - A function that formats a Date object into a display string.
 * @param timeUntilUpdate - A string describing the time remaining until the next update.
 */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    TrendingUp,
    DollarSign,
    Zap,
    Battery,
    AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ElectricityReading } from "@/lib/types";

type DashboardSummaryProps = {
    latestReading: number;
    totalUnits: number;
    nextUpdate?: Date | null;
    getTimeString: (date: Date) => string;
    timeUntilUpdate: string;
    readings?: ElectricityReading[]; // Add this for predictions
};

export default function DashboardSummary({
    latestReading,
    totalUnits,
    nextUpdate,
    getTimeString,
    timeUntilUpdate,
    readings = [],
}: Readonly<DashboardSummaryProps>) {
    const [predictions, setPredictions] = useState({
        nextWeekUsage: 0,
        estimatedCost: 0,
        efficiency: "normal" as "low" | "normal" | "high",
    });

    useEffect(() => {
        if (readings.length < 7) return;

        // Calculate recent usage trend
        const averageCostPerKwh = 2.61;
        const recentReadings = readings.slice(-7);
        let totalUsage = 0;
        for (let i = 1; i < recentReadings.length; i++) {
            const usage =
                recentReadings[i - 1].reading - recentReadings[i].reading;
            if (usage > 0) totalUsage += usage;
        }

        function getEfficiency(avgDailyUsage: number) {
            if (avgDailyUsage < 5) return "high";
            if (avgDailyUsage > 10) return "low";
            return "normal";
        }

        const avgDailyUsage = totalUsage / 7;
        const nextWeekUsage = avgDailyUsage * 7;
        const estimatedCost = nextWeekUsage * averageCostPerKwh;
        const efficiency = getEfficiency(avgDailyUsage);

        setPredictions({
            nextWeekUsage: Number(nextWeekUsage.toFixed(2)),
            estimatedCost: Number(estimatedCost.toFixed(2)),
            efficiency,
        });
    }, [readings]);

    const getEfficiencyColor = (efficiency: string) => {
        switch (efficiency) {
            case "high":
                return "bg-green-100 text-green-800 border-green-200";
            case "low":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-blue-100 text-blue-800 border-blue-200";
        }
    };

    const getBalanceStatus = () => {
        if (latestReading < 20)
            return {
                status: "critical",
                color: "text-red-600",
                icon: <AlertTriangle className="h-4 w-4" />,
            };
        if (latestReading < 50)
            return {
                status: "low",
                color: "text-orange-600",
                icon: <Battery className="h-4 w-4" />,
            };
        return {
            status: "good",
            color: "text-green-600",
            icon: <Battery className="h-4 w-4" />,
        };
    };

    const balanceStatus = getBalanceStatus();

    return (
        <div className="space-y-4">
            {/* Current Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                                Latest Reading
                            </h3>
                            <p className="text-2xl font-bold flex items-center gap-2">
                                {latestReading} kWh
                                <span
                                    className={`text-sm ${balanceStatus.color}`}
                                >
                                    {balanceStatus.icon}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Total Units Used
                    </h3>
                    <p className="text-2xl font-bold">
                        {totalUnits.toFixed(2)} kWh
                    </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        Next Update
                    </h3>
                    <p className="text-2xl font-bold">
                        {nextUpdate ? getTimeString(nextUpdate) : "--:--"}
                    </p>
                    <p className="text-sm">In {timeUntilUpdate}</p>
                </div>
            </div>

            {/* Predictions Row */}
            {readings.length >= 7 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-border bg-secondary-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-secondary-foreground" />
                                <span className="text-sm font-medium text-secondary-foreground">
                                    Next Week Prediction
                                </span>
                            </div>
                            <div className="text-xl font-bold text-secondary-foreground">
                                {predictions.nextWeekUsage} kWh
                            </div>
                            <p className="text-xs text-secondary-foreground">
                                Based on recent usage
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-secondary">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4 text-text-foreground" />
                                <span className="text-sm font-medium text-secondary-foreground">
                                    Estimated Cost
                                </span>
                            </div>
                            <div className="text-xl font-bold text-secondary-foreground">
                                ${predictions.estimatedCost}
                            </div>
                            <p className="text-xs text-secondary-foreground">
                                Next week estimate
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-secondary">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-secondary" />
                                <span className="text-sm font-medium text-secondary-foreground">
                                    Efficiency
                                </span>
                            </div>
                            <Badge
                                className={getEfficiencyColor(
                                    predictions.efficiency
                                )}
                            >
                                {predictions.efficiency.toUpperCase()}
                            </Badge>
                            <p className="text-xs text-secondary-foreground mt-1">
                                Usage pattern
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
