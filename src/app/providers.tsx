// src/app/providers.tsx
"use client"; // This component uses client-side features

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { ReduxProvider } from "@/app/store/ReduxProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
      <ReduxProvider>
        {children}
      </ReduxProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
