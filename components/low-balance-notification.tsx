"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Zap, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type LowBalanceNotificationProps = {
    currentBalance: number;
    onBuyTokens: () => void;
};

export function LowBalanceNotification({
    currentBalance,
    onBuyTokens,
}: Readonly<LowBalanceNotificationProps>) {
    const [isDismissed, setIsDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Determine urgency level
    const getUrgencyLevel = (balance: number) => {
        if (balance < 20) return "critical";
        if (balance < 30) return "warning";
        if (balance < 50) return "notice";
        return "none";
    };

    const urgencyLevel = getUrgencyLevel(currentBalance);
    const shouldShow = urgencyLevel !== "none" && !isDismissed;

    // Auto-show when balance drops, auto-hide when balance recovers
    useEffect(() => {
        if (currentBalance >= 60) {
            setIsDismissed(false); // Reset dismissal when balance recovers
            setIsVisible(false);
        } else if (shouldShow) {
            setIsVisible(true);
        }
    }, [currentBalance, shouldShow]);

    // Don't allow dismissal of critical alerts
    const canDismiss = urgencyLevel !== "critical";

    const handleDismiss = () => {
        if (canDismiss) {
            setIsDismissed(true);
            setIsVisible(false);
        }
    };

    const handleBuyTokens = () => {
        onBuyTokens();
        if (canDismiss) {
            setIsDismissed(true);
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    const getAlertStyles = () => {
        switch (urgencyLevel) {
            case "critical":
                return "border-red-500 bg-red-50 dark:bg-red-950 animate-pulse";
            case "warning":
                return "border-orange-500 bg-orange-50 dark:bg-orange-950";
            case "notice":
                return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
            default:
                return "";
        }
    };

    const getIconColor = () => {
        switch (urgencyLevel) {
            case "critical":
                return "text-red-600";
            case "warning":
                return "text-orange-600";
            case "notice":
                return "text-yellow-600";
            default:
                return "text-gray-600";
        }
    };

    const getProgressColor = () => {
        switch (urgencyLevel) {
            case "critical":
                return "bg-red-500";
            case "warning":
                return "bg-orange-500";
            case "notice":
                return "bg-yellow-500";
            default:
                return "bg-blue-500";
        }
    };

    const getTitle = () => {
        switch (urgencyLevel) {
            case "critical":
                return "Critical: Very Low Balance!";
            case "warning":
                return "Warning: Low Balance";
            case "notice":
                return "Notice: Balance Getting Low";
            default:
                return "Low Balance";
        }
    };

    const getMessage = () => {
        switch (urgencyLevel) {
            case "critical":
                return "Your electricity balance is critically low. Purchase tokens immediately to avoid power interruption.";
            case "warning":
                return "Your electricity balance is running low. Consider purchasing tokens soon.";
            case "notice":
                return "Your electricity balance is below 50 kWh. You may want to purchase tokens.";
            default:
                return "Your electricity balance is low.";
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
            <Alert className={cn("relative", getAlertStyles())}>
                <div className="flex items-start gap-3">
                    <div className={cn("flex-shrink-0 mt-0.5", getIconColor())}>
                        {urgencyLevel === "critical" ? (
                            <Zap className="h-5 w-5" />
                        ) : (
                            <AlertTriangle className="h-5 w-5" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <AlertTitle className="text-sm font-semibold mb-1">
                            {getTitle()}
                        </AlertTitle>

                        <AlertDescription className="text-sm mb-3">
                            {getMessage()}
                        </AlertDescription>

                        {/* Balance Progress Bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Current Balance</span>
                                <span className="font-medium">
                                    {currentBalance.toFixed(1)} kWh
                                </span>
                            </div>
                            <Progress
                                value={Math.min(
                                    (currentBalance / 100) * 100,
                                    100
                                )}
                                className={cn("h-2", getProgressColor())}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleBuyTokens}
                                className={cn(
                                    "flex items-center gap-1 text-xs",
                                    urgencyLevel === "critical"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-blue-600 hover:bg-blue-700"
                                )}
                            >
                                <ShoppingCart className="h-3 w-3" />
                                Buy Tokens Now
                            </Button>

                            {canDismiss && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleDismiss}
                                    className="text-xs bg-transparent"
                                >
                                    Dismiss
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Close button for non-critical alerts */}
                    {canDismiss && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDismiss}
                            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-transparent"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </Alert>
        </div>
    );
}
