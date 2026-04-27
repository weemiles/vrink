import type { Metadata } from "next";

import { LeadForm } from "@/components/forms/lead-form";
import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";

import styles from "../../support/page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Support",
  description:
    "Frequently asked questions and consultation information for VRINK installation, operation, hygiene, functional shots, and event use.",
  path: "/en/support",
});

const categories = [
  ["FAQ", "#faq"],
  ["Consultation", "#intro"],
  ["Installation", "#install"],
  ["Operation", "#operation"],
  ["Shots & drinks", "#blend"],
  ["Hygiene", "#clean"],
  ["Events", "#event"],
  ["Inquiry", "#inquiry"],
];

const faqGroups = [
  {
    id: "intro",
    title: "Consultation",
    items: [
      [
        "What types of spaces can install VRINK?",
        "VRINK can be planned for offices, fitness centers, hospitals, wellness spaces, events, and pop-ups where continuous operation or visitor experience matters.",
      ],
      [
        "How does the introduction process work?",
        "After your inquiry, we review the space conditions and expected usage, then move through proposal, quotation, agreement, installation, and operation care.",
      ],
      [
        "Can we discuss both purchase and rental options?",
        "Yes. We can review the right introduction model based on operating period, expected usage, and installation conditions.",
      ],
    ],
  },
  {
    id: "install",
    title: "Installation",
    items: [
      [
        "What should we prepare before installation?",
        "Please share the installation area, power and water conditions, expected users, and operating period so we can suggest the right setup faster.",
      ],
      [
        "How does on-site installation proceed?",
        "After a pre-check, installation and basic usage guidance are provided on the agreed schedule. For events, we also review traffic flow and operating hours.",
      ],
    ],
  },
  {
    id: "operation",
    title: "Operation",
    items: [
      [
        "How are ingredients managed?",
        "We plan ingredient supply based on usage and remaining volume, and guide regular delivery and operation standards.",
      ],
      [
        "How are regular checks handled?",
        "Checks cover equipment condition, the dispensing area, consumables, and ingredient usage flow to keep operation stable.",
      ],
    ],
  },
  {
    id: "blend",
    title: "Shots & drinks",
    items: [
      [
        "How are shots and flavors selected?",
        "We recommend combinations of Booster, Vitamin, Relax, Cutting, and Amino shots with flavors based on the purpose of the space and user preference.",
      ],
      [
        "Where can I check nutrition information?",
        "Nutrition information for each shot can be viewed in the functional shot section on the homepage, and additional materials can be shared during consultation.",
      ],
    ],
  },
  {
    id: "clean",
    title: "Hygiene",
    items: [
      [
        "How is hygiene managed?",
        "VRINK provides operation standards based on filtration, automatic cleaning features, and regular check guidance.",
      ],
      [
        "Can it operate reliably in high-traffic spaces?",
        "We plan ingredient supply, check cycles, and user guidance according to expected usage and operating hours.",
      ],
    ],
  },
  {
    id: "event",
    title: "Events",
    items: [
      [
        "Can VRINK be used for short-term events?",
        "Yes. Pop-ups, conferences, and promotions can be discussed under event-specific conditions.",
      ],
      [
        "Can the setup match event traffic flow?",
        "We review visitor flow, waiting time, power, and water conditions to suggest the right layout and operation plan.",
      ],
    ],
  },
];

export default function EnglishSupportPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p>Support</p>
          <h1>VRINK Support</h1>
          <span>
            Find answers about introduction, installation, operation, hygiene, and drink configuration in one place.
          </span>
          <nav className={styles.categoryNav} aria-label="Support categories">
            {categories.map(([label, href], index) => (
              <a className={index === 0 ? styles.activeCategory : ""} href={href} key={label}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section id="faq" className={styles.faqSection}>
        <div className={styles.faqShell}>
          {faqGroups.map((group) => (
            <section className={styles.faqGroup} id={group.id} key={group.id}>
              <div className={styles.groupHeader}>
                <p>{group.title}</p>
              </div>
              <div className={styles.faqList}>
                {group.items.map(([question, answer]) => (
                  <details key={question}>
                    <summary>
                      <span>Q. {question}</span>
                    </summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section id="inquiry" className={styles.inquirySection}>
        <div className={styles.inquiryGrid}>
          <div className={styles.inquiryCopy}>
            <p>Inquiry</p>
            <h2>Talk to us about the right setup for your space.</h2>
            <span>
              Share your installation environment, expected users, and operating purpose. The VRINK team will review and respond.
            </span>
          </div>
          <div className={styles.formPanel}>
            <LeadForm locale="en" />
          </div>
        </div>
      </section>

      <VrinkFooter ctaHref="/en/support#inquiry" locale="en" />
    </main>
  );
}
