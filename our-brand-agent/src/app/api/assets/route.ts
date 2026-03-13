import { NextResponse } from "next/server";

import type { AssetFormat, AssetKind } from "@/lib/brand/contracts";
import { createBrandKnowledgeRepository } from "@/lib/brand/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseAssetKind(value: string | null): AssetKind | null {
  if (
    value === "logo" ||
    value === "palette" ||
    value === "font" ||
    value === "template" ||
    value === "moodboard" ||
    value === "banner" ||
    value === "guideline"
  ) {
    return value;
  }

  return null;
}

function parseAssetFormat(value: string | null): AssetFormat | null {
  if (value === "svg" || value === "png" || value === "pdf") {
    return value;
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const kind = parseAssetKind(url.searchParams.get("kind"));
  const format = parseAssetFormat(url.searchParams.get("format"));

  const repository = createBrandKnowledgeRepository();
  const assets = repository.listAssets({ search, kind, format });

  return NextResponse.json({ assets });
}
