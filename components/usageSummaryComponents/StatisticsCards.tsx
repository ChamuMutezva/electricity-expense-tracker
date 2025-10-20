import React from "react";
import { Card, CardContent } from "../ui/card";

function StatisticsCards({
    title,
    value,
    content,
}: Readonly<{ title: string; value: string; content: string }>) {
    return (
        <Card>
            <CardContent className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                    {title}
                </h4>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {content}
                </p>
            </CardContent>
        </Card>
    );
}

export default StatisticsCards;
