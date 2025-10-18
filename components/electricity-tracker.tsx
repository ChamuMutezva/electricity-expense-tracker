/**
 * ElectricityTracker is the main component for tracking and managing electricity meter readings and token purchases.
 *
 * This component provides a dashboard interface for users to:
 * - View and update current electricity meter readings.
 * - Add new readings (with duplicate detection and update support).
 * - Add electricity tokens (units purchased).
 * - Record backdated readings for missed periods.
 * - Visualize usage summaries and charts.
 * - View monthly reports and AI-generated insights.
 * - Receive browser notifications for reading reminders.
 * - Migrate local storage data to a connected database.
 *
 * Features:
 * - Handles both local storage and database-backed data, with seamless migration.
 * - Notifies users of missed readings and upcoming update times.
 * - Supports enabling/disabling browser notifications.
 * - Provides a tabbed interface for summary, charts, token entry, backdated readings, reports, and AI insights.
 *
 * Props:
 * @param {ElectricityReading[]} initialReadings - Initial list of electricity readings (from server or local storage).
 * @param {TokenPurchase[]} initialTokens - Initial list of token purchases (from server or local storage).
 * @param {number} initialLatestReading - The latest meter reading value.
 * @param {number} initialTotalUnits - The total units consumed (calculated from readings).
 * @param {boolean} dbConnected - Indicates if the app is connected to a backend database.
 *
 * State:
 * - readings: List of all electricity readings.
 * - tokens: List of all token purchases.
 * - currentReading: Input value for the current reading.
 * - tokenUnits: Input value for token units.
 * - tokenCost: Input value for token cost.
 * - notificationsEnabled: Whether browser notifications are enabled.
 * - nextUpdate: Date/time of the next expected reading update.
 * - timeUntilUpdate: String representing time left until next update.
 * - showNotification: Whether to show the update reminder notification.
 * - latestReading: The most recent meter reading value.
 * - totalUnits: Total units consumed (difference between first and last reading).
 * - isSubmitting: Whether a form submission is in progress.
 * - showMigrationAlert: Whether to show the migration alert for local data.
 * - missedReadings: List of missed reading periods for today.
 * - isSubmitted: Tracks if the reading form has been submitted.
 *
 * Methods:
 * - handleAddReading: Adds or updates a meter reading, with duplicate detection.
 * - handleAddBackdatedReading: Adds a reading for a past date/time.
 * - handleAddToken: Adds a new token purchase and updates readings.
 * - handleMigrateData: Migrates local storage data to the database.
 * - enableNotifications: Requests browser notification permissions.
 * - showUpdateNotification: Triggers a browser notification for reading reminders.
 *
 * Effects:
 * - Loads initial data from local storage or server.
 * - Persists readings and tokens to local storage if not connected to a database.
 * - Calculates next update time and missed readings.
 * - Calculates total units consumed.
 *
 * UI:
 * - Dashboard summary card with current status and update form.
 * - Alerts for migration and missed readings.
 * - Tabbed interface for summary, chart, token entry, backdated readings, reports, and AI insights.
 *
 * @component
 */
"use client";

import { useEffect, useReducer } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MigrationAlert from "@/components/migration-alert";
import MissedReadings from "@/components/missed-readings";
import {
    CalendarClock,
    Brain,
    Plus,
    Home,
    TrendingUp,
    FileText,
} from "lucide-react";
import { getTimeString, getNextUpdateTime } from "@/lib/date-utils";
import type {
    ElectricityReading,
    ElectricityTrackerProps,
    LocalStorageElectricityReading,
    LocalStorageTokenPurchase,
    TokenPurchase,
} from "@/lib/types";
import {
    addElectricityReading,
    addTokenPurchase,
    migrateFromLocalStorage,
    addBackdatedReading,
    getTotalUnitsUsed,
} from "@/actions/electricity-actions";
import { useToast } from "@/hooks/use-toast";
import {
    parseLocalStorageReadings,
    parseLocalStorageTokens,
} from "@/lib/storage";
import UpdateReminderNotification from "./UpdateReminderNotification";
import { Button } from "./ui/button";
import { LowBalanceNotification } from "./low-balance-notification";
import { useElectricityStorage } from "@/hooks/use-local-storage";
import AnalyticsTabs from "./Tabs/AnalyticsTabs";
import ReportsTabs from "./Tabs/ReportsTabs";
import AIInsightsTabs from "./Tabs/AIInsightsTabs";
import AddTokenTabs from "./Tabs/AddTokenTabs";
import BackdatedTabs from "./Tabs/BackdatedTabs";
import DashboardTabs from "./Tabs/DashboardTabs";
import {
    reducer,
    initialElectricityState,
} from "@/app/utility/electricityReducer";

