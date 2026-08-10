import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { ActualKioskDemo } from "@/components/experience/actual-kiosk-demo";
import { LeadForm } from "@/components/forms/lead-form";
import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { FloatingThinkingOrb } from "@/components/motion/floating-thinking-orb";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { LifestyleShowcase } from "@/components/sections/lifestyle-showcase";
import { ManufacturingStory } from "@/components/sections/manufacturing-story";
import { PartnerLogoMarquee } from "@/components/sections/partner-logo-marquee";
import { ShotNutritionSection } from "@/components/sections/shot-nutrition-section";
import { withBasePath } from "@/lib/static-export";
import { buildMetadata } from "@/lib/seo";

import { ExpertReviewBackgroundVideo } from "../detail/expert-review-background-video";
import { ExpertReviewMoreModal } from "../detail/expert-review-more-modal";
import styles from "../page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Personalized Wellness Drinks in 15 Seconds",
  description:
    "VRINK Zero Station prepares personalized wellness drinks in about 15 seconds for offices, gyms, healthcare spaces, and events.",
  locale: "en",
  path: "/en",
});

const productScenes = [
  {
    title: "Choose on the tablet, pour right beside it",
    body: "The selection screen and dispenser sit on one work surface, so first-time users follow the same simple flow.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "VRINK Zero Station top surface and tablet stand",
  },
  {
    title: "A clean fit for your space",
    body: "The restrained white and metal finish fits offices, fitness centers, hospitals, and event spaces without visual noise.",
    image: "/images/vrink/apple/vrink-product-front.png",
    alt: "Front view of VRINK Zero Station",
  },
  {
    title: "Built to be easy to manage",
    body: "Dispensing, drainage, and the tablet stand are organized together, keeping use and checks straightforward.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "Top view of VRINK Zero Station",
  },
];

const systemItems = [
  {
    label: "Smart station",
    title: "A 350ml cup in about 15 seconds",
    body: "The station is designed to keep waits short, even in spaces with steady daily traffic.",
    orb: "working" as const,
    orbDelay: 0,
  },
  {
    label: "Custom blend",
    title: "5 shots and about 1,792 combinations",
    body: "Functional shots, flavor, strength, and sparkling options help each space offer a clear drink choice.",
    orb: "weaving" as const,
    orbDelay: -2.4,
  },
  {
    label: "Operations",
    title: "Ingredient supply and checks together",
    body: "Stock checks, ordering guidance, and routine care are bundled so operators have fewer loose tasks.",
    orb: "connecting" as const,
    orbDelay: -4.8,
  },
];

const adminScreenshots = [
  {
    title: "Live operations dashboard",
    body: "See members, orders, sales, and issues on a single screen.",
    image: "/images/vrink/admin/dashboard-masked.png",
    alt: "VRINK admin dashboard with the branch name masked",
  },
  {
    title: "Store order management",
    body: "Order supplies and follow shipping right from the admin page.",
    image: "/images/vrink/admin/own-mall-masked.png",
    alt: "VRINK admin store ordering screen with the branch name masked",
  },
  {
    title: "Sales analytics",
    body: "Compare sales by period, option mix, and order flow across the day.",
    image: "/images/vrink/admin/sales-masked.png",
    alt: "VRINK admin sales analytics screen with the branch name masked",
  },
];

const useCases = [
  ["Fitness", "Functional shot routines before and after workouts."],
  ["Office", "An always-on drink station for teams and visitors."],
  ["Healthcare & wellness", "A zero-sugar drink option for waiting and wellness spaces."],
  ["Events & pop-ups", "A hands-on drink moment visitors can choose themselves."],
];

