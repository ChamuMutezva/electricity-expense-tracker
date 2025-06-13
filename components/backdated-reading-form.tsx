/**
 * BackdatedReadingForm component allows users to submit a backdated electricity meter reading.
 *
 * This form provides UI controls for selecting a date, time (with presets and custom input),
 * and entering a meter reading value. The period (morning, evening, night) is automatically
 * determined based on the selected time. Upon submission, the form combines the selected date
 * and time into a timestamp and calls the provided `onSubmit` handler with the reading data.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {(reading: Omit<ElectricityReading, "id" | "reading_id">) => Promise<void>} props.onSubmit
 *   Callback function invoked when the form is submitted. Receives the reading data (without `id` and `reading_id`).
 * @param {boolean} props.isSubmitting
 *   Indicates whether the form is currently submitting, disabling the submit button and showing a loading state.
 *
 * @example
 * <BackdatedReadingForm
 *   onSubmit={handleReadingSubmit}
 *   isSubmitting={isLoading}
 * />
 */
"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { CalendarIcon, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElectricityReading } from "@/lib/types";
import { getPeriodFromHour, logTimezoneInfo } from "@/lib/timezone-utils";

interface BackdatedReadingFormProps {
    onSubmit: (
        reading: Omit<ElectricityReading, "id" | "reading_id">
    ) => Promise<void>;
    isSubmitting: boolean;
}

export default function BackdatedReadingForm({
    onSubmit,
    isSubmitting,
}: Readonly<BackdatedReadingFormProps>) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState("21:00"); // Default to night period (9:00 PM)
    const [customTime, setCustomTime] = useState("21:00");
    const [reading, setReading] = useState("");
    const [period, setPeriod] = useState<"morning" | "evening" | "night">(
        "night"
    );
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastSubmittedTime, setLastSubmittedTime] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !reading || isNaN(Number(reading))) return;

        // Create timestamp by combining date and time
        const timeToUse = time === "custom" ? customTime : time;
        const [hours, minutes] = timeToUse.split(":").map(Number);
        const timestamp = new Date(date);
        timestamp.setHours(hours, minutes, 0, 0);

        // Calculate period from timestamp for consistency
        const calculatedPeriod = getPeriodFromHour(timestamp.getHours());

        // Debug logging
        logTimezoneInfo("[CLIENT] Submitting backdated reading", timestamp);
        console.log(
            `[CLIENT] Calculated period: ${calculatedPeriod}, Hours: ${timestamp.getHours()}`
        );

        await onSubmit({
            timestamp,
            reading: Number(reading),
            period: calculatedPeriod,
        });

        // Show success message
        setLastSubmittedTime(`${format(date, "PP")} at ${timeToUse}`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        console.log("Period detected:", period);
        // Reset form
        setReading("");
    };

    // Update period based on selected time
    const handleTimeChange = (value: string) => {
        setTime(value);

        if (value !== "custom") {
            const [hours] = value.split(":").map(Number);
            const detectedPeriod = getPeriodFromHour(hours);
            setPeriod(detectedPeriod);
        }
    };

    const handleCustomTimeChange = (value: string) => {
        setCustomTime(value);
        if (time === "custom") {
            const [hours] = value.split(":").map(Number);
            const detectedPeriod = getPeriodFromHour(hours);
            setPeriod(detectedPeriod);
        }
    };

    // Get the current detected period for display
    const currentTimeForPeriod = time === "custom" ? customTime : time;
    const [hours] = currentTimeForPeriod.split(":").map(Number);
    const detectedPeriod = getPeriodFromHour(hours);

    const getPeriodDisplayName = (period: string) => {
        switch (period) {
            case "morning":
                return "Morning (5:00 AM - 11:59 AM)";
            case "evening":
                return "Evening (12:00 PM - 7:59 PM)";
            case "night":
                return "Night (8:00 PM - 4:59 AM)";
            default:
                return period;
        }
    };

    return (
        <div className="space-y-4">
            {/* Success message */}
            {showSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                        Reading successfully added for {lastSubmittedTime} (
                        {getPeriodDisplayName(detectedPeriod)})
                    </AlertDescription>
                </Alert>
            )}

            {/* Period Detection Alert */}
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                    <div className="space-y-2">
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                            Selected time will be categorized as:{" "}
                            <strong>
                                {getPeriodDisplayName(detectedPeriod)}
                            </strong>
                        </p>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p>• Morning: 5:00 AM - 11:59 AM</p>
                            <p>• Evening: 12:00 PM - 7:59 PM</p>
                            <p>• Night: 8:00 PM - 4:59 AM</p>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? (
                                        format(date, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <div className="space-y-2">
                            <Select
                                value={time}
                                onValueChange={handleTimeChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="07:00">
                                        7:00 AM (Morning)
                                    </SelectItem>
                                    <SelectItem value="17:00">
                                        5:00 PM (Evening)
                                    </SelectItem>
                                    <SelectItem value="21:00">
                                        9:00 PM (Night)
                                    </SelectItem>
                                    <SelectItem value="custom">
                                        Custom Time
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {time === "custom" && (
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        className="w-full"
                                        value={customTime}
                                        onChange={(e) =>
                                            handleCustomTimeChange(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reading">Meter Reading</Label>
                    <Input
                        id="reading"
                        type="number"
                        step="0.01"
                        placeholder="Enter meter reading"
                        value={reading}
                        onChange={(e) => setReading(e.target.value)}
                        required
                    />
                </div>

                {/* Show what will be submitted */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    <h4 className="font-medium mb-2">Summary:</h4>
                    <div className="text-sm space-y-1">
                        <p>
                            Date: {date ? format(date, "PPP") : "Not selected"}
                        </p>
                        <p>Time: {time === "custom" ? customTime : time}</p>
                        <p>
                            Period:{" "}
                            <strong>
                                {getPeriodDisplayName(detectedPeriod)}
                            </strong>
                        </p>
                        <p>Reading: {reading || "Not entered"} kWh</p>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || !reading || !date}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 animate-spin" />
                                Submitting...
                            </div>
                        ) : (
                            "Add Backdated Reading"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
