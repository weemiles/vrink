import type { Metadata } from "next";
import { Inter, Manrope, Noto_Sans_KR } from "next/font/google";

import { buildMetadata } from "@/lib/seo";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
});

export const metadata: Metadata = buildMetadata({
  title: "브링크(VRINK) 공식 웹사이트",
  description:
    "브링크 A.I 스마트 디스펜서 제로스테이션: 공간의 경험, 복지, 수익 구조를 함께 설계하는 AI 기반 음료 운영 시스템.",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${manrope.variable} ${notoSansKr.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
