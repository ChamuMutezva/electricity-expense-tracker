/**
 * MonthlyReport component displays a summary and detailed breakdown of monthly electricity usage.
 *
 * Features:
 * - Fetches and displays monthly usage data.
 * - Shows total, average, highest, and lowest usage statistics.
 * - Provides a CSV export option for the monthly report.
 * - Visualizes usage comparison for each month.
 * - Offers insights and usage trends based on the data.
 * - Displays loading skeletons while data is being fetched.
 *
 * @component
 * @returns {JSX.Element} The rendered MonthlyReport component.
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getMonthlyUsage } from "@/actions/electricity-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PDFReportGenerator from "./pdf-report-generator";
import SocialSharing from "./social-sharing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ElectricityReading, TokenPurchase } from "@/lib/types";

interface MonthlyData {
    month: string;
    usage: number;
}

interface MonthlyReportProps {
    readings?: ElectricityReading[];
    tokens?: TokenPurchase[];
}

export default function MonthlyReport({
    readings = [],
    tokens = [],
}: Readonly<MonthlyReportProps>) {
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);
 
    useEffect(() => {
        const fetchMonthlyData = async () => {
            try {
                setLoading(true);
                const data = await getMonthlyUsage();                
                setMonthlyData(data);
            } catch (error) {
                console.error("Error fetching monthly data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyData();
    }, []);

    const handleExportCSV = () => {
        if (monthlyData.length === 0) return;

        // Create CSV content
        const headers = ["Month", "Usage (kWh)"];
        const csvContent = [
            headers.join(","),
            ...monthlyData.map((item) => `${item.month},${item.usage}`),
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "electricity_monthly_report.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate statistics for sharing
    const totalUsage = monthlyData.reduce((sum, item) => sum + item.usage, 0);
    const averageMonthlyUsage = totalUsage / Math.max(monthlyData.length, 1);
    const averageDailyUsage = averageMonthlyUsage / 30; // Approximate

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (monthlyData.length === 0 && (!readings || readings.length === 0)) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Alert className="border-orange-200 bg-orange-50 mb-4">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700">
                        No monthly data available yet. Add more readings across
                        different months.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Calculate statistics
    const highestMonth =
        monthlyData.length > 0
            ? monthlyData.reduce(
                  (max, item) => (item.usage > max.usage ? item : max),
                  monthlyData[0]
              )
            : null;
    const lowestMonth =
        monthlyData.length > 0
            ? monthlyData.reduce(
                  (min, item) => (item.usage < min.usage ? item : min),
                  monthlyData[0]
              )
            : null;

    return (
        <div className="space-y-6">
            {/* Debug Information */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <div className="text-xs space-y-1">
                        <div>
                            Props - Readings: {readings?.length || 0}, Tokens:{" "}
                            {tokens?.length || 0}
                        </div>
                        <div>Monthly Data: {monthlyData.length} months</div>
                        {monthlyData.length > 0 && (
                            <div>
                                Available:{" "}
                                {monthlyData.map((m) => m.month).join(", ")}
                            </div>
                        )}
                    </div>
                </AlertDescription>
            </Alert>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">📊 Overview</TabsTrigger>
                    <TabsTrigger value="export">📄 Export</TabsTrigger>
                    <TabsTrigger value="share">🌟 Share</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {monthlyData.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">
                                    Monthly Electricity Usage
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-1 bg-transparent"
                                >
                                    <Download className="h-4 w-4" />
                                    Export CSV
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Total Usage
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {totalUsage.toFixed(2)} kWh
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Average Monthly
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {averageMonthlyUsage.toFixed(2)} kWh
                                        </div>
                                    </CardContent>
                                </Card>
                                {highestMonth && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Highest Month
                                            </div>
                                            <div className="text-2xl font-bold">
                                                {highestMonth.usage.toFixed(2)}{" "}
                                                kWh
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatMonthName(
                                                    highestMonth.month
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {lowestMonth && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Lowest Month
                                            </div>
                                            <div className="text-2xl font-bold">
                                                {lowestMonth.usage.toFixed(2)}{" "}
                                                kWh
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatMonthName(
                                                    lowestMonth.month
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="grid grid-cols-3 bg-muted p-3 text-sm font-medium">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Month</span>
                                    </div>
                                    <div>Usage (kWh)</div>
                                    <div>Comparison</div>
                                </div>
                                <div className="divide-y">
                                    {monthlyData.map((item) => (
                                        <div
                                            key={item.month}
                                            className="grid grid-cols-3 p-3 text-sm"
                                        >
                                            <div>
                                                {formatMonthName(item.month)}
                                            </div>
                                            <div>
                                                {item.usage.toFixed(2)} kWh
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-green-600 h-2.5 rounded-full"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                highestMonth
                                                                    ? (item.usage /
                                                                          highestMonth.usage) *
                                                                          100
                                                                    : 0
                                                            )}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {highestMonth && lowestMonth && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                    <h4 className="font-medium mb-2">
                                        Insights
                                    </h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>
                                            Your highest usage was in{" "}
                                            {formatMonthName(
                                                highestMonth.month
                                            )}{" "}
                                            with {highestMonth.usage.toFixed(2)}{" "}
                                            kWh
                                        </li>
                                        <li>
                                            Your lowest usage was in{" "}
                                            {formatMonthName(lowestMonth.month)}{" "}
                                            with {lowestMonth.usage.toFixed(2)}{" "}
                                            kWh
                                        </li>
                                        <li>
                                            Your average monthly consumption is{" "}
                                            {averageMonthlyUsage.toFixed(2)} kWh
                                        </li>
                                        {monthlyData.length > 1 && (
                                            <li>
                                                {getUsageTrend(monthlyData)}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No monthly summary data available, but you can still
                            generate PDF reports from your raw readings.
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="export" className="space-y-6">
                    <PDFReportGenerator readings={readings} tokens={tokens} />
                </TabsContent>

                <TabsContent value="share" className="space-y-6">
                    <SocialSharing
                        readings={readings}
                        totalUsage={totalUsage}
                        averageUsage={averageDailyUsage}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function formatMonthName(monthStr: string): string {
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
    } catch (error) {
        console.error("Error formatting month name:", monthStr, error);
        return monthStr;
    }
}

function getUsageTrend(data: MonthlyData[]): string {
    if (data.length < 2) return "";

    const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
    const firstMonth = sortedData[0];
    const lastMonth = sortedData[sortedData.length - 1];

    const percentChange =
        ((lastMonth.usage - firstMonth.usage) / firstMonth.usage) * 100;

    if (Math.abs(percentChange) < 5) {
        return "Your electricity usage has remained relatively stable.";
    } else if (percentChange > 0) {
        return `Your electricity usage has increased by ${percentChange.toFixed(
            1
        )}% since ${formatMonthName(firstMonth.month)}.`;
    } else {
        return `Your electricity usage has decreased by ${Math.abs(
            percentChange
        ).toFixed(1)}% since ${formatMonthName(firstMonth.month)}.`;
    }
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-9 w-28" />
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
                <div className="grid grid-cols-3 bg-muted p-3">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <div className="divide-y">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="grid grid-cols-3 p-3">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
