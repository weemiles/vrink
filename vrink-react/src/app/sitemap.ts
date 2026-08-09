import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export const dynamic = "force-static";

const routes = [
  "/",
  "/product",
  "/experience",
  "/detail",
  "/ingredients",
  "/locations",
  "/support",
  "/inquiry",
  "/terms",
  "/privacy",
  "/en",
  "/en/product",
  "/en/experience",
  "/en/ingredients",
  "/en/locations",
  "/en/support",
  "/en/inquiry",
  "/en/terms",
  "/en/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.baseUrl.replace(/\/$/, "");

  return routes.map((route) => ({
    url: `${base}${route === "/" ? "" : route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
