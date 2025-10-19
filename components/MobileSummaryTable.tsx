import React from "react";
import { formatDate } from "@/lib/date-utils";
import { Zap } from "lucide-react";

interface MobileSummaryTableProps {
    date: string;
    morning?: number;
    evening?: number;
    night?: number;
    total: number;
}

function MobileSummaryTable({
    data,
}: Readonly<{ data: MobileSummaryTableProps[] }>) {
    return (
        <div className="space-y-3 md:hidden">
            {data.map((day) => (
                <div
                    key={day.date}
                    className="bg-white border rounded-lg p-4 shadow-sm"
                >
                    <div className="flex justify-between items-center mb-3 pb-2 border-b">
                        <span className="font-semibold">
                            {formatDate(new Date(day.date))}
                        </span>
                        <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">
                                {day.total?.toFixed(2) || "0.00"} kWh
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-blue-600 font-medium">
                                {day.morning !== undefined
                                    ? `${day.morning} kWh`
                                    : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Morning
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-orange-600 font-medium">
                                {day.evening !== undefined
                                    ? `${day.evening} kWh`
                                    : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Evening
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-purple-600 font-medium">
                                {day.night !== undefined
                                    ? `${day.night} kWh`
                                    : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Night
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MobileSummaryTable;
