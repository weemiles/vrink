import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";

import { LocationExplorer } from "./location-explorer";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "도입 지점",
  description: "브링크 제로스테이션이 도입된 공간을 지도에서 확인하고 가까운 지점을 찾아보세요.",
  path: "/locations",
});

export default function LocationsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />

      <section className={styles.mapSection} aria-labelledby="locations-heading">
        <div className={styles.sectionHeader}>
          <h1 id="locations-heading">가까운 브링크 설치 지점을 찾아보세요.</h1>
          <span>지점 1곳을 선택하면 지도에서 바로 위치를 확인할 수 있습니다.</span>
        </div>
        <LocationExplorer />
      </section>

      <VrinkFooter />
    </main>
  );
}
