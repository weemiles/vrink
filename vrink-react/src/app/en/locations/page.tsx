import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";

import { LocationExplorer } from "../../locations/location-explorer";
import styles from "../../locations/page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Locations",
  description: "Find nearby spaces and partner sites where VRINK Zero Station has been introduced.",
  locale: "en",
  path: "/en/locations",
});

export default function EnglishLocationsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />

      <section className={styles.mapSection} aria-labelledby="locations-heading">
        <div className={styles.sectionHeader}>
          <h2 id="locations-heading">Find a nearby VRINK installation location.</h2>
          <span>Select 1 location to see it on the map right away.</span>
        </div>
        <LocationExplorer locale="en" />
      </section>

      <VrinkFooter ctaHref="/en#contact" locale="en" />
    </main>
  );
}
