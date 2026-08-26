import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { getNewsItems } from "@/content/news";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import styles from "../../news/page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Newsroom",
  description: "Read the latest coverage of VRINK products, technology, partnerships, and business milestones.",
  locale: "en",
  path: "/en/news",
});

const newsItems = getNewsItems("en");

export default function EnglishNewsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" variant="default" />

      <section className={styles.hero} aria-labelledby="newsroom-heading">
        <div className={styles.heroCopy}>
          <p>Newsroom</p>
          <h1 id="newsroom-heading">The latest news from VRINK.</h1>
          <span>Read the latest coverage of VRINK products, technology, partnerships, and business milestones.</span>
        </div>
      </section>

      <section className={styles.archive} aria-labelledby="press-heading">
        <header className={styles.archiveHeader}>
          <h2 id="press-heading">Press coverage</h2>
          <p>{`Newest first · ${newsItems.length} articles`}</p>
        </header>

        <div className={styles.archiveGrid}>
          {newsItems.map((item) => (
            <article className={styles.article} key={item.id}>
              <a
                aria-label={`${item.title} — opens article in a new tab`}
                className={styles.articleLink}
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                <div className={styles.articleImage}>
                  <Image
                    src={withBasePath(item.image)}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 100vw, 50vw"
                  />
                </div>
                <div className={styles.articleCopy}>
                  <span className={styles.articleMeta}>{`${item.source} · ${item.category} · ${item.date}`}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <span className={styles.articleCta} aria-hidden="true">
                    Read the original article
                    <ArrowUpRight strokeWidth={1.5} />
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </section>

      <VrinkFooter ctaHref="/en#contact" locale="en" />
    </main>
  );
}
