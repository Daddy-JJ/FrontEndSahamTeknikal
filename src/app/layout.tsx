import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruang Sinyal · IDX Night Scanner",
  description: "Workspace riset EOD, empat setup teknikal, dan jurnal yang dapat diaudit.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
