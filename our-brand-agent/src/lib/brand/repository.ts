import { randomUUID } from "node:crypto";

import type {
  AssetFormat,
  AssetKind,
  BrandAsset,
  BrandRule,
  BrandSource,
  UploadFilePayload,
  UploadItem,
} from "@/lib/brand/contracts";
import { getBrandStore } from "@/lib/brand/store";

export type AssetQuery = {
  search?: string | null;
  kind?: AssetKind | null;
  format?: AssetFormat | null;
};

export interface BrandKnowledgeRepository {
  getSources(): BrandSource[];
  getRules(): BrandRule[];
  addUploads(files: UploadFilePayload[]): UploadItem[];
  listAssets(query?: AssetQuery): BrandAsset[];
  addGeneratedAsset(asset: BrandAsset): BrandAsset;
  registerAssetRequest(requestText: string): void;
}

export class InMemoryBrandKnowledgeRepository implements BrandKnowledgeRepository {
  getSources() {
    return [...getBrandStore().sources].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  getRules() {
    return [...getBrandStore().rules];
  }

  addUploads(files: UploadFilePayload[]) {
    const store = getBrandStore();

    const items = files.map<UploadItem>((file) => {
      const sourceId = randomUUID();
      const uploadedAt = new Date().toISOString();

      store.sources.unshift({
        id: sourceId,
        name: file.name,
        kind: file.kind,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt,
        status: "ready",
        extractedRuleCount: 0,
        note: "실제 추출 엔진 연결 전입니다. 업로드된 자료만 기준으로 잠금되어 있습니다.",
        previewLabel: file.previewLabel,
      });

      return {
        id: randomUUID(),
        clientId: file.clientId,
        sourceId,
        name: file.name,
        kind: file.kind,
        mimeType: file.mimeType,
        size: file.size,
        status: "ready",
        note: "소스 등록 완료. 규칙 추출은 아직 연결되지 않았습니다.",
        uploadedAt,
      };
    });

    return items;
  }

  listAssets(query?: AssetQuery) {
    const { search, kind, format } = query ?? {};
    const normalizedSearch = search?.trim().toLowerCase() ?? "";

    return [...getBrandStore().generatedAssets]
      .filter((asset) => {
        if (kind && asset.kind !== kind) return false;
        if (format && !asset.formats.includes(format)) return false;
        if (!normalizedSearch) return true;

        const haystack = `${asset.name} ${asset.summary} ${asset.description}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addGeneratedAsset(asset: BrandAsset) {
    const store = getBrandStore();
    store.generatedAssets = [asset, ...store.generatedAssets.filter((item) => item.id !== asset.id)];
    return asset;
  }

  registerAssetRequest(requestText: string) {
    getBrandStore().requestedAssets.unshift(requestText);
  }
}

export function createBrandKnowledgeRepository() {
  return new InMemoryBrandKnowledgeRepository();
}
