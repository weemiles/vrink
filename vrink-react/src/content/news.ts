export type NewsLocale = "ko" | "en";

export type NewsItem = {
  id: string;
  title: string;
  category: string;
  source: string;
  date: string;
  body: string;
  image: string;
  href: string;
};

type NewsCopy = Pick<NewsItem, "title" | "category" | "source" | "body">;

type NewsRecord = Pick<NewsItem, "id" | "date" | "image" | "href"> & {
  copy: Record<NewsLocale, NewsCopy>;
};

const newsRecords: readonly NewsRecord[] = [
  {
    id: "etnews-cnt-tech-investment-20260825",
    date: "2026.08",
    image: "/images/vrink/news/etnews-cnt-tech-investment-20260825.jpg",
    href: "https://www.etnews.com/20260825000341",
    copy: {
      ko: {
        title: "씨엔티테크, AI 기반 개인 맞춤형 웰니스 영양음료 플랫폼 '브링크' 투자",
        category: "언론 보도",
        source: "전자신문",
        body: "씨엔티테크의 브링크 투자와 AI 기반 개인 맞춤형 영양음료 플랫폼의 기술·사업 확장 계획을 소개한 기사입니다.",
      },
      en: {
        title: "CNT Tech invests in AI-powered personalized wellness drink platform VRINK",
        category: "Press",
        source: "The Electronic Times",
        body: "Coverage of CNT Tech's investment in VRINK and the platform's plans to expand its dispensing technology, product lineup, and B2B reach.",
      },
    },
  },
  {
    id: "korea-wood-cnt-tech-investment-20260731",
    date: "2026.07",
    image: "/images/vrink/news/cnt-tech-investment-20260731.jpg",
    href: "https://www.woodkorea.co.kr/news/articleView.html?idxno=90580",
    copy: {
      ko: {
        title: "개인맞춤 영양 디스펜싱 플랫폼 ‘브링크’, CNT테크 투자 유치 확정…출시 3개월 만에 50개사 계약",
        category: "언론 보도",
        source: "한국목재신문",
        body: "개인맞춤 영양 추천과 무인 정밀 디스펜싱 플랫폼, 출시 3개월 내 50개사 계약 및 CNT테크 투자 유치 소식을 다룬 기사입니다.",
      },
      en: {
        title: "VRINK secures CNT Tech investment, signs 50 clients within three months of launch",
        category: "Press",
        source: "Korea Wood Newspaper",
        body: "Coverage of VRINK's personalized nutrition dispensing platform, early B2B traction, and investment from CNT Tech.",
      },
    },
  },
  {
    id: "enet-cnt-tech-investment-20260731",
    date: "2026.07",
    image: "/images/vrink/news/cnt-tech-investment-20260731.jpg",
    href: "https://www.enetnews.co.kr/news/articleView.html?idxno=52979",
    copy: {
      ko: {
        title: "브링크, CNT테크 투자 유치···출시 3개월 만에 50개 고객사 확보",
        category: "언론 보도",
        source: "이넷뉴스",
        body: "CNT테크 투자 유치와 공식 출시 후 3개월 만의 50개 고객사 확보 성과를 소개한 기사입니다.",
      },
      en: {
        title: "VRINK raises investment from CNT Tech, reaches 50 clients in three months",
        category: "Press",
        source: "ENet News",
        body: "A report on VRINK's funding and the 50 client companies secured during the first three months after launch.",
      },
    },
  },
  {
    id: "etnews-cnt-stadium-20260430",
    date: "2026.04",
    image: "/images/vrink/news/etnews-cnt-stadium-20260430.jpg",
    href: "https://n.news.naver.com/article/030/0003423393?sid=101",
    copy: {
      ko: {
        title: "브링크, CNT스타디움 유망 스포츠 스타트업 최종 선정",
        category: "언론 보도",
        source: "전자신문",
        body: "브링크가 2026 스포츠 액셀러레이팅 프로그램 CNT스타디움 최종 선정기업으로 소개된 기사입니다.",
      },
      en: {
        title: "VRINK named a final pick for CNT Stadium's promising sports startups",
        category: "Press",
        source: "The Electronic Times",
        body: "Coverage of VRINK as a final selection for the 2026 Sports Accelerating program, CNT Stadium.",
      },
    },
  },
  {
    id: "billiards-kibo-venture-camp-202604",
    date: "2026.04",
    image: "/images/vrink/news/vrink-news-consulting.jpg",
    href: "https://www.thebilliards.kr/news/articleView.html?idxno=30505",
    copy: {
      ko: {
        title: "브링크, 기보벤처캠프 18기 선발…맞춤형 뉴트리션 기술력 인정",
        category: "언론 보도",
        source: "빌리어즈",
        body: "브링크의 개인 맞춤 뉴트리션 방향과 기술 창업 지원 프로그램 선발 소식을 소개한 기사입니다.",
      },
      en: {
        title: "VRINK selected for the 18th Kibo Venture Camp, recognized for custom nutrition tech",
        category: "Press",
        source: "The Billiards",
        body: "An article on VRINK's personalized nutrition direction and its selection for a tech startup support program.",
      },
    },
  },
  {
    id: "ft-sports-accelerating-202604",
    date: "2026.04",
    image: "/images/vrink/news/vrink-news-booth.jpg",
    href: "https://www.ftimes.kr/news/articleView.html?idxno=36836",
    copy: {
      ko: {
        title: "브링크, 스포츠 액셀러레이팅 선정…웰니스 음료로 피트니스 시장 공략",
        category: "언론 보도",
        source: "FT스포츠",
        body: "스포츠 액셀러레이팅 선정과 피트니스 시장 확장 방향을 다룬 기사입니다.",
      },
      en: {
        title: "VRINK joins sports accelerating, taking wellness drinks to the fitness market",
        category: "Press",
        source: "FT Sports",
        body: "Coverage of VRINK's sports accelerating selection and its plans to grow in the fitness market.",
      },
    },
  },
];

export function getNewsItems(locale: NewsLocale): NewsItem[] {
  return newsRecords.map(({ copy, ...item }) => ({
    ...item,
    ...copy[locale],
  }));
}
