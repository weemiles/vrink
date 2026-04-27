import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

import styles from "../../legal.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description: "Terms for using the VRINK website, consultation, product information, and support services.",
  path: "/en/terms",
});

const sections = [
  {
    id: "purpose",
    title: "1. Purpose",
    body: [
      "These Terms define the basic conditions for using the VRINK website, product information, consultation forms, support requests, and related online services.",
    ],
  },
  {
    id: "definitions",
    title: "2. Definitions",
    list: [
      "Service: VRINK website, product information, consultation, support, and update subscription features",
      "User: any person or organization accessing or using the Service",
      "Consultation request: a request submitted with installation context, expected traffic, contact information, or related details",
      "Product: VRINK Zero Station, functional shots, ingredients, consumables, and related operating support",
    ],
  },
  {
    id: "changes",
    title: "3. Posting and Changes",
    body: [
      "VRINK posts these Terms on the website. The Terms may be updated due to legal, service, or operational changes, and important changes will be announced through the website.",
    ],
  },
  {
    id: "service",
    title: "4. Services",
    list: [
      "Information about VRINK Zero Station and drink solutions",
      "Consultation, quotation review, and installation feasibility guidance",
      "Support, material requests, and operation-related inquiries",
      "VRINK news, product updates, and installation stories",
    ],
  },
  {
    id: "request",
    title: "5. Consultation and Contracts",
    body: [
      "Submitting a consultation request does not automatically create a purchase, rental, or installation contract. Actual conditions are confirmed through separate consultation, quotation, and contract procedures.",
      "Users should provide accurate information. Users may be responsible for issues caused by incorrect or unauthorized information.",
    ],
  },
  {
    id: "obligations",
    title: "6. User Obligations",
    list: [
      "Do not use false information or another person's personal information.",
      "Do not interfere with the website, consultation system, or support channels.",
      "Do not copy, distribute, or commercially use VRINK product images, descriptions, or materials without permission.",
      "Comply with applicable laws, these Terms, and website guidance.",
    ],
  },
  {
    id: "ip",
    title: "7. Intellectual Property",
    body: [
      "All trademarks, logos, product images, text, graphics, videos, UI, and other content on the website belong to VRINK or their respective rights holders. Unauthorized reproduction, modification, distribution, sale, or derivative use is prohibited.",
    ],
  },
  {
    id: "limitation",
    title: "8. Limitation of Liability",
    body: [
      "VRINK is not liable for service interruptions caused by events beyond reasonable control, including natural disasters, network failures, third-party service issues, or user fault.",
      "Product information on the website is for guidance. Actual configuration, pricing, installation feasibility, and operating conditions may vary after consultation and contracting.",
    ],
  },
  {
    id: "law",
    title: "9. Governing Law",
    body: [
      "These Terms are governed by the laws of the Republic of Korea. Disputes related to the Service will be handled by the competent court under applicable law.",
    ],
  },
  {
    id: "contact",
    title: "10. Contact",
    body: [
      `For questions about these Terms, contact ${siteConfig.contactEmail} or ${siteConfig.contactPhone}.`,
      `${siteConfig.business.companyName} · CEO ${siteConfig.business.owner} · Business No. ${siteConfig.business.registrationNumber}`,
      siteConfig.business.address,
    ],
  },
];

export default function EnglishTermsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Legal</p>
          <h1>Terms of Use</h1>
          <span className={styles.lead}>
            These Terms explain the basic conditions for using the VRINK website and consultation services.
          </span>
          <p className={styles.updated}>Effective date: April 27, 2026</p>
        </div>
      </section>

      <div className={styles.shell}>
        <nav className={styles.sideNav} aria-label="Terms sections">
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>{section.title}</a>
          ))}
        </nav>
        <div className={styles.content}>
          <p className={styles.notice}>
            These Terms apply to the VRINK website, consultation requests, product information, and support services.
          </p>
          {sections.map((section) => (
            <section className={styles.section} id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.list ? <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </section>
          ))}
        </div>
      </div>
      <VrinkFooter ctaHref="/en#contact" locale="en" />
    </main>
  );
}
