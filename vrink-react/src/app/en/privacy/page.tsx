import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

import styles from "../../legal.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How VRINK handles personal information for website inquiries, consultation, and support.",
  path: "/en/privacy",
});

const sections = [
  {
    id: "scope",
    title: "1. Scope",
    body: [
      "This Privacy Policy explains how VRINK collects, uses, stores, and protects personal information through its website, consultation forms, support requests, and related online services.",
    ],
  },
  {
    id: "items",
    title: "2. Information We Collect",
    list: [
      "Consultation and support: company name, contact person, phone number, email address, message, installation context, expected traffic, and operating purpose",
      "Updates subscription: email address",
      "Website usage: IP address, browser information, visit time, cookies, and service usage records",
      "Contract and billing, where applicable: business information and contact details needed for administration",
    ],
  },
  {
    id: "purpose",
    title: "3. Purpose of Use",
    list: [
      "Responding to consultation, quotation, installation, and support requests",
      "Providing product updates, installation stories, and VRINK news",
      "Improving website quality, analyzing usage, and preventing misuse",
      "Supporting contracts, ingredient supply, regular care, and maintenance operations",
    ],
  },
  {
    id: "retention",
    title: "4. Retention",
    body: [
      "VRINK keeps personal information only for as long as needed for the stated purposes, unless a longer retention period is required by law or necessary for dispute handling.",
    ],
  },
  {
    id: "sharing",
    title: "5. Sharing and Processing Partners",
    body: [
      "VRINK does not disclose personal information to third parties without consent, unless required by law. We may use trusted service providers for hosting, email, inquiry management, accounting, or related operations, and we limit processing to the necessary scope.",
    ],
  },
  {
    id: "rights",
    title: "6. Your Rights",
    body: [
      "You may request access, correction, deletion, suspension of processing, or withdrawal of consent for your personal information. Requests can be sent through the contact information below.",
    ],
  },
  {
    id: "security",
    title: "7. Security",
    list: [
      "Limited access to personal information",
      "Technical safeguards such as access control and logging",
      "Restricted storage of consultation and contract materials",
      "Internal management and training for staff handling personal information",
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies",
    body: [
      "VRINK may use cookies or similar technologies to improve usability, analyze website traffic, and enhance service quality. You can block or delete cookies through your browser settings.",
    ],
  },
  {
    id: "contact",
    title: "9. Contact",
    body: [
      `For privacy inquiries, contact ${siteConfig.contactEmail} or ${siteConfig.contactPhone}.`,
      `${siteConfig.business.companyName} · CEO ${siteConfig.business.owner} · Business No. ${siteConfig.business.registrationNumber}`,
      siteConfig.business.address,
    ],
  },
];

export default function EnglishPrivacyPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Legal</p>
          <h1>Privacy Policy</h1>
          <span className={styles.lead}>
            VRINK collects only the information needed for consultation, support, and service updates, and manages it with care.
          </span>
          <p className={styles.updated}>Effective date: April 27, 2026</p>
        </div>
      </section>

      <div className={styles.shell}>
        <nav className={styles.sideNav} aria-label="Privacy Policy sections">
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>{section.title}</a>
          ))}
        </nav>
        <div className={styles.content}>
          <p className={styles.notice}>
            This policy applies to the VRINK website, consultation requests, and support channels.
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
