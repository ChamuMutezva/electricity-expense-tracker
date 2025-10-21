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
 * - Uses React Context API with useReducer for centralized state management.
 * - Handles both local storage and database-backed data, with seamless migration.
 * - Notifies users of missed readings and upcoming update times.
 * - Supports enabling/disabling browser notifications.
 * - Provides a tabbed interface for summary, charts, token entry, backdated readings, reports, and AI insights.
 * - Modular architecture with custom hooks for separated concerns.
 * 
 * Props:
 * @param {ElectricityReading[]} initialReadings - Initial list of electricity readings (from server or local storage).
 * @param {TokenPurchase[]} initialTokens - Initial list of token purchases (from server or local storage).
 * @param {number} initialLatestReading - The latest meter reading value.
 * @param {number} initialTotalUnits - The total units consumed (calculated from readings).
 * @param {boolean} dbConnected - Indicates if the app is connected to a backend database.
 *
 * Architecture:
 * - Uses ElectricityProvider context for state management with useReducer.
 * - Separates concerns into custom hooks for specific functionalities.
 * - Modular tab components for different sections of the application.
 * 
 * Context State:
 * - isLoading: Whether initial data is being loaded.
 * - isSubmitted: Tracks if the reading form has been submitted.
 * - isSubmitting: Whether a form submission is in progress.
 * - showMigrationAlert: Whether to show the migration alert for local data.
 * - showNotification: Whether to show the update reminder notification.
 * - activeTab: Currently active tab in the interface.
 * - missedReadings: List of missed reading periods for today.
 * - tokenUnits: Input value for token units.
 * - tokenCost: Input value for token cost.
 * - currentReading: Input value for the current reading.
 * - timeUntilUpdate: String representing time left until next update.
 * - tokens: List of all token purchases.
 * - totalUnits: Total units consumed (difference between first and last reading).
 * - latestReading: The most recent meter reading value.
 * - nextUpdate: Date/time of the next expected reading update.
 * - readings: List of all electricity readings.
 *
 * Custom Hooks:
 * - useElectricityStorage: Manages local storage operations and notification preferences.
 * - useElectricityNotifications: Handles browser notification permissions and display.
 * - useElectricityReadings: Manages reading operations (add, update, backdated).
 * - useElectricityTokens: Handles token purchase operations.
 * - useDataMigration: Manages data migration from local storage to database.
 * - useMissedReadings: Automatically detects and tracks missed reading periods.
 * - useTotalUnitsCalculation: Calculates total units consumed from readings.
 * 
 * UI Structure:
 * - LowBalanceNotification: Shows when electricity balance is low.
 * - Tabbed interface with Dashboard, Analytics, Reports, AI Insights, Add Token, and Backdated sections.
 * - Alert system for migration, missed readings, and update reminders.
 * - Responsive design with mobile-optimized tab navigation.
 *
 * Component Hierarchy:
 * - ElectricityProvider: Context provider for state management.
 * - ElectricityTrackerContent: Main component logic wrapped in context consumer.
 * - Modular Tab Components: DashboardTabs, AnalyticsTabs, ReportsTabs, AIInsightsTabs, AddTokenTabs, BackdatedTabs.
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

import {
    ElectricityProvider,
    useElectricity,
} from "@/contexts/ElectricityContext";
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
import { getTimeString } from "@/lib/date-utils";
import type { ElectricityTrackerProps } from "@/lib/types";
import UpdateReminderNotification from "./UpdateReminderNotification";
import { LowBalanceNotification } from "./low-balance-notification";
import { useElectricityStorage } from "@/hooks/use-local-storage";
import AnalyticsTabs from "./Tabs/AnalyticsTabs";
import ReportsTabs from "./Tabs/ReportsTabs";
import AIInsightsTabs from "./Tabs/AIInsightsTabs";
import AddTokenTabs from "./Tabs/AddTokenTabs";
import BackdatedTabs from "./Tabs/BackdatedTabs";
import DashboardTabs from "./Tabs/DashboardTabs";
import { useDataMigration } from "@/hooks/use-data-migration";
import { useElectricityNotifications } from "@/hooks/use-electricity-notifications";
import { useElectricityReadings } from "@/hooks/use-electricity-readings";
import { useElectricityTokens } from "@/hooks/use-electricity-tokens";
import { useMissedReadings } from "@/hooks/use-missed-readings";
import { useTotalUnitsCalculation } from "@/hooks/use-total-units-calculation";
import { ElectricityLoading } from "./electricity-loading";