const welfareComparisons = [
  {
    label: "Drink benefit model",
    before: "Stocked drink benefits still need storage, expiry checks, and disposal work",
    after: "One cup is made when needed, and people choose flavor and functional shots",
  },
  {
    label: "Employee wellness",
    before: "Choices stay limited and often lean on high-sugar drinks",
    after: "People choose flavor, sparkling, and functional shots on a zero-sugar base",
  },
  {
    label: "Company cost",
    before: "Spend happens when drinks are stocked, not when they are used",
    after: "One cup is made when needed, reducing inventory cost",
  },
  {
    label: "Inventory size",
    before: "Box storage and expiry dates need constant checks",
    after: "Individual drink stock is reduced and ingredients are managed by concentrate",
  },
  {
    label: "Disposal load",
    before: "Empty bottles, cans, and expired drinks become disposal cost",
    after: "Sorting and waste-processing work becomes lighter",
  },
  {
    label: "Operations",
    before: "Purchasing, refilling, and clean-up repeat every time",
    after: "Drink benefits run through one station",
  },
];

const lifestyleImages = [
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1114.jpg",
    alt: "Holding two VRINK drinks",
    position: "center 38%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1094.jpg",
    alt: "Drinking a VRINK beverage",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1085.jpg",
    alt: "Receiving a drink in front of the VRINK station",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1198.jpg",
    alt: "Drinking next to the VRINK station",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1193.jpg",
    alt: "Drinking beside the tablet stand",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1089.jpg",
    alt: "Smiling with a drink in front of the VRINK station",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1138.jpg",
    alt: "Comparing a yellow and a green drink",
    position: "center 40%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1124.jpg",
    alt: "Holding and choosing between two VRINK drinks",
    position: "center 40%",
  },
];

