import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StorefrontWrapper } from "@/components/layout/storefront-wrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Trovestak - Premium Electronics",
  description: "Kenya's voice-powered electronics store. Genuine products, AI-guided shopping, same-day delivery. Shop and Save.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased font-sf bg-background text-foreground">
        <StorefrontWrapper>
          {children}
        </StorefrontWrapper>
      </body>
    </html>
  );
}
