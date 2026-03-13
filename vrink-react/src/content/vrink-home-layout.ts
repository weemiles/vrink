export type Frame = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export type HomeFixedSection = {
  id: string;
  frame: Frame;
  insetFrame?: Frame;
  background: string;
};

export type HomeFixedCardItem = {
  id: string;
  frame: Frame;
  iconFrame: Frame;
  iconInner: Frame;
  iconColor: string;
};

export type HomeFixedStoryItem = {
  id: string;
  frame: Frame;
};

export type HomeFixedProductItem = {
  id: string;
  frame: Frame;
  imageFrame: Frame;
};

export const HOME_CANVAS = {
  width: 1920,
  height: 9140.98,
} as const;

export const homePalette = {
  black: "#000000",
  white: "#FFFFFF",
  gray100: "#EEEEEE",
  gray200: "#F5F5F5",
  gray900: "#262626",
  olive: "#B6B77E",
} as const;

export const fixedSections: HomeFixedSection[] = [
  {
    id: "hero",
    frame: { width: 1920, height: 1515.81, left: 0, top: 0 },
    insetFrame: { width: 1840, height: 1515.81, left: 40, top: 0 },
    background: homePalette.black,
  },
  {
    id: "technology",
    frame: { width: 1920, height: 1382.39, left: 0, top: 1555.81 },
    insetFrame: { width: 1840, height: 1382.39, left: 40, top: 0 },
    background: homePalette.black,
  },
  {
    id: "platform",
    frame: { width: 1920, height: 1534.41, left: 0, top: 2978.2 },
    insetFrame: { width: 1840, height: 1534.41, left: 40, top: 0 },
    background: homePalette.olive,
  },
  {
    id: "challenges",
    frame: { width: 1840, height: 887.53, left: 40, top: 4672.61 },
    background: "transparent",
  },
  {
    id: "stories",
    frame: { width: 1840, height: 1290.53, left: 40, top: 5720.14 },
    background: "transparent",
  },
  {
    id: "products",
    frame: { width: 1840, height: 1390.31, left: 40, top: 7170.67 },
    background: "transparent",
  },
  {
    id: "demo",
    frame: { width: 1920, height: 540, left: 0, top: 8600.98 },
    insetFrame: { width: 1840, height: 540, left: 40, top: 0 },
    background: homePalette.black,
  },
];

export const challengeCards: HomeFixedCardItem[] = [
  {
    id: "challenge-card-1",
    frame: { width: 445, height: 667.5, left: 0, top: 220.03 },
    iconFrame: { width: 48, height: 48, left: 198.5, top: 316.58 },
    iconInner: { width: 40, height: 36, left: 4, top: 6 },
    iconColor: homePalette.black,
  },
  {
    id: "challenge-card-2",
    frame: { width: 445, height: 667.5, left: 465, top: 220.03 },
    iconFrame: { width: 48, height: 48, left: 198.5, top: 299.22 },
    iconInner: { width: 40.83, height: 41.99, left: 3.58, top: 3 },
    iconColor: homePalette.black,
  },
  {
    id: "challenge-card-3",
    frame: { width: 445, height: 667.5, left: 930, top: 220.03 },
    iconFrame: { width: 48, height: 48, left: 198.5, top: 299.22 },
    iconInner: { width: 40, height: 39.24, left: 4, top: 3.81 },
    iconColor: homePalette.gray900,
  },
  {
    id: "challenge-card-4",
    frame: { width: 445, height: 667.5, left: 1395, top: 220.03 },
    iconFrame: { width: 48, height: 48, left: 198.5, top: 299.22 },
    iconInner: { width: 36, height: 36, left: 6, top: 6 },
    iconColor: homePalette.gray900,
  },
];

export const storyCards: HomeFixedStoryItem[] = [
  { id: "story-1", frame: { width: 600, height: 1070.5, left: 0, top: 220.03 } },
  { id: "story-2", frame: { width: 600, height: 1070.5, left: 620, top: 220.03 } },
  { id: "story-3", frame: { width: 600, height: 1070.5, left: 1240, top: 220.03 } },
];

export const productCards: HomeFixedProductItem[] = [
  {
    id: "product-1",
    frame: { width: 910, height: 610.5, left: 0, top: 149.31 },
    imageFrame: { width: 415, height: 233.23, left: 247.5, top: 181.07 },
  },
  {
    id: "product-2",
    frame: { width: 910, height: 610.5, left: 930, top: 149.31 },
    imageFrame: { width: 415, height: 276.88, left: 247.5, top: 159.24 },
  },
  {
    id: "product-3",
    frame: { width: 910, height: 610.5, left: 0, top: 779.81 },
    imageFrame: { width: 415, height: 276.88, left: 247.5, top: 170.49 },
  },
  {
    id: "product-4",
    frame: { width: 910, height: 610.5, left: 930, top: 779.81 },
    imageFrame: { width: 415, height: 276.88, left: 247.5, top: 170.49 },
  },
];
