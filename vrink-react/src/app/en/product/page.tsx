import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headphones, ShieldCheck, Wrench } from "lucide-react";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import styles from "../../product/page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Product",
  description:
    "Explore VRINK Zero Station's 15-second serving flow, 5 functional shots, and operation care structure.",
  locale: "en",
  path: "/en/product",
});

const mobileFeatureStats = [
  {
    value: "15 sec",
    label: "Avg make time",
  },
  {
    value: "2,000ml",
    label: "Sparkling output",
  },
  {
    value: "24H",
    label: "Always on",
  },
  {
    value: "0.1s",
    label: "Custom step",
  },
];

const mobileFeatureNav = [
  ["Overview", "#features"],
  ["Specs", "#specifications"],
  ["Technology", "#technology"],
  ["Contact", "/en#contact"],
];

const productIntroTiles = [
  {
    eyebrow: "Personal Recipe",
    title: "A cup built from 5 functional shots",
    body: "Functional shots, flavor, strength, and sparkling options come together in one easy choice.",
    image: "/images/vrink/lifestyle/vrink-lifestyle-1198.jpg",
    alt: "A user drinking a VRINK beverage beside the station",
  },
  {
    eyebrow: "Fast Serving",
    title: "About 15 seconds for a 350ml cup",
    body: "The station is designed to keep drinks moving in offices, fitness centers, and busy events.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "Top view of the VRINK Zero Station dispensing area",
  },
  {
    eyebrow: "Station Design",
    title: "Choose and pour on one surface",
    body: "The tablet interface and dispenser sit together, so first-time users can follow the flow right away.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "VRINK Zero Station work surface and tablet stand",
  },
  {
    eyebrow: "Operation Care",
    title: "Ingredients, hygiene, and checks together",
    body: "VRINK helps define ingredient supply, consumables, hygiene checks, and ongoing care after installation.",
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
    title: "A drink station shaped around space operation",
    body: "VRINK connects drink service, visitor experience, and operation management in one flow.",
    image: "/images/vrink/news/vrink-news-consulting.jpg",
    alt: "VRINK consultation scene",
  },
  {
    title: "A station people can try on site",
    body: "At exhibitions, pop-ups, and company spaces, visitors can choose and taste their own drink.",
    image: "/images/vrink/news/vrink-news-booth.jpg",
    alt: "VRINK booth scene",
  },
];

const technologyItems = [
  {
    number: "01",
    title: "Sunflower Valve",
    body: "VRINK's core valve gathers multiple ingredient lines into one make point, so functional shots and flavors pour out reliably.",
  },
  {
    number: "02",
    title: "IV-style syrup replacement",
    body: "Operators swap ingredients fast and cleanly by hanging and connecting the ingredient pack, just like an IV bag.",
  },
];

const technologyVisualImages = [
  {
    src: "/images/vrink/technology/sunflower-valve.png",
    alt: "Sunflower Valve structure image",
    className: `${styles.technologyImage} ${styles.technologyImagePrimary}`,
  },
  {
    src: "/images/vrink/technology/iv-replacement.png",
    alt: "IV-style syrup replacement image",
    className: `${styles.technologyImage} ${styles.technologyImageSecondary}`,
  },
];

const fieldCards = [
  {
    title: "Office",
    body: "An always-on drink station for teams and visitors.",
    image: "/images/vrink/lifestyle/vrink-office.jpg",
    alt: "VRINK drink scene for office spaces",
  },
  {
    title: "Fitness",
    body: "Functional shot and hydration routines before and after workouts.",
    image: "/images/vrink/lifestyle/vrink-fitness.png",
    alt: "Users drinking VRINK beverages in a fitness space",
  },
  {
    title: "Events",
    body: "A hands-on drink moment visitors choose themselves.",
    image: "/images/vrink/news/ftimes-36836.jpg",
    alt: "VRINK event image",
  },
];

