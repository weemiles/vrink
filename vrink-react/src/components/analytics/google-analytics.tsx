"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

import { hasAnalyticsConsent, subscribeConsent } from "@/lib/consent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * 분석 쿠키 동의(analytics:true)가 있을 때만 GA4 스크립트를 로드한다.
 * - NEXT_PUBLIC_GA_ID 가 비어 있으면 아무것도 렌더하지 않는다(완전 no-op).
 * - "필수만 허용"이면 동의값이 false → 스크립트 자체가 주입되지 않아 쿠키도 심지 않는다.
 * - 팝업에서 "모두 허용/선택 저장"으로 동의하면 동의 변경 이벤트로 즉시 리렌더되어 로드된다.
 */
export function GoogleAnalytics() {
  const analyticsAllowed = useSyncExternalStore(
    subscribeConsent,
    hasAnalyticsConsent,
    () => false,
  );

  if (!GA_MEASUREMENT_ID || !analyticsAllowed) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