function ElectricityTrackerContent({
    dbConnected,
}: Readonly<{ dbConnected: boolean }>) {
    const { state, dispatch } = useElectricity();
    const {
        notificationsEnabled,
        setNotificationsEnabled,
        clearElectricityData,
    } = useElectricityStorage(dbConnected);

    // Use custom hooks for separated concerns
    const { enableNotifications } =
        useElectricityNotifications(notificationsEnabled);
    const { handleAddReading, handleAddBackdatedReading } =
        useElectricityReadings(dbConnected);
    const { handleAddToken } = useElectricityTokens(dbConnected);
    const { handleMigrateData } = useDataMigration(
        dbConnected,
        clearElectricityData
    );

    // Auto-calculated hooks
    useMissedReadings();
    useTotalUnitsCalculation(dbConnected);

    const handleEnableNotifications = async () => {
        const granted = await enableNotifications();
        if (granted) {
            setNotificationsEnabled(true);
        }
    };

    const handleBuyTokens = () => {
        dispatch({ type: "SET_ACTIVE_TAB", payload: "token" });
    };

    if (state.isLoading) {
        return <ElectricityLoading />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <LowBalanceNotification
                currentBalance={state.latestReading}
                onBuyTokens={handleBuyTokens}
            />

            <div className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-start flex-col justify-between mb-4">
                        <h2 className="text-base font-bold md:text-2xl text-foreground mt-1">
                            Monitor and manage your electricity consumption
                        </h2>
                        <p className="text-sm text-foreground/70">
                            Prepaid Model
                        </p>
                    </div>

                    <Tabs
                        value={state.activeTab}
                        onValueChange={(value) =>
                            dispatch({ type: "SET_ACTIVE_TAB", payload: value })
                        }
                        className="w-full"
                    >
                        <TabsList className="w-full justify-between h-auto p-1 bg-slate-100 dark:bg-slate-900">
                            <TabsTrigger
                                value="dashboard"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <Home className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    Dashboard
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <TrendingUp className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    Analytics
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="reports"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    Reports
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="ai-insights"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <Brain className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    AI Insights
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="token"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    Add Token
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="backdated"
                                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                            >
                                <CalendarClock className="h-4 w-4" />
                                <span className="hidden md:inline">
                                    Backdated
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="container mx-auto px-0 py-6">
                            {/* Alerts Section */}
                            <div className="space-y-4 mb-6">
                                {state.showMigrationAlert && (
                                    <MigrationAlert
                                        handleMigrateData={handleMigrateData}
                                        isSubmitting={state.isSubmitting}
                                        setShowMigrationAlert={() =>
                                            dispatch({
                                                type: "SET_SHOW_MIGRATION_ALERT",
                                                payload: false,
                                            })
                                        }
                                    />
                                )}
                                {state.missedReadings.length > 0 && (
                                    <MissedReadings
                                        missedReadings={state.missedReadings}
                                    />
                                )}
                                {state.showNotification && (
                                    <UpdateReminderNotification />
                                )}
                            </div>

                            <DashboardTabs
                                latestReading={state.latestReading}
                                totalUnits={state.totalUnits}
                                nextUpdate={state.nextUpdate}
                                getTimeString={getTimeString}
                                timeUntilUpdate={state.timeUntilUpdate}
                                readings={state.readings}
                                tokens={state.tokens}
                                currentReading={state.currentReading}
                                setCurrentReading={(value) =>
                                    dispatch({
                                        type: "SET_CURRENT_READING",
                                        payload: value,
                                    })
                                }
                                handleAddReading={handleAddReading}
                                isSubmitting={state.isSubmitting}
                                isSubmitted={state.isSubmitted}
                                enableNotifications={handleEnableNotifications}
                                notificationsEnabled={notificationsEnabled}
                                showNotification={state.showNotification}
                            />
                            <AnalyticsTabs readings={state.readings} />
                            <ReportsTabs
                                readings={state.readings}
                                tokens={state.tokens}
                            />
                            <AIInsightsTabs
                                hasData={state.readings.length > 2}
                            />
                            <AddTokenTabs
                                tokenUnits={state.tokenUnits}
                                tokenCost={state.tokenCost}
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
                                isSubmitting={state.isSubmitting}
                                tokens={state.tokens}
                            />
                            <BackdatedTabs
                                onSubmit={handleAddBackdatedReading}
                                isSubmitting={state.isSubmitting}
                            />
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

export default function ElectricityTracker(
    props: Readonly<ElectricityTrackerProps>
) {
    return (
        <ElectricityProvider
            initialReadings={props.initialReadings}
            initialTokens={props.initialTokens}
            initialLatestReading={props.initialLatestReading}
            initialTotalUnits={props.initialTotalUnits}
            dbConnected={props.dbConnected}
        >
            <ElectricityTrackerContent dbConnected={props.dbConnected} />
        </ElectricityProvider>
    );
}
