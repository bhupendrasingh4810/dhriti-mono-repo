import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@dhriti/ui";
import { AlertProvider } from '@/components/alerts/alert-provider';
import "./globals.css";

export const metadata: Metadata = {
  title: "Dhriti",
  description: "The operating system for modern teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider mode="system" density="comfortable">
            <AlertProvider>{children}</AlertProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}