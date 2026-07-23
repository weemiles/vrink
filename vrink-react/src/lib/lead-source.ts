export type LeadSourceLocale = "ko" | "en";

export const leadSourceOptions = [
  {
    id: "shorts",
    labels: {
      ko: "숏츠/릴스",
      en: "Shorts / Reels",
    },
  },
  {
    id: "referral",
    labels: {
      ko: "지인 추천",
      en: "Referral",
    },
  },
  {
    id: "portal_search",
    labels: {
      ko: "포털 검색",
      en: "Portal search",
    },
  },
  {
    id: "instagram",
    labels: {
      ko: "인스타그램",
      en: "Instagram",
    },
  },
  {
    id: "event",
    labels: {
      ko: "전시/행사",
      en: "Expo / event",
    },
  },
  {
    id: "other",
    labels: {
      ko: "기타",
      en: "Other",
    },
  },
] as const;

const internalLeadSourceLabels: Record<string, Record<LeadSourceLocale, string>> = {
  website: {
    ko: "홈페이지",
    en: "Website",
  },
  consultation_widget: {
    ko: "상담 위젯",
    en: "Consultation widget",
  },
};

export function getLeadSourceLabel(
  source: string | undefined,
  locale: LeadSourceLocale = "ko",
) {
  if (!source) return internalLeadSourceLabels.website[locale];

  const option = leadSourceOptions.find((item) => item.id === source);
  if (option) return option.labels[locale];

  return internalLeadSourceLabels[source]?.[locale] ?? source;
}
