import React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationsAlertProps {
    enableNotifications: () => void;
}

export default function NotificationsAlert({
    enableNotifications,
}: Readonly<NotificationsAlertProps>) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-slate-500" />
                <span>Enable notifications for update reminders</span>
            </div>
            <Button
                variant="outline"
                onClick={enableNotifications}
                className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
            >
                Enable
            </Button>
        </div>
    );
}
