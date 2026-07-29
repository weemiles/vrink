import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

import styles from "../../legal.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How VRINK handles personal information for website inquiries, consultation, and support.",
  locale: "en",
  path: "/en/privacy",
});

const englishBusinessInfo = {
  companyName: "VRINK Co., Ltd.",
  owner: "Minsoo Kim",
  registrationNumber: siteConfig.business.registrationNumber,
  address: "46 Dongnam-ro 406beon-gil, Hanam-si, Gyeonggi-do, Korea",
};

const sections = [
  {
    id: "scope",
    title: "1. General Provisions and Scope",
    body: [
      "VRINK Inc. takes your personal information seriously and publishes this Privacy Policy to comply with applicable data protection laws.",
      "This policy applies to the official VRINK website, consultation requests, resource requests, customer support inquiries, and related online services.",
    ],
  },
  {
    id: "items",
    title: "2. Information We Collect",
    list: [
      "Consultation and inquiries: company/organization name, contact person, phone number, email, message, installation space, and expected usage details",
      "Updates subscription: email address",
      "During service use: IP address, browser information, visit time, cookies, and service usage records",
      "When a contract or billing applies: business information, contact details, and information needed to issue tax invoices",
      "Live chat support: conversation content (messages), the page address you visited during the chat, and access time",
    ],
  },
  {
    id: "purpose",
    title: "3. Purpose of Use",
    list: [
      "Handling consultation, quotations, installation eligibility checks, and customer inquiries",
      "Sharing VRINK news such as product updates, installation stories, and operating guides",
      "Improving service quality, analyzing website usage, and preventing misuse and fraud",
      "Supporting contract fulfillment, ingredient supply, regular maintenance, after-sales service, and operations",
      "Handling live chat support and improving support quality",
    ],
  },
  {
    id: "retention",
    title: "4. Retention and Use Period",
    body: [
      "VRINK destroys personal information without delay once the purpose of collection and use is achieved. However, we may keep it for the required period when retention is mandated by law or necessary for dispute handling.",
    ],
    list: [
      "Consultation and inquiry records: 3 years from the date received",
      "Live chat support records: 90 days from the last message",
      "Contract and transaction records: the retention period required by applicable law",
      "Website access logs: the period needed for service operation and security",
    ],
  },
  {
    id: "sharing",
    title: "5. Sharing and Processing Partners",
    body: [
      "VRINK does not provide personal information to third parties without your consent. Exceptions apply only when there is a legal basis or when you have given prior consent.",
      "During service operation, we may entrust tasks such as cloud infrastructure, email delivery, inquiry management, and payment and accounting to external services. In those cases, we make sure personal information is processed only within the necessary scope.",
    ],
  },
  {
    id: "rights",
    title: "6. Your Rights and How to Exercise Them",
    body: [
      "You can request access, correction, deletion, suspension of processing, or withdrawal of consent for your personal information at any time. Requests can be submitted by email or through our support channels, and VRINK will handle them without delay in accordance with applicable law.",
    ],
  },
  {
    id: "security",
    title: "7. Security Measures",
    list: [
      "Minimizing access rights to personal information and operating internal management standards",
      "Technical safeguards such as secure connections, access control, and log management",
      "Limiting the storage scope of consultation and contract materials",
      "Training and managing staff who handle personal information",
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies and Similar Technologies",
    body: [
      "The VRINK website may use cookies or similar technologies to improve usability, analyze visit flows, and enhance service quality. You can block or delete cookies through your browser settings.",
    ],
  },
  {
    id: "contact",
    title: "9. Privacy Inquiries",
    body: [
      `For privacy-related inquiries, contact us at ${siteConfig.contactEmail} or ${siteConfig.contactPhone}.`,
      `Company name: ${englishBusinessInfo.companyName}`,
      `CEO: ${englishBusinessInfo.owner}`,
      `Business registration number: ${englishBusinessInfo.registrationNumber}`,
      `Business address: ${englishBusinessInfo.address}`,
      `Phone: ${siteConfig.contactPhone}`,
    ],
  },
  {
    id: "changes",
    title: "10. Notice and Revisions",
    body: [
      "This Privacy Policy may be revised to reflect changes in laws, services, or internal operating standards. If there's a significant change, we'll let you know in advance through the website.",
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
