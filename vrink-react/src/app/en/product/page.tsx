import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headphones, ShieldCheck, Wrench } from "lucide-react";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";

import styles from "../../product/page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Product",
  description:
    "Explore VRINK Zero Station, a personalized drink system that combines selection, serving, and operation care.",
  path: "/en/product",
});

const productIntroTiles = [
  {
    eyebrow: "Personal Recipe",
    title: "A drink matched to taste and condition",
    body: "Functional shots, flavors, concentration, and sparkling intensity come together in one personalized recipe.",
    image: "/images/vrink/lifestyle/vrink-lifestyle-1198.jpg",
    alt: "A user drinking a VRINK beverage beside the station",
  },
  {
    eyebrow: "Fast Serving",
    title: "A serving flow completed in about 11 seconds",
    body: "Based on a 350ml drink, the station helps reduce waiting time in offices, fitness centers, and busy events.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "Top view of the VRINK Zero Station dispensing area",
  },
  {
    eyebrow: "Station Design",
    title: "Selection and serving on one surface",
    body: "The tablet interface and dispenser are arranged together, making the flow intuitive for first-time users.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "VRINK Zero Station work surface and tablet stand",
  },
  {
    eyebrow: "Operation Care",
    title: "Operation built around refills, hygiene, and checks",
    body: "VRINK helps plan ingredient supply, consumables, hygiene checks, and ongoing maintenance after installation.",
    image: "/images/vrink/apple/vrink-product-back.png",
    alt: "Rear view of VRINK Zero Station",
  },
];

const galleryMoments = [
  {
    image: "/images/vrink/lifestyle/vrink-lifestyle-1114.jpg",
    alt: "User holding two VRINK drinks",
  },
  {
    image: "/images/vrink/lifestyle/vrink-lifestyle-1094.jpg",
    alt: "User drinking a green VRINK beverage",
  },
  {
    image: "/images/vrink/lifestyle/vrink-lifestyle-1138.jpg",
    alt: "VRINK drink experience at the station",
  },
];

const proofStories = [
  {
    title: "A smart drink system for space operation",
    body: "VRINK connects beverage service with welfare, brand experience, and operation management.",
    image: "/images/vrink/news/vrink-news-consulting.jpg",
    alt: "VRINK consultation scene",
  },
  {
    title: "A station people can experience on site",
    body: "At exhibitions, pop-ups, and company spaces, visitors can choose, make, and taste their own drink.",
    image: "/images/vrink/news/vrink-news-booth.jpg",
    alt: "VRINK booth scene",
  },
];

const fieldCards = [
  {
    title: "Office",
    body: "Always-on drinks for employee wellness and visitor hospitality.",
    image: "/images/vrink/lifestyle/vrink-office.jpg",
    alt: "VRINK drink scene for office spaces",
  },
  {
    title: "Fitness",
    body: "Functional shots and hydration routines before and after workouts.",
    image: "/images/vrink/lifestyle/vrink-fitness.png",
    alt: "Users drinking VRINK beverages in a fitness space",
  },
  {
    title: "Events",
    body: "A customized serving experience that increases brand participation.",
    image: "/images/vrink/news/ftimes-36836.jpg",
    alt: "VRINK event image",
  },
];

const features = [
  {
    title: "Choice that starts and ends on one station",
    body: "Users choose a purpose and flavor on the tablet, then receive the drink right next to it through a clear serving flow.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "VRINK Zero Station top and tablet stand",
  },
  {
    title: "A fast flow for high-traffic spaces",
    body: "The station is designed for repeated use in offices, fitness centers, hospitals, events, and shared environments.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "VRINK Zero Station top structure",
  },
  {
    title: "Personalized drinks with functional shots",
    body: "Booster, Vitamin, Relax, Cutting, and Amino shots can be combined with flavor, concentration, and sparkling options.",
    image: "/images/vrink/lifestyle/vrink-lifestyle-1114.jpg",
    alt: "User holding two VRINK drinks",
  },
  {
    title: "A structure designed for operators",
    body: "Ingredient supply, consumables, regular checks, and hygiene routines are considered as part of the installation plan.",
    image: "/images/vrink/apple/vrink-product-back.png",
    alt: "Rear view of VRINK Zero Station",
  },
];

const serviceItems = [
  {
    icon: Headphones,
    title: "Consultation",
    body: "We recommend a setup based on space goals and expected usage.",
  },
  {
    icon: Wrench,
    title: "Operation support",
    body: "Ingredient supply and consumable management are planned together.",
  },
  {
    icon: ShieldCheck,
    title: "Regular care",
    body: "We help keep hygiene and equipment condition stable over time.",
  },
];

const finalHighlights = [
  "About 11 seconds per drink",
  "Approx. 1,750 combinations",
  "5 functional shots",
  "Custom ingredient setup",
  "Regular check support",
  "Office, fitness, and event use",
];

