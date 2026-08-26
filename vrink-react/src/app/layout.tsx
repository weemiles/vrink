import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CookieSettingsPopup } from "@/components/consent/cookie-settings-popup";
import { ChatbotWidget } from "@/components/consultation/chatbot-widget";
import { buildMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = buildMetadata({
  title: "브링크 공식 홈페이지",
  description:
    "브링크(VRINK)는 15초 만에 맛과 5종 기능샷을 고르는 맞춤형 웰니스 음료 디스펜서입니다.",
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
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.variable} vrink-design-system antialiased`}>
        <Script
          id="vrink-document-language"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.lang=location.pathname.indexOf('/en')===0?'en':'ko';",
          }}
        />
        <script
          id="vrink-organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <script
          id="vrink-website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd()),
          }}
        />
        {children}
        <CookieSettingsPopup />
        <ChatbotWidget />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
