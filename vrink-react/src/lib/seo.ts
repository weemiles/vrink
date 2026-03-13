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
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const fullDescription = description ?? siteConfig.description;
  const canonical = new URL(path, metadataBase).toString();

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
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
    },
  };
}
