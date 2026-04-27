import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LeadForm } from "@/components/forms/lead-form";
import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";

import styles from "../page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "VRINK English",
  description:
    "VRINK Zero Station is a personalized drink system for offices, fitness centers, hospitals, events, and shared spaces.",
  path: "/en",
});

const productScenes = [
  {
    title: "A clear product experience",
    body: "The dispenser and tablet interface sit on one surface, so visitors can choose and make drinks through a simple flow.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "VRINK Zero Station top surface and tablet stand",
  },
  {
    title: "Designed for different spaces",
    body: "A clean white and metal finish helps the station sit naturally in offices, gyms, wellness areas, and pop-up events.",
    image: "/images/vrink/apple/vrink-product-front.png",
    alt: "Front view of VRINK Zero Station",
  },
  {
    title: "Built for daily operation",
    body: "Drink dispensing, drainage, and tablet guidance are arranged together to keep both use and maintenance straightforward.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "Top view of VRINK Zero Station",
  },
];

const useCases = [
  ["Office", "A self-serve drink station for employee wellness and lounge experiences."],
  ["Fitness", "Functional drinks for pre-workout, recovery, and daily conditioning routines."],
  ["Healthcare", "A lighter beverage option for waiting areas, wellness programs, and recovery spaces."],
  ["Events", "A memorable tasting touchpoint where visitors can choose and make their own drink."],
];

const newsItems = [
  {
    title: "VRINK selected for the 18th Kibo Venture Camp",
    source: "The Billiards",
    date: "2026.04",
    body: "The article introduces VRINK's personalized nutrition direction and startup support program selection.",
    image: "/images/vrink/news/vrink-news-consulting.jpg",
    href: "https://www.thebilliards.kr/news/articleView.html?idxno=30505",
  },
  {
    title: "VRINK expands into the fitness wellness market",
    source: "FT Sports",
    date: "2026.04",
    body: "Coverage on VRINK's sports accelerating selection and plans for fitness-centered drink experiences.",
    image: "/images/vrink/news/vrink-news-booth.jpg",
    href: "https://www.ftimes.kr/news/articleView.html?idxno=36836",
  },
];

export default function EnglishPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" variant="overlay" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>VRINK Zero Station</p>
          <h1>A drink system designed for every space.</h1>
          <span>
            Combine flavor, functional shots, concentration, and sparkling intensity to create a personalized drink experience.
          </span>
          <div className={styles.heroActions}>
            <Link href="/en/product" className={styles.primaryButton}>Explore product</Link>
            <Link href="/en#contact" className={styles.linkButton}>Contact us</Link>
          </div>
        </div>
        <div className={styles.heroMedia} aria-hidden="true">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/images/vrink/apple/vrink-product-angle-a.png"
          >
            <source src="/images/vrink/apple/vrink-hero.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section id="product" className={styles.revealSection}>
        <div className={styles.sectionIntro}>
          <p>Product</p>
          <h2>One station, many drink moments.</h2>
        </div>
        <div className={styles.sceneGrid}>
          {productScenes.map((scene) => (
            <article className={styles.sceneCard} key={scene.title}>
              <div className={styles.sceneImage}>
                <Image src={scene.image} alt={scene.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <h3>{scene.title}</h3>
              <p>{scene.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.useCaseSection}>
        <div className={styles.sectionIntro}>
          <p>Spaces</p>
          <h2>Made to fit the rhythm of each place.</h2>
        </div>
        <div className={styles.useCaseGrid}>
          {useCases.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="news" className={styles.newsSection}>
        <div className={styles.sectionIntro}>
          <p>Newsroom</p>
          <h2>Latest updates from VRINK.</h2>
        </div>
        <div className={styles.newsFeature}>
          <div className={styles.newsFeatureImage}>
            <Image src={newsItems[0].image} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
          </div>
          <article className={styles.newsFeatureCopy}>
            <span>{`${newsItems[0].source} · ${newsItems[0].date}`}</span>
            <h3>{newsItems[0].title}</h3>
            <p>{newsItems[0].body}</p>
            <a href={newsItems[0].href} rel="noreferrer" target="_blank">Read article ›</a>
          </article>
        </div>
        <div className={styles.newsGrid}>
          {newsItems.slice(1).map((item) => (
            <article key={item.title} className={styles.newsCard}>
              <div className={styles.newsCardImage}>
                <Image src={item.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <div>
                <span>{`${item.source} · ${item.date}`}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <a href={item.href} rel="noreferrer" target="_blank">Read article ›</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className={styles.contactSection}>
        <div className={styles.contactCopy}>
          <p>Contact</p>
          <h2>Talk to us about your space.</h2>
          <span>
            Share your installation environment, expected traffic, and operating purpose. The VRINK team will help shape the right setup.
          </span>
        </div>
        <LeadForm locale="en" />
      </section>

      <VrinkFooter ctaHref="/en#contact" locale="en" />
    </main>
  );
}