const features = [
  {
    title: "Choose on the tablet, pour right beside it",
    body: "Pick a purpose and flavor on the tablet, then receive the drink right next to it. First-time users follow the same easy flow.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "VRINK Zero Station top and tablet stand",
  },
  {
    title: "A 350ml cup in about 15 seconds",
    body: "An average 15-second make flow, based on 350ml, helps reduce waits in offices, fitness centers, and events.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "VRINK Zero Station top structure",
  },
  {
    title: "5 functional shots plus flavor",
    body: "Combine Booster, Vitamin, Relax, Cutting, and Amino shots with flavor, strength, and sparkling to fit your space.",
    image: "/images/vrink/lifestyle/vrink-lifestyle-1114.jpg",
    alt: "User holding two VRINK drinks",
  },
  {
    title: "Ingredient supply and checks together",
    body: "We plan ingredient supply, consumables, regular checks, and hygiene together so operation stays stable after install.",
    image: "/images/vrink/apple/vrink-product-back.png",
    alt: "Rear view of VRINK Zero Station",
  },
];

const serviceItems = [
  {
    icon: Headphones,
    title: "Setup planning",
    body: "We suggest a setup based on space goals and expected usage.",
  },
  {
    icon: Wrench,
    title: "Operation support",
    body: "Ingredient supply and consumable management are defined together.",
  },
  {
    icon: ShieldCheck,
    title: "Regular care",
    body: "We help keep hygiene and equipment condition stable over time.",
  },
];

const productSpecs = [
  {
    label: "What's included",
    values: ["Functional drink machine unit", "Lower cabinet for syrup and gas tanks"],
  },
  {
    label: "Operating hours",
    values: ["Runs 24 hours a day"],
  },
  {
    label: "Number of menus",
    values: ["Register and make dozens of menus"],
  },
  {
    label: "Make time",
    values: ["About 15 seconds per drink on average", "Based on a 350ml cup"],
  },
  {
    label: "Rated voltage",
    values: ["Sparkling water machine: AC220V / 60Hz / 0.7A", "Functional drink dispenser: DC24V / 5A"],
  },
  {
    label: "Output volume",
    values: ["About 2,000ml of sparkling water per pour", "Varies with water pressure"],
  },
  {
    label: "Cleaning",
    values: ["Semi-automatic cleaning"],
  },
  {
    label: "Menu customization",
    values: ["Adjustable syrup / base output", "Adjustable sparkling level", "0.1-second steps"],
  },
  {
    label: "Cooling temperature",
    values: ["2°C to 6°C"],
  },
  {
    label: "Country of origin",
    values: ["Republic of Korea"],
  },
];

const finalHighlights = [
  "15-second make time",
  "Approx. 1,792 combinations",
  "5 functional shots",
  "Custom ingredient setup",
  "Regular check support",
  "Office, fitness, and event setup",
];

