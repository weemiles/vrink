import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";

import { LocationExplorer } from "../../locations/location-explorer";
import styles from "../../locations/page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Locations",
  description: "Explore spaces and partner sites where VRINK Zero Station has been introduced.",
  locale: "en",
  path: "/en/locations",
});

export default function EnglishLocationsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />

      <section className={styles.mapSection} aria-labelledby="locations-heading">
        <div className={styles.sectionHeader}>
          <h2 id="locations-heading">VRINK Installation Locations</h2>
          <span>Select a location from the list to move to that site on the map.</span>
        </div>
        <LocationExplorer locale="en" />
      </section>

      <VrinkFooter ctaHref="/en#contact" locale="en" />
    </main>
  );
}
