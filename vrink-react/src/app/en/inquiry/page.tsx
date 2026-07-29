import type { Metadata } from "next";
import Image from "next/image";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import { InquiryForm } from "../../inquiry/inquiry-form";
import styles from "../../inquiry/page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Report an Issue",
  description:
    "Report a VRINK issue with your location, contact details, and situation so our team can follow up.",
  locale: "en",
  path: "/en/inquiry",
});

export default function EnglishInquiryPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <Image
            className={styles.heroIcon}
            src={withBasePath("/images/vrink/support/inquiry-alert-clean.png")}
            alt=""
            width={120}
            height={120}
            priority
            unoptimized
          />
          <p>Issue report</p>
          <h1>Report an issue in about 3 minutes.</h1>
          <span>
            Leave the location, contact details, and situation. Our team will review it in order.
          </span>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formShell}>
          <InquiryForm locale="en" />
        </div>
      </section>

      <VrinkFooter ctaHref="/en/inquiry" locale="en" />
    </main>
  );
}
