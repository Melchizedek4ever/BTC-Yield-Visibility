import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Footer from "@/components/Footer";
import "./globals.css";

const SITE_URL = "https://btc-yield-visibility.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "BTC Yield Visibility — Bitcoin Yield Intelligence",
  description: "Risk-adjusted Bitcoin yield intelligence for the Stacks ecosystem. Explainable risk scoring, not just an APY table.",
  openGraph: {
    title: "BTC Yield Visibility — Bitcoin Yield Intelligence",
    description: "Risk-adjusted Bitcoin yield intelligence for the Stacks ecosystem. Explainable risk scoring, not just an APY table.",
    url: SITE_URL,
    siteName: "BTC Yield Visibility",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BTC Yield Visibility — Bitcoin Yield Intelligence",
    description: "Risk-adjusted Bitcoin yield intelligence for the Stacks ecosystem. Explainable risk scoring, not just an APY table.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
