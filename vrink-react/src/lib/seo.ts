import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

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
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: "d-ltXkau_y7Wo-LDtgOIv0evIEcIGBv7RUNojYW6C3Y",
      other: {
        "naver-site-verification": "080d2859d859a75fb78a7963c5acd9024e1be9a4",
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: siteConfig.name,
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
