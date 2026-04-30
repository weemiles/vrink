import type { Metadata } from "next";
import localFont from "next/font/local";

import { VrinkConsultationWidget } from "@/components/consultation/vrink-consultation-widget";
import { buildMetadata } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = buildMetadata({
  title: "브링크(VRINK) 공식 웹사이트",
  description:
    "브링크 제로스테이션: 공간의 경험, 복지, 운영 흐름을 함께 설계하는 스마트 음료 시스템.",
});

const pretendard = localFont({
  display: "swap",
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${pretendard.variable} vrink-design-system antialiased`}>
        {children}
        <VrinkConsultationWidget />
      </body>
    </html>
  );
}