export default function ElectricityTracker({
    initialReadings,
    initialTokens,
    initialLatestReading,
    initialTotalUnits,
    dbConnected,
}: Readonly<ElectricityTrackerProps>) {
    //  const [readings, setReadings] = useState<ElectricityReading[]>(initialReadings);

    const { toast } = useToast();
    const [state, dispatch] = useReducer(reducer, initialElectricityState);

    const {
        isLoading,
        isSubmitted,
        isSubmitting,
        showMigrationAlert,
        showNotification,
        activeTab,
        missedReadings,
        tokenUnits,
        tokenCost,
        currentReading,
        timeUntilUpdate,
        tokens,
        totalUnits,
        latestReading,
        nextUpdate,
        readings,
    } = state;

    const {
        notificationsEnabled,
        setNotificationsEnabled,
        checkMigrationNeeded,
        clearElectricityData,
    } = useElectricityStorage(dbConnected);

    // Check for local storage data on component mount
    useEffect(() => {
        if (dbConnected) {
            dispatch({
                type: "SET_TOKENS",
                payload: initialTokens,
            });
            dispatch({
                type: "SET_SHOW_MIGRATION_ALERT",
                payload: checkMigrationNeeded(),
            });
            dispatch({
                type: "SET_TOTAL_UNITS",
                payload: initialTotalUnits,
            });
            dispatch({
                type: "SET_LATEST_READING",
                payload: initialLatestReading,
            });
            dispatch({
                type: "SET_READINGS",
                payload: initialReadings,
            });
        } else {
            dispatch({
                type: "SET_READINGS",
                payload: parseLocalStorageReadings(
                    localStorage.getItem("electricityReadings")
                ),
            });

            dispatch({
                type: "SET_TOKENS",
                payload: parseLocalStorageTokens(
                    localStorage.getItem("electricityTokens")
                ),
            });
        }
    }, [
        dbConnected,
        checkMigrationNeeded,
        initialTokens,
        initialTotalUnits,
        initialLatestReading,
        initialReadings,
    ]);

    // Save readings to localStorage if database is not connected
    useEffect(() => {
        if (!dbConnected) {
            localStorage.setItem(
                "electricityReadings",
                JSON.stringify(readings)
            );
            localStorage.setItem("electricityTokens", JSON.stringify(tokens));
        }
    }, [readings, tokens, dbConnected]);

    // Calculate next update time and set timer
    useEffect(() => {
        const next = getNextUpdateTime();
        dispatch({ type: "SET_NEXT_UPDATE", payload: next });

        const interval = setInterval(() => {
            const now = new Date();
            const next = getNextUpdateTime();
            dispatch({ type: "SET_NEXT_UPDATE", payload: next });
            // Calculate time until next update
            const diffMs = next.getTime() - now.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;

            dispatch({
                type: "SET_TIME_UNTIL_UPDATE",
                payload: `${diffHours}h ${remainingMins}m`,
            });

            // Show notification 5 minutes before update time
            if (notificationsEnabled && diffMins <= 5 && diffMins > 0) {
                const period = getPeriodFromHour(next.getHours());
                showUpdateNotification(period);
                dispatch({
                    type: "SET_SHOW_NOTIFICATION",
                    payload: true,
                });
            } else {
                //setShowNotification(false);

                dispatch({
                    type: "SET_SHOW_NOTIFICATION",
                    payload: false,
                });
            }
        }, 60000); // Check every 1 minute

        return () => clearInterval(interval);
    }, [notificationsEnabled]);

    // Check for missed readings
    useEffect(() => {
        const checkMissedReadings = () => {
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];

            // Get readings for today
            const todayReadings = readings.filter((r) => {
                const readingDate = new Date(r.timestamp);
                return readingDate.toISOString().split("T")[0] === todayStr;
            });
            // Check which periods we have readings for
            const hasMorning = todayReadings.some(
                (r) => r.period === "morning"
            );
            const hasEvening = todayReadings.some(
                (r) => r.period === "evening"
            );
            const hasNight = todayReadings.some((r) => r.period === "night");

            const missed: string[] = [];
            const currentHour = today.getHours();

            // Check if we've missed any readings
            if (currentHour >= 8 && !hasMorning) {
                missed.push("morning (7:00 AM)");
            }

            if (currentHour >= 18 && !hasEvening) {
                missed.push("evening (5:00 PM)");
            }

            if (currentHour >= 22 && !hasNight) {
                missed.push("night (9:00 PM)");
            }

            //  setMissedReadings(missed);
            dispatch({ type: "SET_MISSED_READINGS", payload: missed });
        };

        checkMissedReadings();
    }, [readings]);

    // Enable notifications
    const enableNotifications = async () => {
        if ("Notification" in window) {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                setNotificationsEnabled(true);
            }
        }
    };

    // Show browser notification
    const showUpdateNotification = (period: string) => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Electricity Update Reminder", {
                body: `It's almost time for your ${period} electricity reading update!`,
                icon: "/favicon.ico",
            });
        }
    };

    // Get period name based on hour
    const getPeriodFromHour = (
        hour: number
    ): "morning" | "evening" | "night" => {
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 20) return "evening";
        return "night";
    };

    // Enhanced add reading function with duplicate handling
    const handleAddReading = async (forceUpdate = false) => {
        dispatch({ type: "SET_IS_SUBMITTED", payload: true });

        // Validate input
        if (!currentReading || Number.isNaN(currentReading)) {
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
            const readingValue = Number(currentReading);

            // Additional validation if needed
            if (readingValue <= 0) {
                toast({
                    title: "❌ Invalid Reading",
                    description: "Reading must be greater than 0",
                    variant: "destructive",
                });

                dispatch({ type: "SET_IS_SUBMITTED", payload: false });
                return;
            }

            // Show loading feedback
            toast({
                title: "⏳ Processing...",
                description: "Adding your electricity reading",
            });

            if (dbConnected) {
                // Use server action if database is connected
                const result = await addElectricityReading(
                    readingValue,
                    forceUpdate
                );

                if (
                    !result.isUpdate &&
                    result.existingReading &&
                    !forceUpdate
                ) {
                    // Throw error with existing reading info to trigger duplicate alert
                    const error = new Error(
                        "Duplicate reading exists"
                    ) as Error & { existingReading?: ElectricityReading };
                    error.existingReading = result.existingReading;
                    throw error;
                }

                // Update local state
                if (result.isUpdate) {
                    dispatch({
                        type: "UPDATE_READING",
                        payload: {
                            readingId: result.reading.reading_id,
                            updatedReading: result.reading,
                        },
                    });
                    toast({
                        title: "Reading Updated",
                        description: `${getPeriodFromHour(
                            new Date().getHours()
                        )} reading updated to ${readingValue} kWh.`,
                        className:
                            "border-green-500 bg-green-50 text-green-800",
                    });
                } else {
                    // Add new reading
                    // setReadings((prev) => [...prev, result.reading]);
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

                dispatch({ type: "SET_LATEST_READING", payload: readingValue });
            } else {
                // Use local storage if database is not connected
                const now = new Date();
                const period = getPeriodFromHour(now.getHours());
                const todayStr = now.toISOString().split("T")[0];

                // Check for existing reading in local storage
                const existingReadingIndex = readings.findIndex((r) => {
                    const readingDate = new Date(r.timestamp)
                        .toISOString()
                        .split("T")[0];
                    return readingDate === todayStr && r.period === period;
                });

                if (existingReadingIndex !== -1 && !forceUpdate) {
                    // Throw error to trigger duplicate alert
                    const error = new Error("Duplicate reading exists");
                    (
                        error as Error & {
                            existingReading?: ElectricityReading;
                        }
                    ).existingReading = readings[existingReadingIndex];
                    throw error;
                }

                if (existingReadingIndex !== -1 && forceUpdate) {
                    // Update existing reading
                    const updatedReadings = [...readings];
                    updatedReadings[existingReadingIndex] = {
                        ...updatedReadings[existingReadingIndex],
                        reading: readingValue,
                        timestamp: now,
                    };

                    dispatch({
                        type: "SET_READINGS",
                        payload: updatedReadings,
                    });
                    toast({
                        title: "✅ Reading Updated Successfully!",
                        description: `${period} reading updated to ${readingValue} kWh.`,
                        className: "border-blue-500 bg-blue-50 text-blue-800",
                    });
                } else {
                    // Add new reading
                    const newReading: ElectricityReading = {
                        id: Date.now(),
                        reading_id: `reading-${Date.now()}`,
                        timestamp: now,
                        reading: readingValue,
                        period,
                    };
                    // setReadings((prev) => [...prev, newReading]);
                    dispatch({ type: "ADD_NEW_READING", payload: newReading });
                    toast({
                        title: "✅ Reading Added Successfully!",
                        description: `New reading of ${readingValue} kWh has been recorded.`,
                        className: "border-blue-500 bg-blue-50 text-blue-800",
                    });
                }
                dispatch({ type: "SET_LATEST_READING", payload: readingValue });
            }

            dispatch({ type: "SET_CURRENT_READING", payload: "" });
            dispatch({ type: "SET_IS_SUBMITTED", payload: false });
        } catch (error: unknown) {
            if (
                typeof error === "object" &&
                error !== null &&
                "existingReading" in error &&
                "navigator" in window &&
                "vibrate" in navigator
            ) {
                // This will be handled by the UpdateMeterReading component
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
    };

    // Add a backdated reading
    const handleAddBackdatedReading = async (
        readingData: Omit<ElectricityReading, "id" | "reading_id">
    ) => {
        try {
            dispatch({ type: "SET_IS_SUBMITTING", payload: true });

            if (dbConnected) {
                // Use server action if database is connected
                const newReading = await addBackdatedReading(readingData);

                // Update local state
                // setReadings((prev) => [...prev, newReading]);
                dispatch({ type: "ADD_NEW_READING", payload: newReading });

                // Update latest reading if this is the most recent
                const now = new Date();
                if (readingData.timestamp > now) {
                    dispatch({
                        type: "SET_LATEST_READING",
                        payload: Number(readingData.reading),
                    });
                }
            } else {
                // Use local storage if database is not connected
                const newReading: ElectricityReading = {
                    id: Date.now(),
                    reading_id: `reading-${Date.now()}`,
                    timestamp: readingData.timestamp,
                    reading: readingData.reading,
                    period: readingData.period,
                };

                // setReadings((prev) => [...prev, newReading]);
                dispatch({ type: "ADD_NEW_READING", payload: newReading });

                // Update latest reading if this is the most recent
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
    };

    // Add a new token purchase - with fallback to local storage
    const handleAddToken = async () => {
        if (!tokenUnits || Number.isNaN(tokenUnits)) return;
        if (!tokenCost || Number.isNaN(tokenCost)) return;

        try {
            dispatch({ type: "SET_IS_SUBMITTING", payload: true });

            if (dbConnected) {
                // Use server action if database is connected
                const newToken = await addTokenPurchase(
                    Number(tokenUnits),
                    Number(tokenCost)
                );

                // Update local state
                dispatch({ type: "ADD_TOKEN", payload: newToken });
                dispatch({
                    type: "SET_LATEST_READING",
                    payload: Number(newToken.new_reading),
                });
            } else {
                // Use local storage if database is not connected
                const units = Number(tokenUnits);
                const costs = Number(tokenCost);
                const calculatedNewReading = latestReading + units;

                // Create token purchase record
                const newToken: TokenPurchase = {
                    id: Date.now(),
                    token_id: `token-${Date.now()}`,
                    timestamp: new Date(),
                    units,
                    new_reading: calculatedNewReading,
                    total_cost: costs,
                };

                // Add to tokens list
                dispatch({ type: "ADD_TOKEN", payload: newToken });

                // Create a new reading entry with the updated meter value
                const now = new Date();
                const period = getPeriodFromHour(now.getHours());

                const newReadingEntry: ElectricityReading = {
                    id: Date.now() + 1,
                    reading_id: `token-reading-${Date.now()}`,
                    timestamp: now,
                    reading: calculatedNewReading,
                    period,
                };

                // Add to readings list
                // setReadings((prev) => [...prev, newReadingEntry]);
                dispatch({ type: "ADD_NEW_READING", payload: newReadingEntry });
                dispatch({
                    type: "SET_LATEST_READING",
                    payload: calculatedNewReading,
                });
            }

            dispatch({ type: "SET_TOKEN_UNITS", payload: "" });
            dispatch({ type: "SET_TOKEN_COST", payload: "" });

            toast({
                title: "Token Added",
                description: `${Number(tokenUnits)} kWh added to your meter.`,
            });
        } catch (error) {
            console.error("Error adding token:", error);
            toast({
                title: "Error",
                description: "Failed to add token. Please try again.",
                variant: "destructive",
            });
        } finally {
            dispatch({ type: "SET_IS_SUBMITTING", payload: false });
        }
    };

    // Migrate data from local storage to database
    const handleMigrateData = async () => {
        try {
            const savedReadings = localStorage.getItem("electricityReadings");
            const savedTokens = localStorage.getItem("electricityTokens");

            if (!savedReadings && !savedTokens) {
                dispatch({ type: "SET_SHOW_MIGRATION_ALERT", payload: false });
                return;
            }

            dispatch({ type: "SET_IS_SUBMITTING", payload: true });

            // Format data for migration with proper typing
            const localReadings: ElectricityReading[] = savedReadings
                ? JSON.parse(savedReadings).map(
                      (r: LocalStorageElectricityReading) => ({
                          reading_id:
                              r.reading_id ||
                              r.id?.toString() ||
                              `reading-${Date.now()}-${Math.random()
                                  .toString(36)
                                  .substring(2, 9)}`,
                          timestamp: new Date(r.timestamp),
                          reading: r.reading,
                          period: r.period,
                      })
                  )
                : [];

            const localTokens: TokenPurchase[] = savedTokens
                ? JSON.parse(savedTokens).map(
                      (t: LocalStorageTokenPurchase) => ({
                          token_id:
                              t.token_id ||
                              t.id?.toString() ||
                              `token-${Date.now()}-${Math.random()
                                  .toString(36)
                                  .substring(2, 9)}`,
                          timestamp: new Date(t.timestamp),
                          units: t.units,
                          new_reading: t.new_reading || t.newReading || 0,
                      })
                  )
                : [];

            if (dbConnected) {
                const success = await migrateFromLocalStorage(
                    localReadings,
                    localTokens
                );

                if (success) {
                    clearElectricityData();
                    dispatch({
                        type: "SET_SHOW_MIGRATION_ALERT",
                        payload: false,
                    });

                    toast({
                        title: "Data Migrated",
                        description:
                            "Your local data has been successfully migrated to the database.",
                    });

                    // Refresh the page to get the latest data
                    window.location.reload();
                } else {
                    throw new Error("Migration failed");
                }
            } else {
                toast({
                    title: "Database Not Connected",
                    description:
                        "Cannot migrate data because database is not connected.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Migration error:", error);
            toast({
                title: "Migration Failed",
                description: "Failed to migrate data. Please try again.",
                variant: "destructive",
            });
        } finally {
            dispatch({ type: "SET_IS_SUBMITTING", payload: false });
        }
    };

    useEffect(() => {
        const fetchMonthlyData = async () => {
            try {
                dispatch({ type: "SET_LOADING", payload: true });
                const data = await getTotalUnitsUsed();
                console.log("Monthly usage data from API:", data);
                // setTotalUnits(data);
                dispatch({ type: "SET_TOTAL_UNITS", payload: data });
            } catch (error) {
                console.error("Error fetching monthly data:", error);
            } finally {
                dispatch({ type: "SET_LOADING", payload: false });
            }
        };
        fetchMonthlyData();
    }, [tokens, readings]);

    const handleBuyTokens = () => {
        dispatch({ type: "SET_ACTIVE_TAB", payload: "tokens" });
    };

    if (isLoading) {
        return <div>Loading units used readings </div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <LowBalanceNotification
                currentBalance={latestReading}
                onBuyTokens={handleBuyTokens}
            />
            <div
                className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm 
             top-0 z-40 shadow-sm"
            >
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold md:text-2xl text-foreground mt-1">
                            Monitor and manage your electricity consumption
                        </h2>
                    </div>
                    {/* Navigation Tabs */}
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) =>
                            dispatch({
                                type: "SET_ACTIVE_TAB",
                                payload: value,
                            })
                        }
                        className="w-full"
                    >
                        <TabsList className="w-full justify-between h-auto p-1 bg-slate-100 dark:bg-slate-900">
                            <TabsTrigger
                                value="dashboard"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <Home className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Dashboard
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <TrendingUp className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Analytics
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="reports"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Reports
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="ai-insights"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <Brain className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    AI Insights
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="token"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Add Token
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="backdated"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <CalendarClock className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Backdated
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="container mx-auto px-0 py-6">
                            {/* Alerts Section */}
                            <div className="space-y-4 mb-6">
                                {showMigrationAlert && (
                                    <MigrationAlert
                                        handleMigrateData={handleMigrateData}
                                        isSubmitting={isSubmitting}
                                        setShowMigrationAlert={() =>
                                            dispatch({
                                                type: "SET_SHOW_MIGRATION_ALERT",
                                                payload: false,
                                            })
                                        }
                                    />
                                )}
                                {missedReadings.length > 0 && (
                                    <MissedReadings
                                        missedReadings={missedReadings}
                                    />
                                )}
                                {showNotification && (
                                    <UpdateReminderNotification />
                                )}
                            </div>

                            <DashboardTabs
                                latestReading={latestReading}
                                totalUnits={totalUnits}
                                nextUpdate={nextUpdate}
                                getTimeString={getTimeString}
                                timeUntilUpdate={timeUntilUpdate}
                                readings={readings}
                                tokens={tokens}
                                currentReading={currentReading}
                                setCurrentReading={(value) =>
                                    dispatch({
                                        type: "SET_CURRENT_READING",
                                        payload: value,
                                    })
                                }
                                handleAddReading={handleAddReading}
                                isSubmitting={isSubmitting}
                                isSubmitted={isSubmitted}
                                enableNotifications={enableNotifications}
                                notificationsEnabled={notificationsEnabled}
                                showNotification={showNotification}
                            />
                            <AnalyticsTabs readings={readings} />
                            <ReportsTabs readings={readings} tokens={tokens} />
                            <AIInsightsTabs hasData={readings.length > 2} />
                            <AddTokenTabs
                                tokenUnits={tokenUnits}
                                tokenCost={tokenCost}
                                setTokenCost={(value) =>
                                    dispatch({
                                        type: "SET_TOKEN_COST",
                                        payload: value,
                                    })
                                }
                                setTokenUnits={(value) =>
                                    dispatch({
                                        type: "SET_TOKEN_UNITS",
                                        payload: value,
                                    })
                                }
                                handleAddToken={handleAddToken}
                                isSubmitting={isSubmitting}
                                tokens={tokens}
                            />
                            <BackdatedTabs
                                onSubmit={handleAddBackdatedReading}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
