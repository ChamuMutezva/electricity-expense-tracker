/**
 * Displays a summary dashboard with the latest electricity reading, total units used, and the next update time.
 *
 * @component
 * @param latestReading - The most recent electricity meter reading in kWh.
 * @param totalUnits - The total units of electricity used, as a number.
 * @param nextUpdate - (Optional) The Date object representing the next scheduled update.
 * @param getTimeString - A function that formats a Date object into a display string.
 * @param timeUntilUpdate - A string describing the time remaining until the next update.
 */
import React from "react";

type DashboardSummaryProps = {
    latestReading: number;
    totalUnits: number;
    nextUpdate?: Date | null;
    getTimeString: (date: Date) => string;
    timeUntilUpdate: string;
};

export default function DashboardSummary({
    latestReading,
    totalUnits,
    nextUpdate,
    getTimeString,
    timeUntilUpdate,
}: Readonly<DashboardSummaryProps>) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                    Latest Reading
                </h3>
                <p className="text-2xl font-bold">{latestReading} kWh</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Total Units Used
                </h3>
                <p className="text-2xl font-bold">
                    {totalUnits.toFixed(2)} kWh
                </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Next Update
                </h3>
                <p className="text-2xl font-bold">
                    {nextUpdate ? getTimeString(nextUpdate) : "--:--"}
                </p>
                <p className="text-sm">In {timeUntilUpdate}</p>
            </div>
        </div>
    );
}
