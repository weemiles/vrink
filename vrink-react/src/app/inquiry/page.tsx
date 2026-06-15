import type { Metadata } from "next";
import Image from "next/image";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import { InquiryForm } from "./inquiry-form";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "불편접수",
  description: "브링크 이용 중 불편했던 내용을 접수하면 담당자가 확인 후 안내드립니다.",
  path: "/inquiry",
});

export default function InquiryPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />

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
          <p>불편접수</p>
          <h1>이용 중 불편했던 점을 알려주세요.</h1>
          <span>
            남겨주신 내용은 담당자가 확인한 뒤 순서대로 안내드릴게요.
          </span>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formShell}>
          <InquiryForm />
        </div>
      </section>

      <VrinkFooter ctaHref="/support#inquiry" />
    </main>
  );
}
