import { Geist } from "next/font/google";
import "./globals.css";
import React from "react";
import { MainNav } from "@/components/main-nav"; // Import your MainNav component

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
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.className}>
      <body className="flex flex-col min-h-screen">
        <MainNav /> {/* Render MainNav at the top */}
        <div className="flex-grow">
          {children}
        </div>
      </body>
    </html>
  );
}
