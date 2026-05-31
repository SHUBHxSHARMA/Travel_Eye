import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Eye — Explore historic sites with your lens",
  description:
    "Your friendly adventure guide for monuments. Discover checkpoints, hear stories, and track your exploration progress.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Travel Eye",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
