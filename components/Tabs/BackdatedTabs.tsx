import { TabsContent } from "@radix-ui/react-tabs";
import { CalendarClock } from "lucide-react";
import React from "react";
import BackdatedReadingForm from "../backdated-reading-form";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "../ui/card";
import { ElectricityReading } from "@/lib/types";

interface BackdatedTabsProps {
    onSubmit: (
        reading: Omit<ElectricityReading, "id" | "reading_id">
    ) => Promise<void>;
    isSubmitting: boolean;
}

function BackdatedTabs({
    onSubmit,
    isSubmitting,
}: Readonly<BackdatedTabsProps>) {
    return (
        <TabsContent value="backdated" className="mt-0">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-blue-500" />
                        Add Backdated Reading
                    </CardTitle>
                    <CardDescription>
                        Record readings for past dates and times
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BackdatedReadingForm
                        onSubmit={onSubmit}
                        isSubmitting={isSubmitting}
                    />
                </CardContent>
            </Card>
        </TabsContent>
    );
}

export default BackdatedTabs;
