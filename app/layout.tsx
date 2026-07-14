import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTCFi Yield Intel — Stacks Ecosystem Dashboard",
  description: "Compare yield opportunities across DeFi protocols on the Stacks Bitcoin L2. Real-time APY, risk scores, and opportunity rankings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
