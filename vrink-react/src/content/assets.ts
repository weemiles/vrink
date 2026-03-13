export type AssetSlot =
  | "heroProduct"
  | "featureCustomization"
  | "proofHardware"
  | "proofOperations";

export type AssetEntry = {
  src: string | null;
  alt: string;
  aspectRatio: `${number}/${number}`;
};

export type AssetMap = Record<AssetSlot, AssetEntry>;

// User-provided assets should be stored under /public/images/vrink.
export const vrinkAssets: AssetMap = {
  heroProduct: {
    src: null,
    alt: "브링크 제로스테이션 제품 이미지",
    aspectRatio: "4/5",
  },
  featureCustomization: {
    src: null,
    alt: "브링크 커스터마이징 UI 또는 사용 장면",
    aspectRatio: "16/9",
  },
  proofHardware: {
    src: null,
    alt: "브링크 하드웨어 상세 이미지",
    aspectRatio: "4/3",
  },
  proofOperations: {
    src: null,
    alt: "브링크 설치 공간 및 운영 장면",
    aspectRatio: "4/3",
  },
};

export const assetBasePath = "/images/vrink";
