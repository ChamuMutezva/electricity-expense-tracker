import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ElectricityLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-8 w-64" />
                    </div>

                    {/* Loading tabs skeleton */}
                    <div className="w-full h-12 bg-slate-100 dark:bg-slate-900 rounded-lg p-1 flex gap-2">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="flex-1 h-full" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* Main loading card */}
                <Card className="border-none shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            {/* Animated electricity icon */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-ping" />
                                <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 p-6 rounded-full">
                                    <Zap className="h-12 w-12 text-white animate-pulse" />
                                </div>
                            </div>

                            {/* Loading text */}
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                    Loading Your Electricity Data
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Fetching your readings and usage
                                    statistics...
                                </p>
                            </div>

                            {/* Loading bars */}
                            <div className="w-full max-w-md space-y-3">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-5/6 mx-auto" />
                                <Skeleton className="h-3 w-4/6 mx-auto" />
                            </div>
                        </div>

                        {/* Dashboard skeleton preview */}
                        <div className="grid gap-4 md:grid-cols-3 mt-8">
                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardContent className="pt-6">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-8 w-32" />
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardContent className="pt-6">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-8 w-32" />
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardContent className="pt-6">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-8 w-32" />
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
