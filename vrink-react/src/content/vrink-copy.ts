export type ProblemItem = {
  question: string;
  detail: string;
};

export type FeatureItem = {
  title: string;
  description: string;
  bullets: string[];
};

export type ProofMetric = {
  label: string;
  value: string;
  note?: string;
};

export type PromotionItem = {
  title: string;
  details: string[];
};

export type VrinkCopy = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  problem: {
    title: string;
    intro: string;
    items: ProblemItem[];
  };
  solution: {
    title: string;
    intro: string;
    pillars: string[];
  };
  feature: {
    title: string;
    intro: string;
    items: FeatureItem[];
    composition: string;
  };
  proof: {
    title: string;
    intro: string;
    certifications: string[];
    operations: string[];
    metrics: ProofMetric[];
    market: ProofMetric[];
  };
  cta: {
    title: string;
    body: string;
    promotions: PromotionItem[];
    contactNotice: string;
  };
  leadForm: {
    title: string;
    description: string;
    submitLabel: string;
    privacyNotice: string;
    fields: {
      company: string;
      name: string;
      email: string;
      phone: string;
      message: string;
    };
    placeholders: {
      company: string;
      name: string;
      email: string;
      phone: string;
      message: string;
    };
  };
  footer: {
    summary: string;
    companyInfo: {
      companyName: string;
      registrationNumber: string;
      owner: string;
      address: string;
      email: string;
      phone: string;
    };
    contact: {
      email: string;
      phone: string;
      instagram: string;
      website: string;
    };
    copyright: string;
  };
};

