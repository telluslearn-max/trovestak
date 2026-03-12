import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StorefrontWrapper } from "@/components/layout/storefront-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trovestak - Premium Electronics",
  description: "Your trusted source for premium electronics in Kenya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <StorefrontWrapper>
          {children}
        </StorefrontWrapper>
      </body>
    </html>
  );
}
