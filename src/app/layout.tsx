import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContentFlow Pro — Incinc Media",
  description:
    "Client content planning and social media production management by Incinc Media",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
