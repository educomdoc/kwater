import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "수자원공사 가족캠프",
  description: "수자원공사 가족캠프 신청 및 관리 시스템",
  icons: {
    icon: '/favicon.ico',
  },
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} 수자원공사 가족캠프. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
