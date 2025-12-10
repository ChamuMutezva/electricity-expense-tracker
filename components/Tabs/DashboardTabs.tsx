import { TabsContent } from "@radix-ui/react-tabs";
import { Zap } from "lucide-react";
import React from "react";
import DashboardSummary from "../DashboardSummary";
import NotificationsAlert from "../NotificationsAlert";
import SmartAlerts from "../small-alerts";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "../ui/card";
import { UpdateMeterReading } from "../update-mete-reading";
import UpdateReminderNotification from "../UpdateReminderNotification";
import UsageSummary from "../usage-summary";
import WeatherUsageCorrelation from "../WeatherUsageCorelation";
import { ElectricityReading, TokenPurchase } from "@/lib/types";
// import { useElectricity } from "@/contexts/ElectricityContext";

type DashboardTabsProps = {
    readings?: ElectricityReading[];
    showNotification: boolean;
    tokens: TokenPurchase[];
    currentReading: string | number;
    setCurrentReading: (value: string) => void;
    handleAddReading: (forceUpdate?: boolean) => Promise<void>;
    isSubmitting: boolean;
    isSubmitted: boolean;
    enableNotifications: () => void;
    notificationsEnabled: boolean;
};

function DashboardTabs({
    readings = [],
    showNotification,
    tokens,
    currentReading,
    setCurrentReading,
    handleAddReading,
    enableNotifications,
    notificationsEnabled,
}: Readonly<DashboardTabsProps>) {
    return (
        <TabsContent value="dashboard" className="mt-0 space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Current Status
                    </CardTitle>
                    <CardDescription>
                        Real-time electricity monitoring and updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <UpdateMeterReading
                                currentReading={currentReading}
                                setCurrentReading={setCurrentReading}
                                handleAddReading={handleAddReading}
                            />
                            {!notificationsEnabled && (
                                <NotificationsAlert
                                    enableNotifications={enableNotifications}
                                />
                            )}
                        </div>
                        <DashboardSummary readings={readings} />
                        <WeatherUsageCorrelation />
                        {showNotification && <UpdateReminderNotification />}
                        <SmartAlerts readings={readings} tokens={tokens} />
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Usage Summary</CardTitle>
                    <CardDescription>
                        Overview of your electricity consumption patterns
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UsageSummary readings={readings} tokens={tokens} />
                </CardContent>
            </Card>
        </TabsContent>
    );
}

export default DashboardTabs;
