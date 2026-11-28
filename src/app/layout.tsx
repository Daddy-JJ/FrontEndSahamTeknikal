import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Broker Flow & Bandarmology · SahamTeknikal",
  description: "Smart Money Flow & Bandarmology Intelligence untuk pasar saham IDX.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
