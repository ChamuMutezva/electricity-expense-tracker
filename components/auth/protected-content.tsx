"use client";

import type React from "react";

import { useUser } from "@stackframe/stack";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface ProtectedContentProps {
    children: ReactNode;
    message?: string;
    title?: string;
}

export function ProtectedContent({
    children,
    message,
    title,
}: Readonly<ProtectedContentProps>) {
    const user = useUser();

    if (!user) {
        return (
            <Card className="border-dashed">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>{title || "Authentication Required"}</CardTitle>
                    <CardDescription>
                        {message || "Please sign in to access this feature"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        Sign in to add readings, manage tokens, and track your
                        electricity usage.
                    </p>
                    <Button
                        onClick={() => {
                            window.location.href = "/handler/sign-in";
                        }}
                        className="w-full sm:w-auto"
                    >
                        Sign In to Continue
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return <>{children}</>;
}
