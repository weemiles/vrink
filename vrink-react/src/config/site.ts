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
    "브링크 A.I 스마트 디스펜서 제로스테이션: 건강을 운영하는 새로운 기준.",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vrink.kr",
  contactEmail: "contact@vrink.kr",
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
