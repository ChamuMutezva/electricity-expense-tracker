"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface ShortcutItem {
    keys: string[];
    description: string;
    category: string;
}

const shortcuts: ShortcutItem[] = [
    {
        keys: ["?"],
        description: "Show keyboard shortcuts",
        category: "General",
    },
    { keys: ["N"], description: "Add new reading", category: "Actions" },
    { keys: ["T"], description: "Add token", category: "Actions" },
    { keys: ["D"], description: "Go to Dashboard", category: "Navigation" },
    { keys: ["A"], description: "Go to Analytics", category: "Navigation" },
    { keys: ["R"], description: "Go to Reports", category: "Navigation" },
    { keys: ["I"], description: "Go to AI Insights", category: "Navigation" },
    { keys: ["B"], description: "Go to Backdated", category: "Navigation" },
    { keys: ["Esc"], description: "Close dialog/modal", category: "General" },
    {
        keys: ["Ctrl", "K"],
        description: "Search (coming soon)",
        category: "General",
    },
];

export function KeyboardShortcuts() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Show shortcuts dialog
            if (event.key === "?" && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                setOpen(true);
            }

            // Close dialog with Escape
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyPress);
        return () => document.removeEventListener("keydown", handleKeyPress);
    }, []);

    const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

    return (
        <>
            {/* Floating Help Button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-110 z-50"
                aria-label="Show keyboard shortcuts"
            >
                <Keyboard className="h-5 w-5" />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Keyboard className="h-5 w-5" />
                            Keyboard Shortcuts
                        </DialogTitle>
                        <DialogDescription>
                            Use these shortcuts to navigate and interact with
                            the app more efficiently
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {categories.map((category) => (
                            <div key={category}>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {shortcuts
                                        .filter((s) => s.category === category)
                                        .map((shortcut, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {shortcut.description}
                                                </span>
                                                <div className="flex gap-1">
                                                    {shortcut.keys.map(
                                                        (key, i) => (
                                                            <Badge
                                                                key={i}
                                                                variant="outline"
                                                                className="font-mono"
                                                            >
                                                                {key}
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                            <strong>Tip:</strong> Press{" "}
                            <Badge variant="outline" className="mx-1 font-mono">
                                ?
                            </Badge>{" "}
                            anytime to view this dialog
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
