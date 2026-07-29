import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "HealthCore | Talent Pipeline",
  description: "HealthCore People & Talent — candidate pipeline tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,106,61,0.10),transparent_30%),linear-gradient(180deg,#fff8ef_0%,#f3ede5_100%)] font-[family-name:var(--font-manrope)] text-[#101010]">
        <Header />
        <main className="px-[5%] py-10 md:px-[8%]">{children}</main>
      </body>
    </html>
  );
}