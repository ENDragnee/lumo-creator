"use client"

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
        <SessionProvider>
          <ThemeProvider>
            <body className="min-h-screen bg-white dark:bg-[#383c4a] text-black dark:text-white">
                {children}
            </body>
          </ThemeProvider>
        </SessionProvider>
    </html>
  );
}
