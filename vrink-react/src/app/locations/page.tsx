import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";

import { LocationExplorer } from "./location-explorer";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "도입 지점",
  description: "브링크 제로스테이션이 도입된 공간과 지점 정보를 지도에서 확인할 수 있습니다.",
  path: "/locations",
});

export default function LocationsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />

      <section className={styles.mapSection} aria-labelledby="locations-heading">
        <div className={styles.sectionHeader}>
          <h2 id="locations-heading">브링크 설치 지점</h2>
          <span>왼쪽 지점 리스트를 선택하면 지도에서 해당 위치로 이동합니다.</span>
        </div>
        <LocationExplorer />
      </section>

      <VrinkFooter />
    </main>
  );
}
