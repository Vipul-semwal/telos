import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Telos ? Personal Intelligence System",
  description: "A long-term personal intelligence and pursuit management architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background-primary text-foreground-primary antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
