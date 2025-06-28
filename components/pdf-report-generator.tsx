"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { ElectricityReading, TokenPurchase } from "@/lib/types";

interface PDFReportGeneratorProps {
    readings?: ElectricityReading[];
    tokens?: TokenPurchase[];
}

export default function PDFReportGenerator({
    readings,
    tokens,
}: Readonly<PDFReportGeneratorProps>) {
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [generating, setGenerating] = useState(false);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);

    // Debug: Log the received data
    useEffect(() => {
        console.log("PDFReportGenerator received:");
        console.log("Readings:", readings);
        console.log("Readings length:", readings?.length ?? 0);
        console.log("Tokens:", tokens);
        console.log("Tokens length:", tokens?.length ?? 0);

        if (readings && readings.length > 0) {
            console.log("Sample reading:", readings[0]);
            console.log("Reading timestamp:", readings[0]?.timestamp);
            console.log(
                "Reading timestamp type:",
                typeof readings[0]?.timestamp
            );
        }
    }, [readings, tokens]);

    // Compare function for sorting months alphabetically
    const compareMonths = (a: string, b: string) => a.localeCompare(b);

    // Get available months from readings, memoized with useCallback
    const getAvailableMonths = useCallback(() => {
        console.log("Getting available months from readings:", readings);

        if (!readings || readings.length === 0) {
            console.log("No readings available");
            return [];
        }

        const months = new Set<string>();

        readings.forEach((reading, index) => {
            console.log(`Processing reading ${index}:`, reading);

            try {
                // Handle different timestamp formats
                let date: Date;

                if (reading.timestamp instanceof Date) {
                    date = reading.timestamp;
                } else if (typeof reading.timestamp === "string") {
                    date = new Date(reading.timestamp);
                } else {
                    console.warn(
                        `Invalid timestamp format for reading ${index}:`,
                        reading.timestamp
                    );
                    return;
                }

                console.log(`Parsed date for reading ${index}:`, date);

                if (isNaN(date.getTime())) {
                    console.warn(`Invalid date for reading ${index}:`, date);
                    return;
                }

                const monthKey = `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`;
                console.log(`Month key for reading ${index}:`, monthKey);
                months.add(monthKey);
            } catch (error) {
                console.error(
                    `Error processing reading ${index}:`,
                    error,
                    reading
                );
            }
        });

        const monthsArray = Array.from(months).sort(compareMonths).reverse();
        console.log("Available months:", monthsArray);
        return monthsArray;
    }, [readings]);

    // Update available months when readings change
    useEffect(() => {
        const months = getAvailableMonths();
        setAvailableMonths(months);

        // Auto-select the most recent month if available
        if (months.length > 0 && !selectedMonth) {
            setSelectedMonth(months[0]);
        }
    }, [getAvailableMonths, selectedMonth]);

    const formatMonthDisplay = (monthKey: string) => {
        try {
            const [year, month] = monthKey.split("-");
            const date = new Date(Number(year), Number(month) - 1, 1);
            return date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
            });
        } catch (error) {
            console.error("Error formatting month:", monthKey, error);
            return monthKey;
        }
    };

    const generatePDFReport = async () => {
        if (!selectedMonth) {
            toast({
                title: "Select Month",
                description: "Please select a month to generate the report",
                variant: "destructive",
            });
            return;
        }

        console.log("Generating PDF for month:", selectedMonth);
        console.log("Sending data:", {
            month: selectedMonth,
            readings,
            tokens,
        });

        setGenerating(true);

        try {
            const response = await fetch("/api/generate-pdf-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    month: selectedMonth,
                    readings,
                    tokens,
                }),
            });

            console.log("PDF API response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("PDF API error:", errorText);
                throw new Error(
                    `Failed to generate PDF: ${response.status} ${errorText}`
                );
            }

            // Get the PDF blob
            const blob = await response.blob();
            console.log("PDF blob size:", blob.size);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `electricity-report-${selectedMonth}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: "Report Generated",
                description: `PDF report for ${formatMonthDisplay(
                    selectedMonth
                )} has been downloaded`,
            });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({
                title: "Generation Failed",
                description: `Failed to generate PDF report: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                variant: "destructive",
            });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Generate PDF Report
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Debug Information */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="text-xs space-y-1">
                                <div>
                                    Readings received: {readings?.length ?? 0}
                                </div>
                                <div>
                                    Tokens received: {tokens?.length ?? 0}
                                </div>
                                <div>
                                    Available months: {availableMonths.length}
                                </div>
                                {availableMonths.length > 0 && (
                                    <div>
                                        Months: {availableMonths.join(", ")}
                                    </div>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <label
                            htmlFor="month-select"
                            className="text-sm font-medium"
                        >
                            Select Month
                        </label>
                        <Select
                            value={selectedMonth}
                            onValueChange={setSelectedMonth}
                        >
                            <SelectTrigger id="month-select">
                                <SelectValue placeholder="Choose a month to generate report" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMonths.map((month) => (
                                    <SelectItem key={month} value={month}>
                                        {formatMonthDisplay(month)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={generatePDFReport}
                        disabled={!selectedMonth || generating}
                        className="w-full"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Generate PDF Report
                            </>
                        )}
                    </Button>

                    {availableMonths.length === 0 &&
                        readings &&
                        readings.length > 0 && (
                            <Alert className="border-orange-200 bg-orange-50">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <AlertDescription className="text-orange-700">
                                    <div className="space-y-2">
                                        <p>
                                            No months detected from{" "}
                                            {readings.length} readings.
                                        </p>
                                        <p className="text-xs">
                                            This might be due to timestamp
                                            format issues.
                                        </p>
                                        <details className="text-xs">
                                            <summary>
                                                Debug Info (click to expand)
                                            </summary>
                                            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-32">
                                                {JSON.stringify(
                                                    readings.slice(0, 3),
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                        </details>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                    {(!readings || readings.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center">
                            No readings data available for PDF generation. Add
                            some readings first.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
