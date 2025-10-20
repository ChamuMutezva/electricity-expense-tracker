"use client";

import { useCallback } from "react";
import { useElectricity } from "@/contexts/ElectricityContext";
import {
    addElectricityReading,
    addBackdatedReading,
} from "@/actions/electricity-actions";
import { useToast } from "@/hooks/use-toast";
import type { ElectricityReading } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function useElectricityReadings(dbConnected: boolean) {
    const { state, dispatch } = useElectricity();
    const { toast } = useToast();

    const getPeriodFromHour = (
        hour: number
    ): "morning" | "evening" | "night" => {
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 20) return "evening";
        return "night";
    };

    const handleAddReading = useCallback(
        async (forceUpdate = false) => {
            dispatch({ type: "SET_IS_SUBMITTED", payload: true });

            if (!state.currentReading || Number.isNaN(state.currentReading)) {
                toast({
                    title: "❌ Invalid Input",
                    description: "Please enter a valid meter reading",
                    variant: "destructive",
                });
                dispatch({ type: "SET_IS_SUBMITTED", payload: false });
                return;
            }

            try {
                dispatch({ type: "SET_IS_SUBMITTING", payload: true });
                const readingValue = Number(state.currentReading);

                if (readingValue <= 0) {
                    toast({
                        title: "❌ Invalid Reading",
                        description: "Reading must be greater than 0",
                        variant: "destructive",
                    });
                    dispatch({ type: "SET_IS_SUBMITTED", payload: false });
                    return;
                }

                toast({
                    title: "⏳ Processing...",
                    description: "Adding your electricity reading",
                });

                if (dbConnected) {
                    const result = await addElectricityReading(
                        readingValue,
                        forceUpdate
                    );

                    if (
                        !result.isUpdate &&
                        result.existingReading &&
                        !forceUpdate
                    ) {
                        const error = new Error(
                            "Duplicate reading exists"
                        ) as Error & {
                            existingReading?: ElectricityReading;
                        };
                        error.existingReading = result.existingReading;
                        throw error;
                    }

                    if (result.isUpdate) {
                        dispatch({
                            type: "UPDATE_READING",
                            payload: {
                                readingId: result.reading.reading_id,
                                updatedReading: result.reading,
                            },
                        });
                        toast({
                            title: "✅ Reading Updated",
                            description: `${getPeriodFromHour(
                                new Date().getHours()
                            )} reading updated to ${readingValue} kWh.`,
                            className:
                                "border-green-500 bg-green-50 text-green-800",
                        });
                    } else {
                        dispatch({
                            type: "ADD_NEW_READING",
                            payload: result.reading,
                        });
                        toast({
                            title: "✅ Reading Added Successfully!",
                            description: `New reading of ${readingValue} kWh has been recorded.`,
                            className:
                                "border-green-500 bg-green-50 text-green-800",
                        });
                    }

                    dispatch({
                        type: "SET_LATEST_READING",
                        payload: readingValue,
                    });
                } else {
                    // Local storage handling
                    const now = new Date();
                    const period = getPeriodFromHour(now.getHours());
                    const todayStr = now.toISOString().split("T")[0];

                    const existingReadingIndex = state.readings.findIndex(
                        (r) => {
                            const readingDate = new Date(r.timestamp)
                                .toISOString()
                                .split("T")[0];
                            return (
                                readingDate === todayStr && r.period === period
                            );
                        }
                    );

                    if (existingReadingIndex !== -1 && !forceUpdate) {
                        const error = new Error("Duplicate reading exists");
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (error as any).existingReading =
                            state.readings[existingReadingIndex];
                        throw error;
                    }

                    if (existingReadingIndex !== -1 && forceUpdate) {
                        const updatedReadings = [...state.readings];
                        updatedReadings[existingReadingIndex] = {
                            ...updatedReadings[existingReadingIndex],
                            reading: readingValue,
                            timestamp: now,
                        };
                        dispatch({
                            type: "SET_READINGS",
                            payload: updatedReadings,
                        });
                    } else {
                        const newReading: ElectricityReading = {
                            id: Date.now(),
                            reading_id: `reading-${Date.now()}`,
                            timestamp: now,
                            reading: readingValue,
                            period,
                        };
                        dispatch({
                            type: "ADD_NEW_READING",
                            payload: newReading,
                        });
                    }

                    dispatch({
                        type: "SET_LATEST_READING",
                        payload: readingValue,
                    });
                }

                dispatch({ type: "SET_CURRENT_READING", payload: "" });
                dispatch({ type: "SET_IS_SUBMITTED", payload: false });
            } catch (error: unknown) {
                if (
                    typeof error === "object" &&
                    error !== null &&
                    "existingReading" in error &&
                    "navigator" in globalThis &&
                    "vibrate" in navigator
                ) {
                    navigator.vibrate(100);
                    throw error;
                } else {
                    console.error("Error adding reading:", error);
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred";
                    toast({
                        title: "❌ Failed to Add Reading",
                        description: `Error: ${errorMessage}. Please try again or check your connection.`,
                        variant: "destructive",
                        action: (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddReading(forceUpdate)}
                                className="ml-2"
                            >
                                Retry
                            </Button>
                        ),
                    });
                }
            } finally {
                dispatch({ type: "SET_IS_SUBMITTING", payload: false });
            }
        },
        [state.currentReading, state.readings, dbConnected, dispatch, toast]
    );

    const handleAddBackdatedReading = useCallback(
        async (readingData: Omit<ElectricityReading, "id" | "reading_id">) => {
            try {
                dispatch({ type: "SET_IS_SUBMITTING", payload: true });

                if (dbConnected) {
                    const newReading = await addBackdatedReading(readingData);
                    dispatch({ type: "ADD_NEW_READING", payload: newReading });

                    const now = new Date();
                    if (readingData.timestamp > now) {
                        dispatch({
                            type: "SET_LATEST_READING",
                            payload: Number(readingData.reading),
                        });
                    }
                } else {
                    const newReading: ElectricityReading = {
                        id: Date.now(),
                        reading_id: `reading-${Date.now()}`,
                        timestamp: readingData.timestamp,
                        reading: readingData.reading,
                        period: readingData.period,
                    };
                    dispatch({ type: "ADD_NEW_READING", payload: newReading });

                    const now = new Date();
                    if (readingData.timestamp > now) {
                        dispatch({
                            type: "SET_LATEST_READING",
                            payload: Number(readingData.reading),
                        });
                    }
                }

                toast({
                    title: "Backdated Reading Added",
                    description: `Reading of ${
                        readingData.reading
                    } kWh has been recorded for ${readingData.timestamp.toLocaleString()}.`,
                });
            } catch (error) {
                console.error("Error adding backdated reading:", error);
                toast({
                    title: "Error",
                    description:
                        "Failed to add backdated reading. Please try again.",
                    variant: "destructive",
                });
            } finally {
                dispatch({ type: "SET_IS_SUBMITTING", payload: false });
            }
        },
        [dbConnected, dispatch, toast]
    );

    return {
        handleAddReading,
        handleAddBackdatedReading,
    };
}
