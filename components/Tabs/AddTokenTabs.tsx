import { TabsContent } from "@radix-ui/react-tabs";
import { Plus } from "lucide-react";
import React from "react";
import AddToken from "../add-token";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "../ui/card";
type AddTokenProps = {
    tokenUnits: string | number;
    tokenCost: string | number;
    setTokenCost: (value: string) => void;
    setTokenUnits: (value: string) => void;
    handleAddToken: () => void;
    isSubmitting: boolean;
    tokens: Array<{
        token_id: string | number;
        timestamp: Date;
        units: number;
        new_reading: number;
        total_cost?: number;
    }>;
};

function AddTokenTabs({
    tokenUnits,
    tokenCost,
    setTokenCost,
    setTokenUnits,
    handleAddToken,
    isSubmitting,
    tokens,
}: Readonly<AddTokenProps>) {
    return (
        <TabsContent value="token" className="mt-0">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-purple-500" />
                        Add Electricity Token
                    </CardTitle>
                    <CardDescription>
                        Record purchased electricity units
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddToken
                        tokenUnits={tokenUnits}
                        tokenCost={tokenCost}
                        setTokenCost={setTokenCost}
                        setTokenUnits={setTokenUnits}
                        handleAddToken={handleAddToken}
                        isSubmitting={isSubmitting}
                        tokens={tokens}
                    />
                </CardContent>
            </Card>
        </TabsContent>
    );
}

export default AddTokenTabs;
