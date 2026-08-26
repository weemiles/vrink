export type SiteConfig = {
  name: string;
  title: string;
  description: string;
  baseUrl: string;
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  business: {
    companyName: string;
    owner: string;
    registrationNumber: string;
    address: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "VRINK",
  title: "브링크 공식 홈페이지 | VRINK",
  description:
    "브링크(VRINK)는 15초 만에 맛과 5종 기능샷을 고르는 맞춤형 웰니스 음료 디스펜서입니다.",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vrink.kr",
  contactEmail: "vrink@contact.kr",
  contactPhone: "070-4667-6072",
  instagram: "@vrink_official",
  business: {
    companyName: "주식회사 브링크",
    owner: "김민수",
    registrationNumber: "162-81-03420",
    address: "하남시 동남로406번길 46",
  },
};
