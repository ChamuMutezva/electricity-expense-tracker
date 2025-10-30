"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Settings } from "lucide-react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Button } from "@/components/ui/button";
import { MeterNumberDialog } from "@/components/meter-number-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";

interface AppHeaderProps {
    meterNumber?: string | null;
    showMeterDialog?: boolean;
}

export function AppHeader({
    meterNumber,
    showMeterDialog = false,
}: Readonly<AppHeaderProps>) {
    const [meterDialogOpen, setMeterDialogOpen] = useState(showMeterDialog);

    return (
        <>
            <div className="flex items-end justify-between flex-col sm:flex-row mb-6 gap-4">
                <div className="flex items-end gap-4 justify-between flex-col sm:flex-row w-full sm:w-auto">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 group hover:bg-primary/90 transition-colors"
                    >
                        <div className="p-1 rounded-lg bg-primary">                        
                            <Zap className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                            Electricity Tracker
                        </span>
                    </Link>

                    {meterNumber && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
                            <span className="text-xs font-medium text-muted-foreground">
                                Meter:
                            </span>
                            <span className="text-sm font-mono font-semibold">
                                {meterNumber}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {meterNumber && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Settings className="w-5 h-5" />
                                    <span className="sr-only">Settings</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setMeterDialogOpen(true)}
                                >
                                    Update Meter Number
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <SignInButton />
                </div>
            </div>

            <MeterNumberDialog
                open={meterDialogOpen}
                onOpenChange={setMeterDialogOpen}
                currentMeterNumber={meterNumber}
                isFirstTime={showMeterDialog}
            />
        </>
    );
}
