import { Database } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

interface MigrationAlertProps {
    handleMigrateData: () => void;
    isSubmitting: boolean;
    setShowMigrationAlert: (show: boolean) => void;
}

export default function MigrationAlert({
    handleMigrateData,
    isSubmitting,
    setShowMigrationAlert,
}: Readonly<MigrationAlertProps>) {
    return (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle>Local Data Detected</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
                <p>
                    We found electricity data stored in your browser. Would you
                    like to migrate it to the database?
                </p>
                <div className="flex gap-2 mt-2">
                    <Button
                        size="sm"
                        onClick={handleMigrateData}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Migrating..." : "Migrate Data"}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowMigrationAlert(false)}
                    >
                        Dismiss
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}
