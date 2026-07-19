import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Footer from "@/components/Footer";
import "./globals.css";

const SITE_URL = "https://bitcoin-yield-intelligence.vercel.app";
const TAGLINE = "Risk-adjusted Bitcoin yield intelligence for the Stacks ecosystem. Explainable risk scoring, not just an APY table.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bitcoin Yield Intelligence — Risk-Adjusted Yield on Stacks",
  description: TAGLINE,
  openGraph: {
    title: "Bitcoin Yield Intelligence — Risk-Adjusted Yield on Stacks",
    description: TAGLINE,
    url: SITE_URL,
    siteName: "Bitcoin Yield Intelligence",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitcoin Yield Intelligence — Risk-Adjusted Yield on Stacks",
    description: TAGLINE,
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
