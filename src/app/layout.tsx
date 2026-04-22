import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/theme-provider";
import { AuthGuard } from "@/components/auth-guard";
import { LocaleProvider } from "@/components/locale-provider";

const ibmPlex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Trendy Store - نظام الإدارة",
  description: "نظام إدارة متكامل لمتجر ترندي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlex.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        <Providers>
          <LocaleProvider>
            <AuthGuard>{children}</AuthGuard>
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
