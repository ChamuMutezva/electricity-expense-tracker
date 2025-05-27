/**
 * Provides theme context to its children using the `next-themes` library.
 * 
 * This component should wrap your application to enable theme switching (e.g., light/dark mode).
 * It passes all received props to the underlying `NextThemesProvider`.
 *
 * @param children - The React nodes that will have access to the theme context.
 * @param props - Additional props to be forwarded to `NextThemesProvider`.
 * 
 * @see {@link https://github.com/pacocoursey/next-themes documentation}
 */

"use client";

import * as React from "react";
import {
    ThemeProvider as NextThemesProvider,
    type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({
    children,
    ...props
}: Readonly<ThemeProviderProps>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
