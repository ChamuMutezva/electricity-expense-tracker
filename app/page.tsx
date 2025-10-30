/**
 * HomePage is the main entry point for the Electricity Expense Tracker application.
 *
 * This Next.js page component is responsible for:
 * - Setting the page metadata (title and description).
 * - Checking the database connection status.
 * - Fetching initial electricity readings, token purchases, latest reading, and total units used from the database if connected.
 * - Displaying an alert if the database is not connected, with a fallback to local storage mode.
 * - Rendering the main ElectricityTracker component with the fetched or default data.
 * - Providing a theme toggle for light/dark mode.
 *
 * @returns {Promise<JSX.Element>} The rendered home page component.
 */
import type { Metadata } from "next";
import ElectricityTracker from "@/components/electricity-tracker";
import {
    getElectricityReadings,
    getTokenPurchases,
    getLatestReading,
    getTotalUnitsUsed,
} from "@/actions/electricity-actions";
import { isDatabaseConnected } from "@/lib/db";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Database } from "lucide-react";
import { ElectricityReading, TokenPurchase } from "@/lib/types";
import { stackServerApp } from "@/stack/server";
import { getUserProfile } from "@/actions/user-profile-actions";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
    title: "Electricity Expense Tracker",
    description: "Track your daily electricity usage and expenses",
};

export default async function HomePage() {
    const dbConnected = isDatabaseConnected();
    const user = await stackServerApp.getUser();

    // Default values in case database is not connected
    let readings: ElectricityReading[] = [];
    let tokens: TokenPurchase[] = [];
    let latestReading = 0;
    let totalUnits = 0;
    let userProfile = null;
    let showMeterDialog = false;

    // Only try to fetch data if database is connected
    if (dbConnected && user) {
        try {
            // Fetch initial data from the database
            readings = await getElectricityReadings();
            tokens = await getTokenPurchases();
            latestReading = await getLatestReading();
            totalUnits = await getTotalUnitsUsed();
            userProfile = await getUserProfile();
            showMeterDialog = !userProfile?.meter_number;
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    }

    return (
        <>
            <header className="container mx-auto pt-8 px-4">
                <AppHeader
                    meterNumber={userProfile?.meter_number}
                    showMeterDialog={showMeterDialog}
                />
            </header>
            <main className="container mx-auto py-8 px-4">
                <div>
                    {!dbConnected && (
                        <Alert className="mb-6 bg-warning-accent border-warning-border text-warning-foreground">
                            <Database className="h-4 w-4 text-warning" />
                            <AlertTitle>Database Connection Issue</AlertTitle>
                            <AlertDescription>
                                <p className="mb-2">
                                    The application cannot connect to the
                                    database. Please make sure your DATABASE_URL
                                    environment variable is set correctly.
                                </p>
                                <p className="text-sm">
                                    The app will run in local storage mode until
                                    the database connection is established.
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <ElectricityTracker
                    initialReadings={readings}
                    initialTokens={tokens}
                    initialLatestReading={latestReading}
                    initialTotalUnits={totalUnits}
                    dbConnected={dbConnected}
                />
            </main>
        </>
    );
}
