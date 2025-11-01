/**
 * UpdateMeterReading component allows users to input and update the current electricity meter reading
 * for a specific period (morning, evening, or night). It handles duplicate reading detection and provides
 * an option to force update an existing reading.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string | number} props.currentReading - The current value of the meter reading input.
 * @param {(value: string) => void} props.setCurrentReading - Function to update the current reading state.
 * @param {(forceUpdate?: boolean) => Promise<void>} props.handleAddReading - Function to submit the new reading. Accepts an optional boolean to force update.
 * @param {boolean} props.isSubmitting - Indicates if the form submission is in progress.
 * @param {boolean} props.isSubmitted - Indicates if the form has been submitted.
 * @param {string} [props.label] - Optional label for the input field. Defaults to "Update Electricity Reading".
 * @param {string} [props.placeholder] - Optional placeholder for the input field. Defaults to "Enter current meter reading".
 * @param {string} [props.buttonText] - Optional text for the submit button. Defaults to "Update".
 * @param {string} [props.loadingText] - Optional text for the submit button while loading. Defaults to "Updating...".
 *
 * @returns {JSX.Element} The rendered UpdateMeterReading component.
 *
 * @example
 * <UpdateMeterReading
 *   currentReading={reading}
 *   setCurrentReading={setReading}
 *   handleAddReading={handleAddReading}
 *   isSubmitting={isSubmitting}
 *   isSubmitted={isSubmitted}
 * />
 */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertTriangle,
    Clock,
    RefreshCw,
    CheckCircle,
    Zap,
} from "lucide-react";
import { getPeriodFromHour } from "@/lib/timezone-utils";

type UpdateMeterReadingProps = {
    currentReading: string | number;
    setCurrentReading: (value: string) => void;
    handleAddReading: (forceUpdate?: boolean) => Promise<void>;
    isSubmitting: boolean;
    isSubmitted: boolean;
    label?: string;
    placeholder?: string;
    buttonText?: string;
    loadingText?: string;
};

export const UpdateMeterReading = ({
    currentReading,
    setCurrentReading,
    handleAddReading,
    isSubmitting,
    isSubmitted,
    label = "Update Electricity Reading",
    placeholder = "Enter current meter reading",
    buttonText = "Update",
    loadingText = "Updating...",
}: UpdateMeterReadingProps) => {
    const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
    const [existingReading, setExistingReading] = useState<{
        reading: number;
    } | null>(null);
    const [pendingReading, setPendingReading] = useState<string>("");
    // Add states for success feedback
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastSuccessfulReading, setLastSuccessfulReading] =
        useState<string>("");
    // Add state for client-side rendered time
    const [currentTime, setCurrentTime] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    // Use useEffect to handle client-side time rendering to avoid hydration mismatch
    useEffect(() => {
        // Mark component as mounted
        setMounted(true);

        // Set initial time
        setCurrentTime(new Date().toLocaleString());

        // Update time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleString());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Get current period for display
    const getCurrentPeriodForDisplay = () => {
        const now = new Date();
        const localHour = now.getHours();
        const period = getPeriodFromHour(localHour);
        return period;
    };

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

    const handleSubmit = async () => {
        if (!currentReading || Number.isNaN(Number(currentReading))) {
            return;
        }

        setPendingReading(currentReading.toString());

        try {
            await handleAddReading(false); // First try without force update

            // Success feedback
            setLastSuccessfulReading(currentReading.toString());
            setShowSuccess(true);
            setCurrentReading(""); // Clear input on success

            // Hide success message after 5 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
        } catch (error: unknown) {
            // Check if this is a duplicate reading error
            if (
                typeof error === "object" &&
                error !== null &&
                "existingReading" in error
            ) {
                setExistingReading(
                    (error as { existingReading: { reading: number } })
                        .existingReading
                );
                setShowDuplicateAlert(true);
            }
        }
    };

    const handleForceUpdate = async () => {
        try {
            await handleAddReading(true); // Force update

            // Success feedback for force update
            setLastSuccessfulReading(pendingReading);
            setShowSuccess(true);

            // Reset states
            setShowDuplicateAlert(false);
            setExistingReading(null);
            setPendingReading("");
            setCurrentReading("");

            // Hide success message after 5 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
        } catch (error) {
            console.error("Error forcing update:", error);
        }
    };

    const handleCancelUpdate = () => {
        setShowDuplicateAlert(false);
        setExistingReading(null);
        setPendingReading("");
        setCurrentReading("");
    };

    const currentPeriod = getCurrentPeriodForDisplay();

    return (
        <div className="space-y-4">
            {/* Duplicate Reading Alert */}
            {showDuplicateAlert && existingReading && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">
                        Reading Already Exists for{" "}
                        {getPeriodDisplayName(currentPeriod)}
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                        <div className="space-y-3 mt-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                    Current {currentPeriod} reading:{" "}
                                    <strong>
                                        {existingReading.reading} kWh
                                    </strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                <span>
                                    New reading:{" "}
                                    <strong>{pendingReading} kWh</strong>
                                </span>
                            </div>
                            <p className="text-sm">
                                Would you like to update the existing{" "}
                                {currentPeriod} reading with the new value?
                            </p>
                            <div className="flex gap-2 mt-3">
                                <Button
                                    size="sm"
                                    onClick={handleForceUpdate}
                                    disabled={isSubmitting}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {isSubmitting
                                        ? "Updating..."
                                        : "Yes, Update Reading"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelUpdate}
                                    disabled={isSubmitting}
                                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Success Alert */}
            {showSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 dark:text-green-200">
                        Reading Updated Successfully
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                        <div className="space-y-1 mt-1">
                            <p>
                                Reading of{" "}
                                <strong>{lastSuccessfulReading} kWh</strong> has
                                been recorded for{" "}
                                {getPeriodDisplayName(currentPeriod)}.
                            </p>
                            {mounted && (
                                <p className="text-xs">{currentTime}</p>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Current Period Info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        Current Period:{" "}
                        <strong>{getPeriodDisplayName(currentPeriod)}</strong>
                    </span>
                </div>
                {/* Only render time when component is mounted (client-side) */}
                {mounted && (
                    <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Current time: {currentTime}
                    </div>
                )}
            </div>

            {/* Reading Input */}
            <div className="flex flex-col space-y-1.5">
                <Label htmlFor="reading">{label}</Label>
                <div className="flex gap-2">
                    <Input
                        id="reading"
                        placeholder={placeholder}
                        value={currentReading}
                        onChange={(e) => setCurrentReading(e.target.value)}
                        type="number"
                        step="0.01"
                        className={
                            !currentReading && isSubmitted
                                ? "border-red-500"
                                : ""
                        }
                        disabled={showDuplicateAlert}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting ||
                            showDuplicateAlert ||
                            !currentReading
                        }
                        className={`hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white transition-all duration-200 ${
                            isSubmitting ? "bg-blue-400 cursor-not-allowed" : ""
                        }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                {loadingText}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                {buttonText}
                            </div>
                        )}
                    </Button>
                </div>
                {/* Error message display */}
                {!currentReading && isSubmitted && (
                    <p className="text-sm text-red-500">
                        Please enter a valid reading
                    </p>
                )}
            </div>
        </div>
    );
};
