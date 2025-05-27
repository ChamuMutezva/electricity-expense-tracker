/**
 * Displays an alert listing the periods for which readings were missed.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string[]} props.missedReadings - An array of period strings representing missed readings.
 * @returns {JSX.Element} An alert UI component highlighting missed readings and instructions to add them.
 */

import React from "react";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { History } from "lucide-react";

interface MissedReadingsProps {
    missedReadings: string[];
}

export default function MissedReadings({ missedReadings }: Readonly<MissedReadingsProps>) {
    return (
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle>Missed Readings</AlertTitle>
            <AlertDescription>
                <p>You missed the following readings today:</p>
                <ul className="list-disc list-inside mt-1">
                    {missedReadings.map((period) => (
                        <li key={period}>{period}</li>
                    ))}
                </ul>
                <p className="mt-2">
                    Use the &quot;Backdated Reading&quot; tab to add these
                    readings.
                </p>
            </AlertDescription>
        </Alert>
    );
}
