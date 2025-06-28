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

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MigrationAlert from "@/components/migration-alert";
import MissedReadings from "@/components/missed-readings";
import { Zap, BarChart3, CalendarClock, Brain } from "lucide-react";
import UsageSummary from "@/components/usage-summary";
import UsageChart from "@/components/usage-chart";
import MonthlyReport from "@/components/monthly-report";
import BackdatedReadingForm from "@/components/backdated-reading-form";
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
} from "@/actions/electricity-actions";
import { useToast } from "@/hooks/use-toast";
import AddToken from "./add-token";
import { UpdateMeterReading } from "./update-mete-reading";
import NotificationsAlert from "./NotificationsAlert";
import {
    parseLocalStorageReadings,
    parseLocalStorageTokens,
} from "@/lib/storage";
import UpdateReminderNotification from "./UpdateReminderNotification";
import DashboardSummary from "./DashboardSummary";
import AIInsights from "./ai-insights";
import { Button } from "./ui/button";
import WeatherUsageCorrelation from "./WeatherUsageCorelation";

export default function ElectricityTracker({
    initialReadings,
    initialTokens,
    initialLatestReading,
    initialTotalUnits,
    dbConnected,
}: Readonly<ElectricityTrackerProps>) {
    const [readings, setReadings] =
        useState<ElectricityReading[]>(initialReadings);
    const [tokens, setTokens] = useState<TokenPurchase[]>(initialTokens);
    const [currentReading, setCurrentReading] = useState("");
    const [tokenUnits, setTokenUnits] = useState("");
    const [tokenCost, setTokenCost] = useState("");
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
    const [timeUntilUpdate, setTimeUntilUpdate] = useState<string>("");
    const [showNotification, setShowNotification] = useState(false);
    const [latestReading, setLatestReading] = useState(initialLatestReading);
    const [totalUnits, setTotalUnits] = useState(initialTotalUnits);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMigrationAlert, setShowMigrationAlert] = useState(false);
    const [missedReadings, setMissedReadings] = useState<string[]>([]);
    // Add state for submission tracking
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    function setupNotifications(
        setNotificationsEnabled: (enabled: boolean) => void
    ) {
        const notifEnabled =
            localStorage.getItem("notificationsEnabled") === "true";
        setNotificationsEnabled(notifEnabled);
        if (notifEnabled && "Notification" in window) {
            Notification.requestPermission();
        }
    }

    function checkMigration(
        dbConnected: boolean,
        setShowMigrationAlert: (show: boolean) => void
    ) {
        if (dbConnected) {
            const savedReadings = localStorage.getItem("electricityReadings");
            const savedTokens = localStorage.getItem("electricityTokens");
            if (savedReadings || savedTokens) {
                setShowMigrationAlert(true);
            }
        }
    }

    // Check for local storage data on component mount
    useEffect(() => {
        if (!dbConnected) {
            setReadings(
                parseLocalStorageReadings(
                    localStorage.getItem("electricityReadings")
                )
            );
            setTokens(
                parseLocalStorageTokens(
                    localStorage.getItem("electricityTokens")
                )
            );
        } else {
            checkMigration(dbConnected, setShowMigrationAlert);
        }
        setupNotifications(setNotificationsEnabled);
    }, [dbConnected]);

    // Save readings to localStorage if database is not connected
    useEffect(() => {
        if (!dbConnected) {
            localStorage.setItem(
                "electricityReadings",
                JSON.stringify(readings)
            );
        }
    }, [readings, dbConnected]);

    // Save tokens to localStorage if database is not connected
    useEffect(() => {
        if (!dbConnected) {
            localStorage.setItem("electricityTokens", JSON.stringify(tokens));
        }
    }, [tokens, dbConnected]);

    // Save notification preference
    useEffect(() => {
        localStorage.setItem(
            "notificationsEnabled",
            notificationsEnabled.toString()
        );
    }, [notificationsEnabled]);

    // Calculate next update time and set timer
    useEffect(() => {
        const next = getNextUpdateTime();
        setNextUpdate(next);

        const interval = setInterval(() => {
            const now = new Date();
            const next = getNextUpdateTime();
            setNextUpdate(next);

            // Calculate time until next update
            const diffMs = next.getTime() - now.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;

            setTimeUntilUpdate(`${diffHours}h ${remainingMins}m`);

            // Show notification 5 minutes before update time
            if (notificationsEnabled && diffMins <= 5 && diffMins > 0) {
                const period = getPeriodFromHour(next.getHours());
                showUpdateNotification(period);
                setShowNotification(true);
            } else {
                setShowNotification(false);
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

            setMissedReadings(missed);
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
        setIsSubmitted(true);

        // Validate input
        if (!currentReading || isNaN(Number(currentReading))) {
            toast({
                title: "❌ Invalid Input",
                description: "Please enter a valid meter reading",
                variant: "destructive",
            });
            setIsSubmitted(false);
            return;
        }

        try {
            setIsSubmitting(true);
            const readingValue = Number(currentReading);

            // Additional validation if needed
            if (readingValue <= 0) {
                toast({
                    title: "❌ Invalid Reading",
                    description: "Reading must be greater than 0",
                    variant: "destructive",
                });
                setIsSubmitted(false);
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
                    // Update existing reading in state
                    setReadings((prev) =>
                        prev.map((r) =>
                            r.reading_id === result.reading.reading_id
                                ? result.reading
                                : r
                        )
                    );
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
                    setReadings((prev) => [...prev, result.reading]);
                    toast({
                        title: "✅ Reading Added Successfully!",
                        description: `New reading of ${readingValue} kWh has been recorded.`,
                        className:
                            "border-green-500 bg-green-50 text-green-800",
                    });
                }

                setLatestReading(readingValue);
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
                    setReadings(updatedReadings);
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
                    setReadings((prev) => [...prev, newReading]);
                    toast({
                        title: "✅ Reading Added Successfully!",
                        description: `New reading of ${readingValue} kWh has been recorded.`,
                        className: "border-blue-500 bg-blue-50 text-blue-800",
                    });
                }

                setLatestReading(readingValue);
            }

            setCurrentReading("");
            setIsSubmitted(false); // Reset submission state after success
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
            setIsSubmitting(false);
        }
    };

    // Add a backdated reading
    const handleAddBackdatedReading = async (
        readingData: Omit<ElectricityReading, "id" | "reading_id">
    ) => {
        try {
            setIsSubmitting(true);

            if (dbConnected) {
                // Use server action if database is connected
                const newReading = await addBackdatedReading(readingData);

                // Update local state
                setReadings((prev) => [...prev, newReading]);

                // Update latest reading if this is the most recent
                const now = new Date();
                if (readingData.timestamp > now) {
                    setLatestReading(Number(readingData.reading));
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

                setReadings((prev) => [...prev, newReading]);

                // Update latest reading if this is the most recent
                const now = new Date();
                if (readingData.timestamp > now) {
                    setLatestReading(Number(readingData.reading));
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
            setIsSubmitting(false);
        }
    };

    // Add a new token purchase - with fallback to local storage
    const handleAddToken = async () => {
        if (!tokenUnits || isNaN(Number(tokenUnits))) return;
        if (!tokenCost || isNaN(Number(tokenCost))) return;

        try {
            setIsSubmitting(true);

            if (dbConnected) {
                // Use server action if database is connected
                const newToken = await addTokenPurchase(
                    Number(tokenUnits),
                    Number(tokenCost)
                );

                // Update local state
                setTokens((prev) => [...prev, newToken]);
                setLatestReading(Number(newToken.new_reading));
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
                setTokens((prev) => [...prev, newToken]);

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
                setReadings((prev) => [...prev, newReadingEntry]);
                setLatestReading(calculatedNewReading);
            }

            setTokenUnits("");
            setTokenCost("");

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
            setIsSubmitting(false);
        }
    };

    // Migrate data from local storage to database
    const handleMigrateData = async () => {
        try {
            const savedReadings = localStorage.getItem("electricityReadings");
            const savedTokens = localStorage.getItem("electricityTokens");

            if (!savedReadings && !savedTokens) {
                setShowMigrationAlert(false);
                return;
            }

            setIsSubmitting(true);

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
                    // Clear local storage after successful migration
                    localStorage.removeItem("electricityReadings");
                    localStorage.removeItem("electricityTokens");

                    setShowMigrationAlert(false);

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
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const calculateTotalUnits = (): number => {
            if (readings.length < 2) return 0;

            // Sort readings by timestamp, ensuring timestamps are Date objects
            const sortedReadings = [...readings].sort((a, b) => {
                const timestampA =
                    a.timestamp instanceof Date
                        ? a.timestamp
                        : new Date(a.timestamp);
                const timestampB =
                    b.timestamp instanceof Date
                        ? b.timestamp
                        : new Date(b.timestamp);
                return timestampA.getTime() - timestampB.getTime();
            });
            console.log("Sorted Readings:", sortedReadings);

            // Calculate difference between first and last reading
            return (
                Number(sortedReadings[0].reading) -
                Number(sortedReadings[sortedReadings.length - 1].reading)
            );
        };

        setTotalUnits(calculateTotalUnits());
    }, [readings]);

    return (
        <div className="grid gap-6">
            {/* Migration alert */}
            {showMigrationAlert && (
                <MigrationAlert
                    handleMigrateData={handleMigrateData}
                    isSubmitting={isSubmitting}
                    setShowMigrationAlert={setShowMigrationAlert}
                />
            )}

            {/* Missed Readings Alert */}
            {missedReadings.length > 0 && (
                <MissedReadings missedReadings={missedReadings} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <h2>Current Electricity Status</h2>
                    </CardTitle>
                    <CardDescription>
                        Track and update your electricity meter readings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        <DashboardSummary
                            latestReading={latestReading}
                            totalUnits={totalUnits}
                            nextUpdate={nextUpdate}
                            getTimeString={getTimeString}
                            timeUntilUpdate={timeUntilUpdate}
                            readings={readings}
                        />
                        <WeatherUsageCorrelation />
                        {showNotification && <UpdateReminderNotification />}

                        <div className="grid gap-4">
                            <UpdateMeterReading
                                currentReading={currentReading}
                                setCurrentReading={setCurrentReading}
                                handleAddReading={handleAddReading}
                                isSubmitting={isSubmitting}
                                isSubmitted={isSubmitted}
                            />
                            {!notificationsEnabled && (
                                <NotificationsAlert
                                    enableNotifications={enableNotifications}
                                />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="summary">
                <TabsList className="grid h-auto grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                    <TabsTrigger
                        value="summary"
                        className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                    >
                        Usage Summary
                    </TabsTrigger>
                    <TabsTrigger
                        value="chart"
                        className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                    >
                        Usage Chart
                    </TabsTrigger>
                    <TabsTrigger
                        value="token"
                        className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                    >
                        Add Token
                    </TabsTrigger>
                    <TabsTrigger
                        value="backdated"
                        className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                    >
                        <span className="flex items-center gap-1">
                            <CalendarClock className="h-4 w-4" />
                            <span>Backdated</span>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="reports"
                        className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                    >
                        Reports
                    </TabsTrigger>
                    <TabsTrigger
                        value="ai-insights"
                        className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                    >
                        <span className="flex items-center gap-1">
                            <Brain className="h-4 w-4" />
                            <span>AI Insights</span>
                        </span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="summary">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Summary</CardTitle>
                            <CardDescription>
                                View your electricity usage patterns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsageSummary readings={readings} tokens={tokens} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="chart">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Chart</CardTitle>
                            <CardDescription>
                                Visualize your electricity consumption
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsageChart readings={readings} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="token">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Electricity Token</CardTitle>
                            <CardDescription>
                                Enter units from purchased electricity token
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddToken
                                tokenUnits={tokenUnits}
                                tokenCost={tokenCost}
                                setTokenCost={setTokenCost}
                                setTokenUnits={setTokenUnits}
                                handleAddToken={handleAddToken}
                                isSubmitting={isSubmitting}
                                tokens={tokens}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="backdated">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarClock className="h-5 w-5 text-blue-500" />
                                Add Backdated Reading
                            </CardTitle>
                            <CardDescription>
                                Record a reading for a specific date and time
                                (e.g., missed readings)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BackdatedReadingForm
                                onSubmit={handleAddBackdatedReading}
                                isSubmitting={isSubmitting}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-green-500" />
                                Monthly Reports
                            </CardTitle>
                            <CardDescription>
                                View detailed monthly usage reports
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MonthlyReport readings={readings} tokens={tokens} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="ai-insights">
                    <AIInsights hasData={readings.length > 2} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
