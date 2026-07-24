import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CookieSettingsPopup } from "@/components/consent/cookie-settings-popup";
import { ActualKioskDemo } from "@/components/experience/actual-kiosk-demo";
import { LeadForm } from "@/components/forms/lead-form";
import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { IntroOfferModal } from "@/components/promotions/intro-offer-modal";
import { LifestyleShowcase } from "@/components/sections/lifestyle-showcase";
import { PartnerLogoMarquee } from "@/components/sections/partner-logo-marquee";
import { ShotNutritionSection } from "@/components/sections/shot-nutrition-section";
import { withBasePath } from "@/lib/static-export";
import { buildMetadata } from "@/lib/seo";

import { ExpertReviewBackgroundVideo } from "../detail/expert-review-background-video";
import { ExpertReviewMoreModal } from "../detail/expert-review-more-modal";
import styles from "../page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "15-Second Drink Station for Every Space",
  description:
    "VRINK Zero Station lets people choose functional shots, flavor, strength, and sparkling options in about 15 seconds for offices, gyms, hospitals, and events.",
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
  },
  {
    label: "Custom blend",
    title: "5 shots and about 1,792 combinations",
    body: "Functional shots, flavor, strength, and sparkling options help each space offer a clear drink choice.",
  },
  {
    label: "Operations",
    title: "Ingredient supply and checks together",
    body: "Stock checks, ordering guidance, and routine care are bundled so operators have fewer loose tasks.",
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
          <h1>A 15-second cup for your space.</h1>
          <span>
            Combine 5 functional shots with flavor, strength, and sparkling options for offices, gyms, hospitals,
            and events.
          </span>
          <div className={styles.heroActions}>
            <Link href="/en/product" className={styles.primaryButton}>View product</Link>
            <Link href="/en#contact" className={styles.linkButton}>Get a setup plan</Link>
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
          <h2>Choose and pour on one clear work surface.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.sceneGrid} stagger>
          {productScenes.map((scene) => (
            <article className={styles.sceneCard} key={scene.title}>
              <div className={styles.sceneImage}>
                <Image src={withBasePath(scene.image)} alt={scene.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <h3>{scene.title}</h3>
              <p>{scene.body}</p>
            </article>
          ))}
        </ScrollReveal>
      </section>

      <PartnerLogoMarquee locale="en" />

      <section id="usage" className={styles.usageSection} aria-labelledby="usage-title">
        <ActualKioskDemo locale="en" variant="embedded" />
      </section>

      <section className={styles.darkSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>Operations</p>
          <h2>Installation and ingredient care run in one flow.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.systemGrid} stagger>
          {systemItems.map((item) => (
            <article className={styles.systemItem} key={item.title}>
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
          <h2 id="admin-dashboard-title">See status, orders, and sales on one screen.</h2>
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
            <h2 id="expert-review-title">A dietitian reviewed the 5 functional shots.</h2>
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
          <h2>Each space gets a clear use case.</h2>
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
          <h2 id="welfare-title">Give employees drinks without stacking them in storage.</h2>
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
                  <strong>{item.before}</strong>
                </div>
                <div className={`${styles.welfareSpecCell} ${styles.welfareSpecCellAfter}`}>
                  <span>{item.label}</span>
                  <strong>{item.after}</strong>
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
          <h2>Manage ingredients and checks when they are needed.</h2>
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
        <ScrollReveal className={styles.newsFeature}>
          <div className={styles.newsFeatureImage}>
            <Image src={withBasePath(newsItems[0].image)} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" />
          </div>
          <article className={styles.newsFeatureCopy}>
            <span>{`${newsItems[0].source} · ${newsItems[0].category} · ${newsItems[0].date}`}</span>
            <h3>{newsItems[0].title}</h3>
            <p>{newsItems[0].body}</p>
            <a href={newsItems[0].href} rel="noreferrer" target="_blank">Read article ›</a>
          </article>
        </ScrollReveal>
        <ScrollReveal className={styles.newsGrid} stagger>
          {newsItems.slice(1).map((item) => (
            <article key={item.title} className={styles.newsCard}>
              <div className={styles.newsCardImage}>
                <Image src={withBasePath(item.image)} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <div>
                <span>{`${item.source} · ${item.category} · ${item.date}`}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <a href={item.href} rel="noreferrer" target="_blank">Read article ›</a>
              </div>
            </article>
          ))}
        </ScrollReveal>
      </section>

      <section id="contact" className={styles.contactSection}>
        <ScrollReveal className={styles.contactCopy}>
          <p>Contact</p>
          <h2>Share setup details and source.</h2>
          <span>
            Tell us your space type, expected users, timeline, and how you found VRINK. Our team will review and follow up.
          </span>
        </ScrollReveal>
        <LeadForm locale="en" />
      </section>

      <VrinkFooter ctaHref="/en#contact" locale="en" />
      <IntroOfferModal locale="en" />
      <CookieSettingsPopup locale="en" />
    </main>
  );
}
