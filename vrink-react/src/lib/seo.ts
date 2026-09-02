import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export function organizationJsonLd() {
  const base = siteConfig.baseUrl.replace(/\/$/, "");
  const instagramHandle = siteConfig.instagram.replace(/^@/, "");

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "브링크",
    legalName: siteConfig.business.companyName,
    alternateName: ["VRINK", "브링크 제로스테이션"],
    url: base,
    logo: `${base}/images/vrink/brand/vrink-circle-logo.png`,
    description: siteConfig.description,
    email: siteConfig.contactEmail,
    telephone: siteConfig.contactPhone,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "KR Business Registration Number",
      value: siteConfig.business.registrationNumber,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: siteConfig.contactPhone,
      email: siteConfig.contactEmail,
      areaServed: "KR",
      availableLanguage: ["Korean", "English"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "동남로406번길 46",
      addressLocality: "하남시",
      addressRegion: "경기도",
      addressCountry: "KR",
    },
    sameAs: [`https://www.instagram.com/${instagramHandle}`],
  };
}

export function productJsonLd(locale: "ko" | "en" = "ko") {
  const base = siteConfig.baseUrl.replace(/\/$/, "");
  const isEnglish = locale === "en";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${base}/product#zero-station`,
    name: isEnglish ? "VRINK Zero Station" : "브링크 제로스테이션",
    alternateName: isEnglish ? "브링크 제로스테이션" : "VRINK Zero Station",
    description: isEnglish
      ? "VRINK Zero Station is a smart wellness drink dispenser with an average 15-second serving flow and five functional shots."
      : "브링크 제로스테이션은 평균 15초 제조 흐름과 5종 기능샷을 제공하는 스마트 웰니스 음료 디스펜서입니다.",
    url: `${base}${isEnglish ? "/en/product" : "/product"}`,
    image: `${base}/images/vrink/apple/vrink-product-front.png`,
    category: isEnglish ? "Smart wellness drink dispenser" : "스마트 웰니스 음료 디스펜서",
    brand: {
      "@type": "Brand",
      name: "브링크",
      alternateName: "VRINK",
    },
    manufacturer: {
      "@id": `${base}/#organization`,
    },
    countryOfOrigin: {
      "@type": "Country",
      name: isEnglish ? "South Korea" : "대한민국",
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: isEnglish ? "Average serving time" : "평균 제조 시간",
        value: isEnglish ? "About 15 seconds per 350ml cup" : "350ml 한 잔 기준 평균 약 15초",
      },
      {
        "@type": "PropertyValue",
        name: isEnglish ? "Functional shots" : "기능샷",
        value: isEnglish ? "5 options" : "5종",
      },
      {
        "@type": "PropertyValue",
        name: isEnglish ? "Operation" : "운영",
        value: isEnglish ? "24-hour operation available" : "24시간 운영 가능",
      },
    ],
  };
}

export function websiteJsonLd() {
  const base = siteConfig.baseUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: "브링크",
    alternateName: "VRINK",
    inLanguage: ["ko-KR", "en-US"],
    publisher: {
      "@id": `${base}/#organization`,
    },
  };
}

type BuildMetadataInput = {
  title?: string;
  description?: string;
  locale?: "ko" | "en";
  path?: string;
};

export function buildMetadata({
  title,
  description,
  locale = "ko",
  path = "/",
}: BuildMetadataInput): Metadata {
  const metadataBase = new URL(siteConfig.baseUrl);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const canonicalPath = `${basePath}${path === "/" ? "/" : path}`;
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const fullDescription = description ?? siteConfig.description;
  const canonical = new URL(canonicalPath, metadataBase.origin).toString();
  const koreanPath = locale === "en" ? path.replace(/^\/en(?=\/|$)/, "") || "/" : path;
  const englishPath = locale === "en" ? path : path === "/" ? "/en" : `/en${path}`;
  const localizedUrl = (localizedPath: string) =>
    new URL(
      `${basePath}${localizedPath === "/" ? "/" : localizedPath}`,
      metadataBase.origin,
    ).toString();
  const heroImageUrl = new URL(
    `${basePath}/images/vrink/apple/vrink-hero-still.jpg`,
    metadataBase.origin,
  ).toString();

  return {
    metadataBase,
    title: fullTitle,
    description: fullDescription,
    alternates: {
      canonical,
      languages: {
        "ko-KR": localizedUrl(koreanPath),
        "en-US": localizedUrl(englishPath),
        "x-default": localizedUrl(koreanPath),
      },
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: "d-ltXkau_y7Wo-LDtgOIv0evIEcIGBv7RUNojYW6C3Y",
      other: {
        "naver-site-verification": "e7c4ec4e2d84aeb1ad409beccf1a65e64a267e8d",
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: locale === "en" ? siteConfig.name : "브링크",
      title: fullTitle,
      description: fullDescription,
      locale: locale === "en" ? "en_US" : "ko_KR",
      images: [
        {
          url: heroImageUrl,
          width: 1280,
          height: 720,
          alt: locale === "en" ? "VRINK Zero Station hero image" : "브링크 제로스테이션 히어로 이미지",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [heroImageUrl],
    },
  };
}