export default function EnglishProductPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>VRINK Zero Station</p>
          <h1>A smart drink system shaped around your space</h1>
          <span>
            VRINK connects selection, serving, and operation care into one drink experience for offices, fitness centers, events, and wellness spaces.
          </span>
          <div className={styles.heroActions}>
            <Link href="/en#contact" className={styles.primaryButton}>
              Contact us
              <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
            </Link>
            <Link href="#features" className={styles.linkButton}>
              View features
              <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/images/vrink/apple/vrink-product-angle-b.png"
            alt="VRINK Zero Station product"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 62vw"
          />
        </div>
      </section>

      <section id="features" className={styles.productIntroSection} aria-labelledby="product-intro-title">
        <div className={styles.productIntroCopy}>
          <h2 id="product-intro-title">
            VRINK Zero Station brings selection, serving, and operation into a single product experience.
            Functional shots, flavors, concentration, and sparkling options create different drinks for different spaces.
          </h2>
        </div>
        <div className={styles.productIntroGrid}>
          {productIntroTiles.map((tile, index) => (
            <article className={styles.productIntroTile} key={tile.title}>
              <Image
                src={tile.image}
                alt={tile.alt}
                fill
                loading={index < 2 ? "eager" : "lazy"}
                sizes="(max-width: 980px) 100vw, 50vw"
              />
              <div className={styles.productIntroTileCopy}>
                <p>{tile.eyebrow}</p>
                <h3>{tile.title}</h3>
                <span>{tile.body}</span>
                <Link href="/en#contact">
                  Contact
                  <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.gallerySection} aria-labelledby="gallery-title">
        <div className={styles.galleryCopy}>
          <p>Scene</p>
          <h2 id="gallery-title">When VRINK enters a space, drinks become an experience people return to.</h2>
        </div>
        <div className={styles.galleryGrid}>
          {galleryMoments.map((moment) => (
            <figure className={styles.galleryItem} key={moment.image}>
              <Image src={moment.image} alt={moment.alt} fill sizes="(max-width: 780px) 100vw, 33vw" />
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.proofSection} aria-labelledby="proof-title">
        <div className={styles.sectionHeading}>
          <p>Innovation</p>
          <h2 id="proof-title">A new drink experience for the front line of space operation.</h2>
          <span>From exhibitions to real usage, VRINK is designed to make personalized drinks easy to experience.</span>
        </div>
        <div className={styles.proofGrid}>
          {proofStories.map((story) => (
            <article className={styles.proofCard} key={story.title}>
              <div className={styles.proofImage}>
                <Image src={story.image} alt={story.alt} fill sizes="(max-width: 760px) 100vw, 38vw" />
              </div>
              <div>
                <h3>{story.title}</h3>
                <p>{story.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.fieldSection} aria-labelledby="field-title">
        <div className={styles.sectionHeading}>
          <p>Fields</p>
          <h2 id="field-title">Configured around the purpose of each space.</h2>
        </div>
        <div className={styles.fieldGrid}>
          {fieldCards.map((field) => (
            <article className={styles.fieldCard} key={field.title}>
              <Image src={field.image} alt={field.alt} fill sizes="(max-width: 760px) 100vw, 31vw" />
              <div>
                <h3>{field.title}</h3>
                <p>{field.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.featureStack}>
        {features.map((feature, index) => (
          <article className={styles.featureRow} key={feature.title}>
            <div className={styles.featureImage}>
              <Image src={feature.image} alt={feature.alt} fill sizes="(max-width: 980px) 100vw, 52vw" />
            </div>
            <div className={styles.featureCopy}>
              <p>{String(index + 1).padStart(2, "0")}</p>
              <h2>{feature.title}</h2>
              <span>{feature.body}</span>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.serviceStrip} aria-label="VRINK installation support">
        {serviceItems.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title}>
              <Icon aria-hidden="true" size={26} strokeWidth={1.65} />
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          );
        })}
      </section>

      <section className={styles.finalProductSection} aria-labelledby="final-product-title">
        <div className={styles.finalProductCopy}>
          <p>VRINK Zero Station</p>
          <h2 id="final-product-title">VRINK ZERO STATION</h2>
          <span>A smart drink system that brings water, sparkling, and functional shots into one station.</span>
        </div>
        <div className={styles.finalProductImage}>
          <Image
            src="/images/vrink/apple/vrink-product-angle-a.png"
            alt="VRINK Zero Station product image"
            fill
            sizes="(max-width: 900px) 100vw, 860px"
          />
        </div>
        <ul className={styles.finalProductFeatures} aria-label="Product highlights">
          {finalHighlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
        <div className={styles.finalProductPurchase}>
          <p>
            <span>Starting price</span>
            <strong>8,800,000 KRW</strong>
          </p>
          <Link href="/en#contact">Contact us</Link>
        </div>
      </section>

      <VrinkFooter ctaHref="/en#contact" locale="en" />
    </main>
  );
}
