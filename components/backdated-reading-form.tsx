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

import { useState, useMemo } from "react";
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
import { CalendarIcon, Clock, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElectricityReading } from "@/lib/types";
import { getPeriodFromHour, logTimezoneInfo } from "@/lib/timezone-utils";
import { ProtectedContent } from "@/components/auth/protected-content";

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
    console.log(period)
    // Get current date and time for validation
    const now = useMemo(() => new Date(), []);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = useMemo(
        () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        [now]
    );

    // Check if selected date is today
    const isSelectedDateToday = useMemo(() => {
        if (!date) return false;
        const selectedDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
        return selectedDate.getTime() === today.getTime();
    }, [date, today]);

    // Check if selected date is in the future
    const isSelectedDateFuture = useMemo(() => {
        if (!date) return false;
        const selectedDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
        return selectedDate.getTime() > today.getTime();
    }, [date, today]);

    // Get available time options based on current time (if today is selected)
    const getAvailableTimeOptions = useMemo(() => {
        if (!isSelectedDateToday) {
            // If not today, all times are available
            return [
                {
                    value: "07:00",
                    label: "7:00 AM (Morning)",
                    period: "morning",
                },
                {
                    value: "17:00",
                    label: "5:00 PM (Evening)",
                    period: "evening",
                },
                { value: "21:00", label: "9:00 PM (Night)", period: "night" },
                { value: "custom", label: "Custom Time", period: null },
            ];
        }

        // If today, only show times that have already passed
        const options = [];

        // Morning option (7:00 AM) - available if current time is after 7:00 AM
        if (currentHour > 7 || (currentHour === 7 && currentMinute > 0)) {
            options.push({
                value: "07:00",
                label: "7:00 AM (Morning)",
                period: "morning",
            });
        }

        // Evening option (5:00 PM) - available if current time is after 5:00 PM
        if (currentHour > 17 || (currentHour === 17 && currentMinute > 0)) {
            options.push({
                value: "17:00",
                label: "5:00 PM (Evening)",
                period: "evening",
            });
        }

        // Night option (9:00 PM) - available if current time is after 9:00 PM
        if (currentHour > 21 || (currentHour === 21 && currentMinute > 0)) {
            options.push({
                value: "21:00",
                label: "9:00 PM (Night)",
                period: "night",
            });
        }

        // Custom time is always available (with validation)
        options.push({ value: "custom", label: "Custom Time", period: null });

        return options;
    }, [isSelectedDateToday, currentHour, currentMinute]);

    // Validate custom time input
    const isCustomTimeValid = useMemo(() => {
        if (!isSelectedDateToday || time !== "custom") return true;

        const [hours, minutes] = customTime.split(":").map(Number);
        const customTimeInMinutes = hours * 60 + minutes;
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        return customTimeInMinutes < currentTimeInMinutes;
    }, [isSelectedDateToday, time, customTime, currentHour, currentMinute]);

    // Check if the form is valid for submission
    const isFormValid = useMemo(() => {
        if (!date || !reading || isNaN(Number(reading))) return false;
        if (isSelectedDateFuture) return false;
        if (time === "custom" && !isCustomTimeValid) return false;
        return true;
    }, [date, reading, isSelectedDateFuture, time, isCustomTimeValid]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid) return;

        // Create timestamp by combining date and time
        const timeToUse = time === "custom" ? customTime : time;
        const [hours, minutes] = timeToUse.split(":").map(Number);
        const timestamp = new Date(date!);
        timestamp.setHours(hours, minutes, 0, 0);

        // Additional validation: ensure timestamp is not in the future
        if (timestamp.getTime() > now.getTime()) {
            return;
        }

        // Calculate period from timestamp for consistency
        const calculatedPeriod = getPeriodFromHour(timestamp.getHours());

        // Debug logging
        logTimezoneInfo("[CLIENT] Submitting backdated reading", timestamp);

        await onSubmit({
            timestamp,
            reading: Number(reading),
            period: calculatedPeriod,
        });

        // Show success message
        setLastSubmittedTime(`${format(date!, "PP")} at ${timeToUse}`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);

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

    // Handle date change with validation
    const handleDateChange = (newDate: Date | undefined) => {
        setDate(newDate);

        // Reset time selection if the new date makes current selection invalid
        if (newDate && time !== "custom") {
            const isNewDateToday = newDate.getTime() === today.getTime();
            if (isNewDateToday) {
                const availableOptions = getAvailableTimeOptions;
                const currentTimeOption = availableOptions.find(
                    (opt) => opt.value === time
                );
                if (!currentTimeOption) {
                    // Reset to the latest available time or custom
                    const latestOption =
                        availableOptions[availableOptions.length - 2]; // -2 to skip "custom"
                    if (latestOption && latestOption.value !== "custom") {
                        setTime(latestOption.value);
                    } else {
                        setTime("custom");
                        setCustomTime("12:00"); // Safe default
                    }
                }
            }
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

            {/* Future date warning */}
            {isSelectedDateFuture && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                        <strong>Future dates are not allowed.</strong> Please
                        select a past date for backdated readings.
                    </AlertDescription>
                </Alert>
            )}

            {/* Future time warning */}
            {isSelectedDateToday && time === "custom" && !isCustomTimeValid && (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700 dark:text-orange-300">
                        <strong>Future times are not allowed.</strong> Please
                        select a time that has already passed today.
                    </AlertDescription>
                </Alert>
            )}

            {/* Today time restrictions info */}
            {isSelectedDateToday && getAvailableTimeOptions.length <= 1 && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                        <strong>Limited time options for today.</strong> Only
                        times that have already passed are available for
                        selection.
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

            <ProtectedContent message="Sign in to add backdated electricity readings">
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
                                            !date && "text-muted-foreground",
                                            isSelectedDateFuture &&
                                                "border-red-300 bg-red-50"
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
                                        onSelect={handleDateChange}
                                        disabled={(date) => {
                                            // Disable future dates
                                            return date > new Date();
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {isSelectedDateToday && (
                                <p className="text-xs text-blue-600">
                                    Today - only past times available
                                </p>
                            )}
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
                                        {getAvailableTimeOptions.map(
                                            (option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>

                                {time === "custom" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="time"
                                                className={cn(
                                                    "w-full",
                                                    isSelectedDateToday &&
                                                        !isCustomTimeValid &&
                                                        "border-orange-300 bg-orange-50"
                                                )}
                                                value={customTime}
                                                onChange={(e) =>
                                                    handleCustomTimeChange(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        {isSelectedDateToday && (
                                            <p className="text-xs text-gray-600">
                                                Current time:{" "}
                                                {format(now, "HH:mm")} - select
                                                an earlier time
                                            </p>
                                        )}
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
                    <div
                        className={cn(
                            "p-3 rounded-lg border",
                            isFormValid
                                ? "bg-gray-50 dark:bg-gray-900"
                                : "bg-red-50 dark:bg-red-950 border-red-200"
                        )}
                    >
                        <h4 className="font-medium mb-2">Summary:</h4>
                        <div className="text-sm space-y-1">
                            <p>
                                Date:{" "}
                                {date ? format(date, "PPP") : "Not selected"}
                                {isSelectedDateFuture && (
                                    <span className="text-red-600 ml-2">
                                        ⚠️ Future date
                                    </span>
                                )}
                            </p>
                            <p>
                                Time: {time === "custom" ? customTime : time}
                                {isSelectedDateToday &&
                                    time === "custom" &&
                                    !isCustomTimeValid && (
                                        <span className="text-orange-600 ml-2">
                                            ⚠️ Future time
                                        </span>
                                    )}
                            </p>
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
                            disabled={isSubmitting || !isFormValid}
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
            </ProtectedContent>
        </div>
    );
}
