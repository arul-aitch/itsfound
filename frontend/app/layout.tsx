import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/providers";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: "--font-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "ITSFOUND",
    description: "Lost & found kampus ITS",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body
                className={`${plusJakartaSans.variable} font-sans text-[15px] antialiased`}
            >
                <Providers>
                    <Navbar />
                    <main className="min-h-[calc(100vh-4rem)]">{children}</main>
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
