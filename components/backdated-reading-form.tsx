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
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ElectricityReading } from "@/lib/types";

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
    const [time, setTime] = useState("17:00"); // Default to 5:00 PM
    const [reading, setReading] = useState("");
    const [period, setPeriod] = useState<"morning" | "evening" | "night">(
        "evening"
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !reading || isNaN(Number(reading))) return;

        // Create timestamp by combining date and time
        const [hours, minutes] = time.split(":").map(Number);
        const timestamp = new Date(date);
        timestamp.setHours(hours, minutes, 0, 0);

        await onSubmit({
            timestamp,
            reading: Number(reading),
            period,
        });

        // Reset form
        setReading("");
    };

    // Update period based on selected time
    const handleTimeChange = (value: string) => {
        setTime(value);

        const hour = parseInt(value.split(":")[0], 10);
        if (hour >= 5 && hour < 12) {
            setPeriod("morning");
        } else if (hour >= 12 && hour < 20) {
            setPeriod("evening");
        } else {
            setPeriod("night");
        }
    };

    return (
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
                    <div className="flex items-center space-x-2">
                        <Select value={time} onValueChange={handleTimeChange}>
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
                                    className="w-[120px]"
                                    onChange={(e) =>
                                        handleTimeChange(e.target.value)
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

            <div className="pt-2">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                >
                    {isSubmitting ? "Submitting..." : "Add Backdated Reading"}
                </Button>
            </div>
        </form>
    );
}
