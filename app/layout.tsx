import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jobna — AI-Powered Job Intelligence",
  description:
    "Resume optimization, company intelligence, interview prep, and mock interviews — powered by AI.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
