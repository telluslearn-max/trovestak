import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { StorefrontWrapper } from "@/components/layout/storefront-wrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${dmSans.variable}`}>
      <body className="antialiased font-sans bg-background text-foreground">
        <StorefrontWrapper>
          {children}
        </StorefrontWrapper>
      </body>
    </html>
  );
}
