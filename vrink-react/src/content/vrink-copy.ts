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
      source: string;
      message: string;
    };
    placeholders: {
      company: string;
      name: string;
      email: string;
      phone: string;
      source: string;
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
    title: "15초 만에 고르는 우리 공간의 한 잔",
    subtitle: "5종 기능샷과 약 1,792가지 조합",
    body: "브링크 제로스테이션은 기능샷, 맛, 농도, 탄산을 고르고 평균 15초 안에 받을 수 있는 공간 맞춤 음료 스테이션입니다.",
    primaryCta: "구성 받아보기",
    secondaryCta: "제품 보기",
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
      "데이터 기반 분석으로 개인에게 맞는 영양 제안",
      "일상 공간에서 자연스럽게 음료로 섭취",
      "데이터 기반 피드백으로 건강 습관 형성 지원",
      "공간의 차별화와 경험 요소 제공",
    ],
  },
  feature: {
    title: "제로스테이션을 고르는 이유",
    intro:
      "기능샷, 맛, 농도, 탄산을 조합해 개인 선택과 운영 관리를 한 흐름으로 연결합니다.",
    items: [
      {
        title: "약 1,792가지 음료 조합",
        description:
          "5종 기능샷과 맛, 농도, 탄산 옵션을 조합해 공간에 맞는 선택지를 만듭니다.",
        bullets: [
          "약 1,792가지 조합",
          "5종 기능샷과 맛 조합",
          "사용자가 직접 고르는 음료 경험",
        ],
      },
      {
        title: "직접 고르는 음료 경험",
        description:
          "기능 샷 + 맛 + 농도 선택으로 상황과 목적에 맞는 한 잔을 설계합니다.",
        bullets: [
          "기능 샷 + 맛 + 농도 선택",
          "태블릿에서 바로 선택",
          "사용자 컨디션·생활 패턴·목표 반영",
        ],
      },
      {
        title: "평균 15초 완성",
        description:
          "선택한 기능샷과 맛이 350ml 기준 약 15초 후 한 잔으로 완성됩니다.",
        bullets: [
          "1잔 평균 약 15초 (350ml 기준)",
          "짧은 대기 흐름",
          "24시간 운영 가능",
        ],
      },
      {
        title: "매일 고르기 쉬운 루틴",
        description:
          "복잡한 설명보다 사용자가 직접 고르고 마시는 반복 경험에 집중합니다.",
        bullets: [
          "복잡한 과정 없이 기준과 선호 반영",
          "매번 같은 방식이 아닌 개인 기준의 한 잔",
          "Zero 칼로리 / Zero 슈거",
        ],
      },
    ],
    composition:
      "5가지 기능성 샷 × 5가지 플레이버 × 농도 조절 × 탄산 옵션 = 총 약 1,792가지 조합",
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
      "System: 소진 시점 기준 자사몰 주문형 원액 공급",
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
        value: "1잔 평균 15초 (350ml 기준)",
      },
      {
        label: "냉각 온도",
        value: "2°C ~ 6°C",
        note: "냉각까지 약 40분 소요",
      },
      {
        label: "기본 메뉴 조합",
        value: "약 1,792가지",
      },
      {
        label: "원액 가격",
        value: "5L 맛 원액 128,000원 (약 250잔) / 기능 원액 198,000원 (약 1,000샷)",
      },
      {
        label: "기기 도입",
        value: "구매 또는 렌탈 (비용은 상담 안내)",
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
    title: "우리 공간에 맞는 도입 구성을 받아보세요",
    body: "기업·공간명, 담당자 성함, 이메일을 남겨주시면 필요한 내용을 확인해 제로스테이션 구성을 안내합니다.",
    promotions: [
      {
        title: "회원가입 혜택",
        details: [
          "회원가입 시 음료 10잔 무료",
        ],
      },
      {
        title: "첫 도입 혜택",
        details: [
          "지금 도입 시 원액 10팩(150만 원 상당) 무료 지원",
        ],
      },
    ],
    contactNotice:
      "문의 접수 후 순차적으로 연락드립니다. 운영/설치 조건은 계약 기준에 따릅니다.",
  },
  leadForm: {
    title: "세 가지 정보로 상담을 시작하세요",
    description:
      "기업·공간명, 담당자 성함, 이메일만 남겨주시면 브링크 팀이 필요한 내용을 이어서 확인합니다.",
    submitLabel: "도입 구성 요청하기",
    privacyNotice: "남겨주신 정보는 도입 문의 검토와 회신에만 사용합니다.",
    fields: {
      company: "기업/단체명",
      name: "담당자 성함",
      email: "이메일",
      phone: "연락처",
      source: "유입경로",
      message: "도입 구성 메모",
    },
    placeholders: {
      company: "예: 주식회사 브링크",
      name: "예: 홍길동",
      email: "example@company.com",
      phone: "010-0000-0000",
      source: "유입경로 선택",
      message:
        "공간 유형, 예상 이용자, 도입 시기를 적어주세요.",
    },
  },
  footer: {
    summary:
      "브링크는 15초 음료 경험과 원액·점검 관리를 함께 설계하는 공간 맞춤 음료 스테이션입니다.",
    companyInfo: {
      companyName: "주식회사 브링크",
      registrationNumber: "162-81-03420",
      owner: "김민수",
      address: "하남시 동남로406번길 46",
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
