import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SP International School, Bhubaneswar | CBSE School",
  description:
    "SP International School, Bhubaneswar — a premier CBSE school with 2-acre campus, smart classrooms, 6 labs, 13400+ library books, sports complexes and value-based education. Admissions open for 2026-27.",
  keywords: ["SP International School", "CBSE School Bhubaneswar", "School Admissions Odisha", "Best School Bhubaneswar", "Residential School"],
  authors: [{ name: "SP International School" }],
  icons: {
    icon: "/school-logo.jpeg",
  },
  openGraph: {
    title: "SP International School, Bhubaneswar",
    description: "A premier CBSE school offering holistic education from Pre-Primary to Senior Secondary. Admissions open for 2026-27.",
    siteName: "SP International School",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
