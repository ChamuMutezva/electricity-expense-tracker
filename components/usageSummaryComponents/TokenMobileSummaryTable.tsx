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

function TokenMobileSummaryTable({
    filteredTokens,
}: Readonly<{ filteredTokens: TokenMobileSummaryTableProps[] }>) {
    return (
        <div className="space-y-3 md:hidden">
            {filteredTokens.map((token) => (
                <div
                    key={token.token_id}
                    className="bg-card border rounded-lg p-4 shadow-sm"
                >
                    <div className="flex justify-between items-center mb-3 pb-2 border-b">
                        <span className="font-semibold">
                            {formatDate(token.timestamp)}
                        </span>
                        <span className="text-green-600 font-semibold">
                            +{token.units} kWh
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">
                                New Reading
                            </div>
                            <div className="font-medium">
                                {token.new_reading} kWh
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">
                                Total Cost
                            </div>
                            <div className="font-medium">
                                {token.total_cost
                                    ? `R ${token.total_cost.toFixed(2)}`
                                    : "-"}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TokenMobileSummaryTable;
