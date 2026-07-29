import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

import styles from "../../legal.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description: "Terms for using the VRINK website, consultation, product information, and support services.",
  locale: "en",
  path: "/en/terms",
});

const englishBusinessInfo = {
  companyName: "VRINK Co., Ltd.",
  owner: "Minsoo Kim",
  registrationNumber: siteConfig.business.registrationNumber,
  address: "46 Dongnam-ro 406beon-gil, Hanam-si, Gyeonggi-do, Korea",
};

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
    id: "company",
    title: "7. Company Obligations",
    body: [
      "VRINK makes reasonable efforts to keep the Service stable and takes the measures needed for privacy protection and security so you can use the Service safely.",
    ],
  },
  {
    id: "ip",
    title: "8. Intellectual Property",
    body: [
      "All trademarks, logos, product images, text, graphics, videos, UI, and other content on the website belong to VRINK or their respective rights holders. You can't reproduce, modify, distribute, sell, or create derivative works from it without prior consent.",
    ],
  },
  {
    id: "limitation",
    title: "9. Limitation of Liability",
    body: [
      "VRINK isn't liable for service interruptions caused by events beyond reasonable control, including natural disasters, network failures, third-party service issues, or user fault.",
      "Product information on the website is for guidance. Actual configuration, pricing, installation feasibility, and operating conditions may vary after consultation and contracting.",
    ],
  },
  {
    id: "suspension",
    title: "10. Service Suspension",
    body: [
      "VRINK may temporarily suspend all or part of the Service for system maintenance, security measures, service improvements, or operational needs. We'll let you know in advance whenever we can.",
    ],
  },
  {
    id: "law",
    title: "11. Governing Law",
    body: [
      "These Terms are governed by the laws of the Republic of Korea. If a dispute arises in connection with the Service, the competent court under applicable law will have first-instance jurisdiction.",
    ],
  },
  {
    id: "contact",
    title: "12. Contact",
    body: [
      `For questions about the Service or these Terms, reach us at ${siteConfig.contactEmail} or ${siteConfig.contactPhone}.`,
      `Company name: ${englishBusinessInfo.companyName}`,
      `Representative: ${englishBusinessInfo.owner}`,
      `Business registration number: ${englishBusinessInfo.registrationNumber}`,
      `Business address: ${englishBusinessInfo.address}`,
      `Phone: ${siteConfig.contactPhone}`,
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
