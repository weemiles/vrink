import { siteConfig } from "@/config/site";
import { vrinkCopy } from "@/content/vrink-copy";

export type HomeFixedCardContent = {
  title: string;
  body: string;
};

export type HomeFixedStoryContent = {
  title: string;
  body: string;
  cta: string;
};

export type HomeFixedProductContent = {
  title: string;
  badges: string[];
  body: string;
};

export const vrinkHomeContent = {
  hero: {
    title: vrinkCopy.hero.title,
    body: vrinkCopy.hero.body,
    cta: vrinkCopy.hero.primaryCta,
  },
  technology: {
    title: `${vrinkCopy.solution.title}\n일상 공간에서 건강 루틴을 만드는 구조`,
    body: vrinkCopy.solution.intro,
    cta: vrinkCopy.hero.secondaryCta,
  },
  platform: {
    title: `${vrinkCopy.feature.title}\n브링크 운영 구조`,
    body: vrinkCopy.feature.intro,
    cta: "핵심 기능 보기",
  },
  challenges: {
    title: vrinkCopy.problem.title,
    cta: "브링크 솔루션 더 알아보기",
    cards: vrinkCopy.feature.items.slice(0, 4).map((item) => ({
      title: item.title,
      body: item.description,
    })) as HomeFixedCardContent[],
  },
  stories: {
    title: "브링크 운영 근거를 확인하세요",
    cta: "운영 근거 전체 보기",
    items: [
      {
        title: "핵심 수치",
        body: `${vrinkCopy.proof.metrics[0]?.label}: ${vrinkCopy.proof.metrics[0]?.value}\n${vrinkCopy.proof.metrics[1]?.label}: ${vrinkCopy.proof.metrics[1]?.value}`,
        cta: "상세 수치 보기",
      },
      {
        title: "인증 및 품질",
        body: `${vrinkCopy.proof.certifications[0]}\n${vrinkCopy.proof.certifications[1]}\n${vrinkCopy.proof.certifications[3]}`,
        cta: "인증 정보 보기",
      },
      {
        title: "운영 시스템",
        body: `${vrinkCopy.proof.operations[0]}\n${vrinkCopy.proof.operations[1]}`,
        cta: "운영 방식 보기",
      },
    ] as HomeFixedStoryContent[],
  },
  products: {
    title: "브링크 제로스테이션 구성",
    cta: "도입 구성 보기",
    items: [
      {
        title: vrinkCopy.feature.items[0]?.title ?? "데이터 기반 추천",
        badges: ["추천", "개인화"],
        body: vrinkCopy.feature.items[0]?.bullets[0] ?? "약 1,750가지 조합",
      },
      {
        title: vrinkCopy.feature.items[1]?.title ?? "맞춤 제조",
        badges: ["즉시 제조"],
        body:
          vrinkCopy.feature.items[1]?.bullets[0] ?? "기능 샷 + 맛 + 농도 선택",
      },
      {
        title: vrinkCopy.feature.items[2]?.title ?? "빠른 완성",
        badges: [],
        body: vrinkCopy.feature.items[2]?.bullets[0] ?? "1잔 평균 약 11초",
      },
      {
        title: vrinkCopy.feature.items[3]?.title ?? "건강 루틴",
        badges: [],
        body:
          vrinkCopy.feature.items[3]?.bullets[2] ?? "Zero 칼로리 / Zero 슈거 / Zero 부담",
      },
    ] as HomeFixedProductContent[],
  },
  demo: {
    title: vrinkCopy.cta.title,
    body: `${vrinkCopy.cta.body}\n문의: ${siteConfig.contactEmail}`,
    cta: vrinkCopy.hero.primaryCta,
  },
} as const;
