import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-falkor-500/30 selection:text-falkor-200">
        {children}
      </body>
    </html>
  );
}
