import type { Metadata } from "next";

import { VrinkExperience } from "@/components/experience/vrink-experience";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "브링크 체험",
  description: "목적, 기능샷, 맛과 옵션을 직접 고르며 브링크 제로스테이션의 음료 선택 흐름을 체험하세요.",
  path: "/experience",
});

export default function ExperiencePage() {
  return <VrinkExperience />;
}
