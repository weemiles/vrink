import type { BrandAsset, BrandRule, BrandSource } from "@/lib/brand/contracts";

type BrandMemoryStore = {
  sources: BrandSource[];
  rules: BrandRule[];
  generatedAssets: BrandAsset[];
  requestedAssets: string[];
};

declare global {
  var __ourBrandAgentStore: BrandMemoryStore | undefined;
}

function createStore(): BrandMemoryStore {
  return {
    sources: [],
    rules: [],
    generatedAssets: [],
    requestedAssets: [],
  };
}

export function getBrandStore() {
  if (!globalThis.__ourBrandAgentStore) {
    globalThis.__ourBrandAgentStore = createStore();
  }

  return globalThis.__ourBrandAgentStore;
}
