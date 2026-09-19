"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// next-themes v0.4 exports its types from the package root; the old
// "next-themes/dist/types" path no longer resolves.
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
