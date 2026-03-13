import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Our Brand Agent",
  description:
    "Upload-driven brand assistant UI for team asset search, requests, and placeholder generation previews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
