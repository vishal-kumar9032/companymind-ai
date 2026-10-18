import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CompanyMind AI — Autonomous Enterprise Graph Brain & Cross-Agent Shared Memory",
  description:
    "CompanyMind AI maps relationships between meeting notes, project reports, task records, and microservice architectures in FalkorDB with full source provenance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-slate-100 bg-[#090d16] selection:bg-indigo-600 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
