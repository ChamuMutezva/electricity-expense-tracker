import React from "react";
import { formatDate } from "@/lib/date-utils";
import { Zap } from "lucide-react";

interface DesktopSummaryTableProps {
    date: string;
    morning?: number;
    evening?: number;
    night?: number;
    total: number;
}

function DesktopSummaryTable({
    data,
}: Readonly<{ data: DesktopSummaryTableProps[] }>) {
    return (
        <div className="relative overflow-auto max-h-[500px]">
            <table className="w-full">
                {/* Header */}
                <thead className="sticky top-0 z-10">
                    <tr className="bg-muted text-sm font-medium border-b">
                        <th className="p-3 text-left min-w-[100px]">Date</th>
                        <th className="p-3 text-left min-w-[80px]">Morning</th>
                        <th className="p-3 text-left min-w-[80px]">Evening</th>
                        <th className="p-3 text-left min-w-[80px]">Night</th>
                        <th className="p-3 text-left min-w-[100px]">
                            Total Usage
                        </th>
                    </tr>
                </thead>

                {/* Body */}
                <tbody>
                    {data.length > 0 ? (
                        data.map((day) => (
                            <tr
                                key={day.date}
                                className="border-t text-sm hover:bg-muted/50 transition-colors"
                            >
                                <td className="p-3 font-medium">
                                    {formatDate(new Date(day.date))}
                                </td>
                                <td className="p-3">
                                    {day.morning !== undefined ? (
                                        <span className="text-blue-600 font-medium">
                                            {day.morning} kWh
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            -
                                        </span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {day.evening !== undefined ? (
                                        <span className="text-orange-600 font-medium">
                                            {day.evening} kWh
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            -
                                        </span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {day.night !== undefined ? (
                                        <span className="text-purple-600 font-medium">
                                            {day.night} kWh
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            -
                                        </span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1">
                                        <Zap className="h-4 w-4 text-yellow-500" />
                                        <span className="font-bold">
                                            {day.total?.toFixed(2) || "0.00"}{" "}
                                            kWh
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={5}
                                className="p-8 text-center text-muted-foreground"
                            >
                                No data available for selected period
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DesktopSummaryTable;
