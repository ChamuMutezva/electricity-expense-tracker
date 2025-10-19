/**
 * AddToken component allows users to input and add new electricity tokens,
 * displaying a form for entering token units and cost, and a table listing
 * the history of added tokens.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string | number} props.tokenUnits - The current value for the token units input field.
 * @param {string | number} props.tokenCost - The current value for the token cost input field.
 * @param {(value: string) => void} props.setTokenCost - Callback to update the token cost value.
 * @param {(value: string) => void} props.setTokenUnits - Callback to update the token units value.
 * @param {() => void} props.handleAddToken - Handler function to add a new token entry.
 * @param {boolean} props.isSubmitting - Indicates if a token is currently being added (disables the button).
 * @param {Array<{
 *   token_id: string | number;
 *   timestamp: Date;
 *   units: number;
 *   new_reading: number;
 *   total_cost?: number;
 * }>} props.tokens - Array of token objects representing the token history.
 *
 * @returns {JSX.Element} The rendered AddToken component.
 */

import React from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { formatDate } from "@/lib/date-utils";
import { useMediaQuery } from "react-responsive";
import TokenMobileSummaryTable from "./TokenMobileSummaryTable";

type AddTokenProps = {
    tokenUnits: string | number;
    tokenCost: string | number;
    setTokenCost: (value: string) => void;
    setTokenUnits: (value: string) => void;
    handleAddToken: () => void;
    isSubmitting: boolean;
    tokens: Array<{
        id: number;
        token_id: string | number;
        timestamp: Date;
        units: number;
        new_reading: number;
        total_cost?: number;
    }>;
};

export default function AddToken({
    tokenUnits,
    tokenCost,
    setTokenCost,
    setTokenUnits,
    handleAddToken,
    isSubmitting,
    tokens,
}: Readonly<AddTokenProps>) {
     const isMobile = useMediaQuery({ maxWidth: 768 });
    return (
        <div className="grid gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 space-y-1.5">
                <div className="flex flex-1 flex-col space-y-1.5">
                    <Label htmlFor="tokenUnits">Token Units</Label>
                    <Input
                        required
                        id="tokenUnits"
                        placeholder="Enter units from token"
                        value={tokenUnits}
                        onChange={(e) => setTokenUnits(e.target.value)}
                        type="number"
                        step="0.01"
                    />
                </div>
                <div className="flex flex-1 flex-col space-y-1.5">
                    <Label htmlFor="tokenCost">Token Cost</Label>
                    <Input
                        required
                        id="tokenCost"
                        placeholder="Enter cost of token"
                        value={tokenCost}
                        onChange={(e) => setTokenCost(e.target.value)}
                        type="number"
                        step="0.01"
                    />
                </div>
                <Button
                    className="sm:self-end hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                    onClick={handleAddToken}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Adding..." : "Add Token"}
                </Button>
            </div>
            <div className="border rounded-lg overflow-hidden mt-4">
                <div className="max-h-[300px] overflow-y-auto">
                    {isMobile ? (
                        <TokenMobileSummaryTable filteredTokens={tokens} />
                    ) : (
                        <table className="w-full">
                            {/* Table Header */}
                            <thead className="sticky top-0 bg-muted z-10">
                                <tr className="text-left">
                                    <th className="p-3 text-sm font-medium">
                                        Date
                                    </th>
                                    <th className="p-3 text-sm font-medium">
                                        Units Added
                                    </th>
                                    <th className="p-3 text-sm font-medium">
                                        New Reading
                                    </th>
                                    <th className="p-3 text-sm font-medium">
                                        Total Cost
                                    </th>
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody className="divide-y">
                                {tokens.length > 0 ? (
                                    tokens.map((token) => (
                                        <tr
                                            key={token.token_id}
                                            className="hover:bg-muted/20"
                                        >
                                            <td className="p-3 text-sm">
                                                {formatDate(token.timestamp)}
                                            </td>
                                            <td className="p-3 text-sm">
                                                {token.units} kWh
                                            </td>
                                            <td className="p-3 text-sm">
                                                {token.new_reading} kWh
                                            </td>
                                            <td className="p-3 text-sm">
                                                $
                                                {token.total_cost?.toFixed(2) ??
                                                    "N/A"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="p-3 text-center text-muted-foreground"
                                        >
                                            No token history available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
