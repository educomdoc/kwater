import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const maplestory = localFont({
  src: [
    {
      path: "../../public/fonts/Maplestory-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Maplestory-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-maplestory",
  display: "swap",
});

export const metadata: Metadata = {
  title: "한국수자원공사 가족캠프",
  description: "한국수자원공사 가족캠프 신청 및 관리 시스템",
  icons: {
    icon: '/favicon.ico',
  },
};

import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${maplestory.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-gray-200 bg-white py-8">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} 한국수자원공사 가족캠프. All rights reserved.
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
