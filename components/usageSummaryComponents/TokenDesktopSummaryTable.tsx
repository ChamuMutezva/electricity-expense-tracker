import React from "react";
import { formatDate } from "@/lib/date-utils";

interface TokenMobileSummaryTableProps {
    id: number;
    token_id: number | string;
    timestamp: Date;
    units: number;
    new_reading: number;
    created_at?: Date;
    total_cost?: number;
}

function TokenDesktopSummaryTable({
    filteredTokens,
}: Readonly<{ filteredTokens: TokenMobileSummaryTableProps[] }>) {
    return (
        <table className="w-full">
            {/* Header */}
            <thead className="sticky top-0 z-10">
                <tr className="bg-muted text-sm font-medium">
                    <th className="p-3 text-left min-w-[100px]">Date</th>
                    <th className="p-3 text-left min-w-[100px]">Units Added</th>
                    <th className="p-3 text-left min-w-[100px]">New Reading</th>
                    <th className="p-3 text-left min-w-[80px]">Total Cost</th>
                </tr>
            </thead>

            {/* Body */}
            <tbody>
                {filteredTokens.map((token) => (
                    <tr
                        key={token.token_id}
                        className="border-t text-sm hover:bg-muted/50 transition-colors"
                    >
                        <td className="p-3">{formatDate(token.timestamp)}</td>
                        <td className="p-3">
                            <span className="text-green-600 font-semibold">
                                +{token.units} kWh
                            </span>
                        </td>
                        <td className="p-3 font-medium">
                            {token.new_reading} kWh
                        </td>
                        <td className="p-3">
                            {token.total_cost
                                ? `R ${token.total_cost.toFixed(2)}`
                                : "-"}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default TokenDesktopSummaryTable;
