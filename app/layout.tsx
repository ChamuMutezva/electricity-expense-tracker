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
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { Inter, Roboto_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
    title: "Electricity Expense Tracker",
    description: "Track your daily electricity usage and expenses",
    generator: "v0.dev",
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
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Analytics />
                </ThemeProvider>
            </body>
        </html>
    );
}
