import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegis Desktop Assistant - Next.js Multi-Agent Workspace",
  description:
    "Production-grade Next.js desktop interface with interactive floating windows, collapsible sidebar, and full integration with Aegis Hierarchical Multi-Agent Engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#121110] text-[#F6F4EE] antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
