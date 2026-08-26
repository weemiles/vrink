import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { getNewsItems } from "@/content/news";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "뉴스룸",
  description: "브링크의 제품, 기술, 파트너십과 관련된 최신 언론 보도를 확인하세요.",
  path: "/news",
});

const newsItems = getNewsItems("ko");

export default function NewsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader variant="default" />

      <section className={styles.hero} aria-labelledby="newsroom-heading">
        <div className={styles.heroCopy}>
          <p>뉴스룸</p>
          <h1 id="newsroom-heading">브링크의 새로운 소식을 전합니다.</h1>
          <span>제품과 기술, 파트너십에 관한 브링크의 언론 보도를 최신순으로 확인하세요.</span>
        </div>
      </section>

      <section className={styles.archive} aria-labelledby="press-heading">
        <header className={styles.archiveHeader}>
          <h2 id="press-heading">언론 보도</h2>
          <p>{`최신순 · 전체 ${newsItems.length}건`}</p>
        </header>

        <div className={styles.archiveGrid}>
          {newsItems.map((item) => (
            <article className={styles.article} key={item.id}>
              <a
                aria-label={`${item.title} — 새 창에서 기사 원문 보기`}
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
                    기사 원문 보기
                    <ArrowUpRight strokeWidth={1.5} />
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </section>

      <VrinkFooter ctaHref="/#contact" />
    </main>
  );
}
