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
  title: "브링크(VRINK) 공식 웹사이트",
  description:
    "브링크 제로스테이션: 15초 만에 기능샷과 맛을 고르는 공간 맞춤 음료 스테이션.",
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