export default function EnglishProductPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader locale="en" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>VRINK Zero Station</p>
          <h1>A 15-second smart drink station</h1>
          <span>
            Combine 5 functional shots with flavor, strength, and sparkling options, then manage ingredients in one flow.
          </span>
          <div className={styles.heroActions}>
            <Link href="/en#contact" className={styles.primaryButton}>
              Get a setup plan
            </Link>
            <Link href="#features" className={styles.linkButton}>
              View setup
            </Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <Image
            src={withBasePath("/images/vrink/apple/vrink-product-angle-b.png")}
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
            VRINK Zero Station brings selection, serving, and operation into one drink station.
            5 functional shots, flavor, strength, and sparkling options create the cup each space needs.
          </h2>
        </div>
        <div className={styles.productIntroGrid}>
          {productIntroTiles.map((tile, index) => (
            <article className={styles.productIntroTile} key={tile.title}>
              <Image
                src={withBasePath(tile.image)}
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
                  Get setup
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
          <h2 id="gallery-title">When VRINK enters a space, people get a drink moment to choose.</h2>
        </div>
        <div className={styles.galleryGrid}>
          {galleryMoments.map((moment) => (
            <figure className={styles.galleryItem} key={moment.image}>
              <Image src={withBasePath(moment.image)} alt={moment.alt} fill sizes="(max-width: 780px) 100vw, 33vw" />
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.proofSection} aria-labelledby="proof-title">
        <div className={styles.sectionHeading}>
          <p>Innovation</p>
          <h2 id="proof-title">A drink experience designed around space operation.</h2>
          <span>From exhibitions to real usage, VRINK makes personalized drinks easy to try.</span>
        </div>
        <div className={styles.proofGrid}>
          {proofStories.map((story) => (
            <article className={styles.proofCard} key={story.title}>
              <div className={styles.proofImage}>
                <Image src={withBasePath(story.image)} alt={story.alt} fill sizes="(max-width: 760px) 100vw, 38vw" />
              </div>
              <div>
                <h3>{story.title}</h3>
                <p>{story.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="technology" className={styles.technologySection} aria-labelledby="technology-title">
        <div className={styles.technologyHeader}>
          <p>Technology</p>
          <h2 id="technology-title">A structure that simplifies pouring and refills.</h2>
          <span>Core technology designed for reliable dispensing and easier operation.</span>
        </div>
        <div className={styles.technologyShowcase}>
          <div className={styles.technologyList}>
            {technologyItems.map((item) => (
              <article className={styles.technologyItem} key={item.title}>
                <p>{item.number}</p>
                <h3>{item.title}</h3>
                <span>{item.body}</span>
              </article>
            ))}
          </div>
          <div className={styles.technologyVisual}>
            {technologyVisualImages.map((image) => (
              <Image
                src={withBasePath(image.src)}
                alt={image.alt}
                className={image.className}
                fill
                key={image.src}
                sizes="(max-width: 980px) 100vw, 58vw"
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.fieldSection} aria-labelledby="field-title">
        <div className={styles.sectionHeading}>
          <p>Fields</p>
          <h2 id="field-title">Configured around one clear use case for each space.</h2>
        </div>
        <div className={styles.fieldGrid}>
          {fieldCards.map((field) => (
            <article className={styles.fieldCard} key={field.title}>
              <Image src={withBasePath(field.image)} alt={field.alt} fill sizes="(max-width: 760px) 100vw, 31vw" />
              <div>
                <h3>{field.title}</h3>
                <p>{field.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.featureStack} aria-label="VRINK product features">
        <div className={styles.mobileFeatureHeader}>
          <div className={styles.mobileFeatureTop}>
            <h2>VRINK ZERO STATION</h2>
            <Link href="/en#contact">Get setup</Link>
          </div>
          <nav className={styles.mobileFeatureNav} aria-label="Product detail menu">
            {mobileFeatureNav.map(([label, href], index) => (
              <Link href={href} key={label} aria-current={index === 0 ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.mobileFeatureStats} aria-label="Product key stats">
          {mobileFeatureStats.map((item) => (
            <div className={styles.mobileFeatureStat} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        {features.map((feature, index) => (
          <article className={styles.featureRow} key={feature.title}>
            <div className={styles.featureImage}>
              <Image src={withBasePath(feature.image)} alt={feature.alt} fill sizes="(max-width: 980px) 100vw, 52vw" />
            </div>
            <div className={styles.featureCopy}>
              <p>{String(index + 1).padStart(2, "0")}</p>
              <h2>{feature.title}</h2>
              <span>{feature.body}</span>
            </div>
          </article>
        ))}
      </section>

      <section id="specifications" className={styles.specSection} aria-labelledby="spec-title">
        <div className={styles.specInner}>
          <h2 id="spec-title">See product specs at a glance</h2>
          <div className={styles.specHeader}>
            <p>Product specs</p>
          </div>
          <div className={styles.specGrid}>
            {productSpecs.map((item) => (
              <article className={styles.specItem} key={item.label}>
                <h3>{item.label}</h3>
                <div>
                  {item.values.map((value) => (
                    <p key={value}>{value}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className={styles.specNote}>Specs and configuration may be adjusted based on the installation environment and operating conditions.</p>
        </div>
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
            src={withBasePath("/images/vrink/apple/vrink-product-angle-a.png")}
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
            <span>Pricing</span>
            <strong>On consultation</strong>
          </p>
          <Link href="/en#contact">Get setup</Link>
        </div>
      </section>

      <VrinkFooter ctaHref="/en#contact" locale="en" showCta={false} />
    </main>
  );
}
