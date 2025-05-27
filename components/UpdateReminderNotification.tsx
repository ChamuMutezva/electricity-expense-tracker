/**
 * Displays a notification alert reminding the user to update their electricity reading.
 *
 * This component renders a styled alert box with an icon, title, and description,
 * indicating that it is almost time for the user to update their electricity usage data.
 *
 * @returns {JSX.Element} The rendered update reminder notification alert component.
 */
import React from "react";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Bell } from "lucide-react";

export default function UpdateReminderNotification() {
    return (
        <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle>Update Reminder</AlertTitle>
            <AlertDescription>
                It&apos;s almost time for your electricity reading update!
            </AlertDescription>
        </Alert>
    );
}
