import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
};

export function buildMetadata({
  title,
  description,
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
    openGraph: {
      type: "website",
      url: canonical,
      siteName: siteConfig.name,
      title: fullTitle,
      description: fullDescription,
      locale: "ko_KR",
      images: [
        {
          url: heroImageUrl,
          width: 1280,
          height: 720,
          alt: "브링크 제로스테이션 히어로 이미지",
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
