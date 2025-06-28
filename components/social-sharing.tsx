"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Twitter, Facebook, Linkedin, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SocialSharingProps {
    readings: unknown[];
    totalUsage: number;
    averageUsage: number;
}

export default function SocialSharing({
    readings,
    totalUsage,
    averageUsage,
}: Readonly<SocialSharingProps>) {
    const [copied, setCopied] = useState(false);

    // Generate sharing content
    const generateShareContent = () => {
        const daysTracked = new Set(
            readings.map((r) =>
                new Date((r as { timestamp: string | number | Date }).timestamp).toDateString()
            )
        ).size;
        const efficiency =
            averageUsage < 5
                ? "excellent"
                : averageUsage < 10
                ? "good"
                : "needs improvement";

        return {
            title: "My Electricity Usage Report 📊⚡",
            text: `I've been tracking my electricity usage for ${daysTracked} days! 
📈 Total usage: ${totalUsage.toFixed(1)} kWh
📊 Daily average: ${averageUsage.toFixed(1)} kWh
🎯 Efficiency: ${efficiency}

Join me in monitoring energy consumption for a sustainable future! 🌱`,
            url: window.location.origin,
            hashtags: [
                "ElectricityTracking",
                "EnergyEfficiency",
                "Sustainability",
                "SmartHome",
            ],
        };
    };

    const shareContent = generateShareContent();

    const shareToTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareContent.text
        )}&url=${encodeURIComponent(
            shareContent.url
        )}&hashtags=${shareContent.hashtags.join(",")}`;
        window.open(twitterUrl, "_blank", "width=600,height=400");
    };

    const shareToFacebook = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareContent.url
        )}&quote=${encodeURIComponent(shareContent.text)}`;
        window.open(facebookUrl, "_blank", "width=600,height=400");
    };

    const shareToLinkedIn = () => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            shareContent.url
        )}&summary=${encodeURIComponent(shareContent.text)}`;
        window.open(linkedinUrl, "_blank", "width=600,height=400");
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(
                `${shareContent.text}\n\n${shareContent.url}`
            );
            setCopied(true);
            toast({
                title: "Copied!",
                description: "Share content copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            toast({
                title: "Copy Failed",
                description: "Failed to copy to clipboard",
                variant: "destructive",
            });
        }
    };

    const shareNatively = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareContent.title,
                    text: shareContent.text,
                    url: shareContent.url,
                });
            } catch (error) {
                console.error("Native sharing cancelled or failed:", error);
            }
        } else {
            copyToClipboard();
        }
    };

    const getEfficiencyBadge = () => {
        const efficiency =
            averageUsage < 5
                ? "excellent"
                : averageUsage < 10
                ? "good"
                : "needs improvement";
        const color =
            averageUsage < 5
                ? "bg-green-100 text-green-800"
                : averageUsage < 10
                ? "bg-blue-100 text-blue-800"
                : "bg-orange-100 text-orange-800";

        return <Badge className={color}>{efficiency.toUpperCase()}</Badge>;
    };

    if (readings.length < 7) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-green-600" />
                        Share Your Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">
                        Track for at least a week to unlock sharing features! 📊
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-green-600" />
                    Share Your Progress
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Preview */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                        <h4 className="font-semibold mb-2">
                            {shareContent.title}
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span>Days tracked:</span>
                                <span className="font-medium">
                                    {
                                        new Set(
                                            readings.map((r) =>
                                                new Date(
                                                    (r as { timestamp: string | number | Date }).timestamp
                                                ).toDateString()
                                            )
                                        ).size
                                    }
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Total usage:</span>
                                <span className="font-medium">
                                    {totalUsage.toFixed(1)} kWh
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Daily average:</span>
                                <span className="font-medium">
                                    {averageUsage.toFixed(1)} kWh
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Efficiency:</span>
                                {getEfficiencyBadge()}
                            </div>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={shareToTwitter}
                            className="flex items-center gap-2 bg-transparent"
                        >
                            <Twitter className="h-4 w-4 text-blue-500" />
                            Twitter
                        </Button>

                        <Button
                            variant="outline"
                            onClick={shareToFacebook}
                            className="flex items-center gap-2 bg-transparent"
                        >
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                        </Button>

                        <Button
                            variant="outline"
                            onClick={shareToLinkedIn}
                            className="flex items-center gap-2 bg-transparent"
                        >
                            <Linkedin className="h-4 w-4 text-blue-700" />
                            LinkedIn
                        </Button>

                        <Button
                            variant="outline"
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 bg-transparent"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                    </div>

                    {/* Native Share (mobile) */}
                    {typeof navigator !== "undefined" &&
                        typeof navigator.share === "function" && (
                            <Button onClick={shareNatively} className="w-full">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        )}

                    <div className="text-xs text-muted-foreground text-center">
                        Share your energy efficiency journey and inspire others!
                        🌱
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
