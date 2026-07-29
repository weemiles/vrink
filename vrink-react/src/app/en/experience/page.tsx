import type { Metadata } from "next";

import { VrinkExperience } from "@/components/experience/vrink-experience";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Experience VRINK",
  description: "Choose a purpose, functional shot, flavor, and options to experience the VRINK Zero Station drink flow.",
  path: "/en/experience",
});

export default function EnglishExperiencePage() {
  return <VrinkExperience locale="en" />;
}
