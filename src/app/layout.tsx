import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "SP International School — Bhubaneswar",
    template: "%s | SP International School",
  },
  description:
    "SP International School, Bhubaneswar — premium education ecosystem: admissions, academics, facilities, parent portal and fee management.",
  keywords: ["SP International School", "Bhubaneswar", "school", "admissions", "education"],
  applicationName: "SP International School ERP",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