const newsItems = [
  {
    title: "VRINK secures CNT Tech investment, signs 50 clients within three months of launch",
    category: "Press",
    source: "Korea Wood Newspaper",
    date: "2026.07",
    body: "Coverage of VRINK's personalized nutrition dispensing platform, early B2B traction, and investment from CNT Tech.",
    image: "/images/vrink/news/cnt-tech-investment-20260731.jpg",
    href: "https://www.woodkorea.co.kr/news/articleView.html?idxno=90580",
  },
  {
    title: "VRINK raises investment from CNT Tech, reaches 50 clients in three months",
    category: "Press",
    source: "ENet News",
    date: "2026.07",
    body: "A report on VRINK's funding and the 50 client companies secured during the first three months after launch.",
    image: "/images/vrink/news/cnt-tech-investment-20260731.jpg",
    href: "https://www.enetnews.co.kr/news/articleView.html?idxno=52979",
  },
  {
    title: "VRINK named a final pick for CNT Stadium's promising sports startups",
    category: "Press",
    source: "The Electronic Times",
    date: "2026.04",
    body: "Coverage of VRINK as a final selection for the 2026 Sports Accelerating program, CNT Stadium.",
    image: "/images/vrink/news/etnews-cnt-stadium-20260430.jpg",
    href: "https://n.news.naver.com/article/030/0003423393?sid=101",
  },
  {
    title: "VRINK selected for the 18th Kibo Venture Camp, recognized for custom nutrition tech",
    category: "Press",
    source: "The Billiards",
    date: "2026.04",
    body: "An article on VRINK's personalized nutrition direction and its selection for a tech startup support program.",
    image: "/images/vrink/news/vrink-news-consulting.jpg",
    href: "https://www.thebilliards.kr/news/articleView.html?idxno=30505",
  },
  {
    title: "VRINK joins sports accelerating, taking wellness drinks to the fitness market",
    category: "Press",
    source: "FT Sports",
    date: "2026.04",
    body: "Coverage of VRINK's sports accelerating selection and its plans to grow in the fitness market.",
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
          <h1>Personalized wellness drinks, ready in 15 seconds.</h1>
          <span>
            Choose your flavor, functional shot, strength, and sparkling level. VRINK prepares a personalized drink
            in about 15 seconds—built for offices, gyms, healthcare spaces, and events.
          </span>
          <div className={styles.heroActions}>
            <Link href="/en#contact" className={styles.primaryButton}>Get a setup recommendation</Link>
            <Link href="/en/product" className={styles.linkButton}>See the Zero Station</Link>
          </div>
        </div>
        <div className={styles.heroMedia} aria-hidden="true">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={withBasePath("/images/vrink/apple/vrink-hero-still.jpg")}
            preload="auto"
          >
            <source src={withBasePath("/images/vrink/apple/vrink-hero-h264.mp4")} type="video/mp4" />
          </video>
        </div>
      </section>

      <section id="product" className={styles.revealSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>Product</p>
          <h2>Choose, customize, and dispense from one simple interface.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.sceneGrid} stagger>
          {productScenes.map((scene) => (
            <article className={styles.sceneCard} key={scene.title}>
              <div className={styles.sceneImage}>
                <Image src={withBasePath(scene.image)} alt={scene.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <div className={styles.sceneCopy}>
                <h3>{scene.title}</h3>
                <p>{scene.body}</p>
              </div>
            </article>
          ))}
        </ScrollReveal>
      </section>

      <PartnerLogoMarquee locale="en" />

      <section id="usage" className={styles.usageSection} aria-labelledby="usage-title">
        <ActualKioskDemo locale="en" variant="embedded" />
      </section>

      <section id="operations" className={styles.darkSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>Operations</p>
          <h2>Installation, ingredient supply, and maintenance—handled in one service.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.systemGrid} stagger>
          {systemItems.map((item) => (
            <article className={styles.systemItem} key={item.title}>
              <FloatingThinkingOrb delay={item.orbDelay} state={item.orb} />
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </ScrollReveal>
      </section>

      <section className={styles.adminSection} aria-labelledby="admin-dashboard-title">
        <ScrollReveal className={styles.adminCopy}>
          <p>Admin dashboard</p>
          <h2 id="admin-dashboard-title">Monitor station status, orders, and sales from one dashboard.</h2>
          <span>
            After installation, the admin page lets you check site status, store orders, and sales flow in one place.
          </span>
        </ScrollReveal>

        <ScrollReveal className={styles.adminShowcase} aria-label="VRINK admin screenshots" stagger>
          {adminScreenshots.map((item, index) => (
            <figure className={index === 0 ? styles.adminScreenshotPrimary : styles.adminScreenshot} key={item.title}>
              <div className={styles.adminScreenshotImage}>
                <Image src={withBasePath(item.image)} alt={item.alt} fill sizes="(max-width: 720px) 78vw, 31vw" />
              </div>
              <figcaption>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </figcaption>
            </figure>
          ))}
        </ScrollReveal>
        <div className={styles.adminDots} aria-hidden="true">
          {adminScreenshots.map((item, index) => (
            <span className={index === 0 ? styles.adminDotActive : undefined} key={item.title} />
          ))}
        </div>
      </section>

      <ManufacturingStory locale="en" />

      <section id="blend" className={styles.blendSection}>
        <ShotNutritionSection locale="en" />
      </section>

      <section id="expert-review" className={styles.expertSection} aria-labelledby="expert-review-title">
        <div className={styles.expertFrame}>
          <div className={styles.expertVideo} aria-hidden="true">
            <ExpertReviewBackgroundVideo
              locale="en"
              poster={withBasePath("/images/vrink/detail/expert-review-background-0428-poster.jpg")}
              src={withBasePath("/videos/vrink/expert-review-background-0428.mp4")}
            />
          </div>
          <div className={styles.expertCopy}>
            <p>Drinks reviewed by an expert</p>
            <h2 id="expert-review-title">Five functional-shot options, reviewed by a dietitian.</h2>
            <span>
              Each ingredient mix and use moment was reviewed so the drink routine for your space is easier to explain.
            </span>
            <ExpertReviewMoreModal
              locale="en"
              poster={withBasePath("/images/vrink/detail/nutritionist-interview-poster.jpg")}
              src={withBasePath("/videos/vrink/nutritionist-interview-1080p-h264.mp4")}
            />
          </div>
        </div>
      </section>

      <LifestyleShowcase images={lifestyleImages} locale="en" />

      <section id="space" className={styles.useCaseSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>Spaces</p>
          <h2>Designed for the way each space operates.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.useCaseGrid} stagger>
          {useCases.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </ScrollReveal>
      </section>

      <section id="welfare" className={styles.welfareSection} aria-labelledby="welfare-title">
        <ScrollReveal className={styles.welfareIntro}>
          <p>Workplace drink benefits</p>
          <h2 id="welfare-title">Offer made-to-order drinks without stocking cases of bottles and cans.</h2>
          <span>
            VRINK replaces the habit of buying bottled and canned drinks in advance with a station that makes one cup when it is needed.
          </span>
          <small className={styles.welfareIntroNote}>
            *Cost savings can vary by current drink purchasing method, usage volume, and installation environment.
          </small>
        </ScrollReveal>

        <ScrollReveal className={styles.welfareCompare} aria-label="Comparison between stocked drink benefits and VRINK">
          <div className={styles.welfareCompareTop}>
            <article className={styles.welfareCompareProduct}>
              <h3>Current setup</h3>
            </article>
            <article className={styles.welfareCompareProduct}>
              <h3>After VRINK</h3>
            </article>
          </div>

          <div className={styles.welfareSpecRows}>
            {welfareComparisons.map((item) => (
              <div className={styles.welfareSpecRow} key={item.label}>
                <div className={styles.welfareSpecCell}>
                  <span>{item.label}</span>
                  <strong>
                    <X className={styles.welfareStatusIcon} aria-hidden="true" strokeWidth={2.5} />
                    <span>{item.before}</span>
                  </strong>
                </div>
                <div className={`${styles.welfareSpecCell} ${styles.welfareSpecCellAfter}`}>
                  <span>{item.label}</span>
                  <strong>
                    <Check className={styles.welfareStatusIcon} aria-hidden="true" strokeWidth={2.5} />
                    <span>{item.after}</span>
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

      </section>

      <section id="operation" className={styles.operationSection}>
        <ScrollReveal className={styles.operationImage}>
          <Image
            src={withBasePath("/images/vrink/apple/vrink-product-back.png")}
            alt="Back view of VRINK Zero Station"
            fill
            sizes="(max-width: 900px) 100vw, 44vw"
          />
        </ScrollReveal>
        <ScrollReveal className={styles.operationCopy}>
          <p>Operations</p>
          <h2>Manage ingredient supply and routine checks when you need them.</h2>
          <span>
            We help define the routine for maintenance, ingredient supply, consumables, and support around your space.
          </span>
          <ul>
            <li>Ingredient supply guidance based on remaining stock</li>
            <li>Professional install and routine maintenance support</li>
            <li>Setup guidance for events and long-term rollouts</li>
          </ul>
        </ScrollReveal>
      </section>

      <section id="news" className={styles.newsSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>Newsroom</p>
          <h2>See the latest VRINK news at a glance.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.newsLayout}>
          <article className={styles.newsLead}>
            <a className={styles.newsLeadLink} href={newsItems[0].href} rel="noreferrer" target="_blank">
              <div className={styles.newsLeadImage}>
                <Image
                  src={withBasePath(newsItems[0].image)}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 62vw"
                />
              </div>
              <div className={styles.newsLeadCopy}>
                <span className={styles.newsMeta}>{`${newsItems[0].source} · ${newsItems[0].category} · ${newsItems[0].date}`}</span>
                <h3>{newsItems[0].title}</h3>
                <span className={styles.newsCta} aria-hidden="true">Read article ›</span>
              </div>
            </a>
          </article>
          <div className={styles.newsList}>
            {newsItems.slice(1).map((item) => (
              <article key={item.title} className={styles.newsListItem}>
                <a className={styles.newsListLink} href={item.href} rel="noreferrer" target="_blank">
                  <div className={styles.newsListImage}>
                    <Image src={withBasePath(item.image)} alt="" fill sizes="(max-width: 560px) 30vw, 140px" />
                  </div>
                  <div className={styles.newsListCopy}>
                    <span className={styles.newsMeta}>{`${item.source} · ${item.category} · ${item.date}`}</span>
                    <h3>{item.title}</h3>
                    <span className={styles.newsCta} aria-hidden="true">Read article ›</span>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section id="contact" className={styles.contactSection}>
        <ScrollReveal className={styles.contactCopy}>
          <p>Contact</p>
          <h2>Tell us about your space.</h2>
          <span>
            Leave your organization or venue, name, and work email. We’ll follow up with the right questions and
            recommend a Zero Station setup.
          </span>
        </ScrollReveal>
        <LeadForm locale="en" />
      </section>

      <VrinkFooter ctaHref="/en#contact" locale="en" showCta={false} />
    </main>
  );
}
