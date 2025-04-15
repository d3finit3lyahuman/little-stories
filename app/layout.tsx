import { Geist } from "next/font/google"; // Corrected import name if using geist package
import "./globals.css";
import React from "react";
import { MainNav } from "@/components/main-nav";
import { ThemeProvider } from "@/components/theme-provider"; // Import the ThemeProvider
import { cn } from "@/lib/utils"; // Import cn utility
import { Toaster } from "@/components/ui/toaster"; // Import Toaster if used

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Little Stories - A MicroStory platform",
  description: "Share your stories with the world in a few words",
};


const geistSans = Geist({
  display: "swap", 
  subsets: ["latin"],
  variable: "--font-sans", // Define the CSS variable
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Add suppressHydrationWarning for next-themes
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      {/* Apply font variable and theme classes */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased", // Use font-sans which maps to --font-sans
          "flex flex-col" // Keep existing flex structure
        )}
      >
        {/* Wrap content with ThemeProvider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MainNav />
          {/* Keep flex-grow for main content area */}
          <main className="flex-grow">{children}</main>
          <Toaster /> {/* Place Toaster inside ThemeProvider */}
          {/* Add Footer here if applicable */}
        </ThemeProvider>
      </body>
    </html>
  );
}
