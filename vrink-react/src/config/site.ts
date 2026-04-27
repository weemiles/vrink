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
    "브링크 제로스테이션: 공간 맞춤 음료 경험을 만드는 스마트 드링크 시스템.",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vrink.kr",
  contactEmail: "vrink@contact.kr",
  contactPhone: "010-7362-6070",
  instagram: "@vrink_official",
  business: {
    companyName: "주식회사 브링크",
    owner: "김민수",
    registrationNumber: "162-81-03420",
    address:
      "경기도 남양주시 별내 중앙로 30, 제 305-1821호(별내동, 별내로데오몰)",
  },
};
