import type { Metadata } from "next";
import { ThemeProvider } from "@dhriti/ui";
import { AlertProvider } from "@/components/shared/alert";
import { AuthProvider } from "@/hooks/use-auth";
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
      <body suppressHydrationWarning>
        <ThemeProvider mode="system" density="comfortable">
          <AuthProvider>
            <AlertProvider>{children}</AlertProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