export const vrinkCopy: VrinkCopy = {
  hero: {
    eyebrow: "브링크 제로스테이션",
    title: "대한민국 최초 A.I 스마트 디스펜서",
    subtitle: "건강을 운영하는 새로운 기준",
    body: "브링크 A.I 스마트 디스펜서 – 제로스테이션은 단순히 음료를 제공하는 기기가 아닙니다. 공간의 경험, 복지, 수익 구조를 함께 설계하는 AI 기반 음료 운영 시스템입니다.",
    primaryCta: "도입 상담 신청",
    secondaryCta: "핵심 기능 보기",
  },
  problem: {
    title: "지금의 공간 운영에서 반복되는 고민",
    intro:
      "브링크 페이지에서 제시한 운영자와 사용자의 공통 문제를 기준으로 정리했습니다.",
    items: [
      {
        question: "지금과는 다른 방식의 차별화가 가능할까?",
        detail:
          "새로운 경험 요소로 공간을 차별화하고 싶지만 방법을 찾기 어렵습니다.",
      },
      {
        question: "직원 복지를 더 잘 챙길 수는 없을까?",
        detail:
          "복지 요소를 추가하고 싶지만 관리 부담이 걱정됩니다.",
      },
      {
        question: "다시 찾고 싶은 경험을 만들고 있을까?",
        detail:
          "단순한 서비스를 넘어 기억에 남는 경험을 제공하고 싶습니다.",
      },
      {
        question: "건강 관리가 일상이 아니라 해야 할 일이 됨",
        detail:
          "매번 챙기기 번거롭고 꾸준히 이어지지 않는 문제가 반복됩니다.",
      },
      {
        question: "보충제는 매번 들고다니기 귀찮아요",
        detail:
          "먹어야 하는 건 알지만 가방에 넣어둔 채로 잊어버리는 일이 많습니다.",
      },
      {
        question: "나에게 맞는 영양이 뭔지 모르겠어요",
        detail:
          "정보는 많지만 기준이 없어 무엇을 선택해야 할지 헷갈립니다.",
      },
    ],
  },
  solution: {
    title: "브링크의 솔루션",
    intro:
      "복잡한 선택 과정을 줄이고, 일상 공간 안에서 자연스럽게 건강 루틴을 만드는 구조에 집중합니다.",
    pillars: [
      "AI 기반 분석으로 개인에게 맞는 영양 제안",
      "일상 공간에서 자연스럽게 음료로 섭취",
      "데이터 기반 피드백으로 건강 습관 형성 지원",
      "공간의 차별화와 경험 요소 제공",
    ],
  },
  feature: {
    title: "제로스테이션이 답이 되는 이유",
    intro:
      "기능 샷, 맛, 농도, 탄산을 조합해 개인 맞춤형 경험을 만들고 운영 효율까지 연결합니다.",
    items: [
      {
        title: "AI 기반 맞춤 음료 추천",
        description:
          "약 1,750가지 조합을 사용자 취향·선택 데이터 기반으로 추천합니다.",
        bullets: [
          "약 1,750가지 조합",
          "사용자 취향·선택 데이터 기반 추천",
          "개인화된 음료를 직관적인 경험으로 제공",
        ],
      },
      {
        title: "직접 만드는 음료 경험",
        description:
          "기능 샷 + 맛 + 농도 선택으로 상황과 목적에 맞는 한 잔을 설계합니다.",
        bullets: [
          "기능 샷 + 맛 + 농도 선택",
          "모바일로 언제 어디서든 제조 가능",
          "사용자 컨디션·생활 패턴·목표 반영",
        ],
      },
      {
        title: "약 11초 완성",
        description:
          "선택한 영양 성분이 350ml 기준 약 11초 후 한 잔으로 완성됩니다.",
        bullets: [
          "1잔 평균 약 11초 (350ml 기준)",
          "즉시 섭취 가능한 운영 흐름",
          "24시간 운영 가능",
        ],
      },
      {
        title: "지속 가능한 건강 루틴",
        description:
          "재미 → 반복 → 습관화 흐름으로 일상에서 꾸준한 실천을 돕습니다.",
        bullets: [
          "복잡한 과정 없이 AI가 기준과 선호 반영",
          "매번 같은 방식이 아닌 개인 기준의 한 잔",
          "Zero 칼로리 / Zero 슈거 / Zero 부담",
        ],
      },
    ],
    composition:
      "5가지 기능성 샷 × 5가지 플레이버 × 농도 조절 × 탄산 옵션 = 총 약 1,750가지 조합",
  },
  proof: {
    title: "운영 신뢰를 위한 근거",
    intro:
      "인증, 하드웨어 경쟁력, 운영 구조를 브링크 노션 기준으로 정리했습니다.",
    certifications: [
      "국내 공식 본사 인증 제품",
      "공식 인증 마크 (CERTIFIED 2026) 보유",
      "본사 직영 단독 모델 (2026)",
      "특허 인증 완료",
      "HACCP 인증",
      "Made in Korea",
    ],
    operations: [
      "24/7 Auto: 상시 모니터링 및 운영 지원 구조",
      "System: 소진 시점 기준 구독 기반 자동 원액 공급",
      "Control: 기기 상태와 유지보수를 중앙에서 통합 관리",
      "Data: 사용 데이터를 기반으로 운영 흐름 분석 및 최적화",
    ],
    metrics: [
      {
        label: "최소 설치 공간",
        value: "900 × 600 × 1050 (W×D×H)",
      },
      {
        label: "제조 속도",
        value: "1잔 평균 11초 (350ml 기준)",
      },
      {
        label: "냉각 온도",
        value: "2°C ~ 6°C",
        note: "냉각까지 약 40분 소요",
      },
      {
        label: "기본 메뉴 조합",
        value: "약 1,750가지",
      },
      {
        label: "원액 가격",
        value: "5L 맛 원액 66,000원 / 효능 원액 99,000원",
      },
      {
        label: "기기 구입",
        value: "판매금액 800만원 (VAT 별도)",
      },
    ],
    market: [
      {
        label: "국내 건강 음료 시장",
        value: "2024년 8.3조원 → 2030년 15조원(예상)",
      },
      {
        label: "글로벌 기능성 음료 시장",
        value: "2024년 220조원 → 2030년 365조원(예상)",
      },
    ],
  },
  cta: {
    title: "도입 상담을 시작해보세요",
    body: "오피스, 피트니스, 병원·웰니스, 이벤트·팝업 등 장시간 운영 환경에 맞춰 상담을 진행합니다.",
    promotions: [
      {
        title: "초기 2개월 한정 무료 체험",
        details: [
          "1개월 → 2개월 무료 사용",
          "첫 달 10잔 무료",
          "두 번째 달 회원가입 시 10잔 추가",
          "총 20잔 제공",
        ],
      },
      {
        title: "얼리버드 이벤트",
        details: [
          "지금 문의 시 400만 원 공제 혜택",
          "오후 6시 이전 문의 시 당일 상담 가능",
          "설치 일정 협의 후 2~3일 소요",
        ],
      },
    ],
    contactNotice:
      "문의 접수 후 영업일 기준 순차적으로 연락드립니다. 운영/설치 조건은 계약 기준에 따릅니다.",
  },
  leadForm: {
    title: "도입 상담 신청",
    description:
      "설치 공간과 운영 목적을 남겨주시면 브링크 전담팀이 확인 후 연락드립니다.",
    submitLabel: "문의 접수하기",
    privacyNotice: "개인정보 수집 및 이용 동의 후 문의를 접수해주세요.",
    fields: {
      company: "기업/단체명",
      name: "담당자 성함",
      email: "이메일",
      phone: "연락처",
      message: "도입 문의 상세",
    },
    placeholders: {
      company: "예: 주식회사 브링크",
      name: "예: 홍길동",
      email: "example@company.com",
      phone: "010-0000-0000",
      message:
        "설치 공간(오피스/피트니스/병원/팝업)과 예상 사용 인원을 적어주세요.",
    },
  },
  footer: {
    summary:
      "브링크는 한 잔의 음료를 넘어 공간의 경험, 복지, 운영 효율을 함께 설계하는 AI 기반 음료 운영 시스템입니다.",
    companyInfo: {
      companyName: "주식회사 브링크",
      registrationNumber: "162-81-03420",
      owner: "김민수",
      address:
        "경기도 남양주시 별내 중앙로 30, 제 305-1821호(별내동, 별내로데오몰)",
      email: "vrink@contact.kr",
      phone: "010-7362-6070",
    },
    contact: {
      email: "contact@vrink.kr",
      phone: "010-7362-6070",
      instagram: "@vrink_official",
      website: "vrink.kr",
    },
    copyright: "©2025 VRINK. All Rights Reserved",
  },
};
