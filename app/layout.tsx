/**
 * Root layout component for the Electricity Expense Tracker Next.js application.
 *
 * @remarks
 * This layout sets up global styles, font variables, and theme provider for the app.
 * It also injects Vercel Analytics for tracking.
 *
 * @param props - The props for the layout component.
 * @param props.children - The React node(s) to be rendered within the layout.
 *
 * @returns The root HTML structure with theme and analytics providers.
 *
 * @see {@link https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts#layouts}
 */
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import type React from "react";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { Inter, Roboto_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
    title: "Electricity Expense Tracker - Monitor Your Power Usage",
    description:
        "Track, analyze, and optimize your electricity consumption with AI-powered insights and detailed analytics",
    keywords: [
        "electricity",
        "power",
        "energy",
        "tracker",
        "consumption",
        "analytics",
        "meter reading",
    ],
    authors: [{ name: "Chamu Mutezva" }],
    openGraph: {
        title: "Electricity Expense Tracker",
        description:
            "Monitor and optimize your electricity usage with smart analytics",
        type: "website",
    },
};

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const robotoMono = Roboto_Mono({
    subsets: ["latin"],
    variable: "--font-roboto-mono",
    display: "swap",
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${inter.variable} ${robotoMono.variable}`}
        >
            <body className="font-sans">
                <StackProvider app={stackClientApp}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <StackTheme>
                            <ErrorBoundary>
                                {children}                               
                                <Analytics />
                            </ErrorBoundary>
                        </StackTheme>
                    </ThemeProvider>
                </StackProvider>
            </body>
        </html>
    );
}
