import { TabsContent } from "@radix-ui/react-tabs";
import { FileText } from "lucide-react";
import React from "react";
import MonthlyReport from "../monthly-report";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "../ui/card";
import { ElectricityReading, TokenPurchase } from "@/lib/types";

interface ReportsTabsProps {
    readings?: ElectricityReading[];
    tokens?: TokenPurchase[];
}

function ReportsTabs({
    readings = [],
    tokens = [],
}: Readonly<ReportsTabsProps>) {
    return (
        <TabsContent value="reports" className="mt-0">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        Monthly Reports
                    </CardTitle>
                    <CardDescription>
                        Generate and export detailed usage reports
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MonthlyReport readings={readings} tokens={tokens} />
                </CardContent>
            </Card>
        </TabsContent>
    );
}

export default ReportsTabs;
