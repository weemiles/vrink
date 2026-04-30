import Image from "next/image";

import { withBasePath } from "@/lib/static-export";

import styles from "./page.module.css";

type SimpleCard = {
  title: string;
  image: string;
};

const figmaAsset = (fileName: string) => withBasePath(`/images/figma/15-182/${fileName}`);

const shopBySpace: SimpleCard[] = [
  { title: "Kitchen", image: figmaAsset("space-kitchen.jpg") },
  { title: "Bathroom", image: figmaAsset("space-bathroom.jpg") },
  { title: "Outdoor", image: figmaAsset("space-outdoor.jpg") },
  { title: "Shower", image: figmaAsset("space-shower.jpg") },
];

const collections: SimpleCard[] = [
  { title: "Zellige", image: figmaAsset("collection-zellige.jpg") },
  { title: "Cotto", image: figmaAsset("collection-cotto.jpg") },
  { title: "Terrazzo", image: figmaAsset("collection-terrazzo.jpg") },
  { title: "Marble", image: figmaAsset("collection-marble.jpg") },
];

const footerLinks = [
  "FAQ",
  "Trade",
  "Terms of Service",
  "Privacy Policy",
  "Accessibility",
  "Launch Accessibility Widget",
  "©ZIA · All Rights Reserved",
];

export default function Figma15182Page() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.headerTagline}>A Modern Home for an Ancient Art</p>
        <Image
          src={figmaAsset("header-logo.svg")}
          alt="Zia Tile"
          width={118}
          height={22}
          className={styles.headerLogo}
          priority
        />
        <nav className={styles.headerNav} aria-label="Main menu">
          <a href="#">Shop</a>
          <a href="#">Resources</a>
          <a href="#">Trade</a>
        </nav>
        <div className={styles.headerActions}>
          <a href="#">Account</a>
          <a href="#">Cart</a>
          <a href="#">Search</a>
        </div>
      </header>

      <section className={styles.heroSection}>
        <Image
          src={figmaAsset("hero-glass.jpg")}
          alt="Shattered pieces of transparent red glass scattered on a red tiled surface"
          fill
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroCopy}>
          <h1>GLASS WITH A PAST</h1>
          <p>INTRODUCING RECYCLED GLASS MOSAICS</p>
          <a href="#">SHOP THE LINE</a>
        </div>
      </section>

      <section className={styles.duoSection}>
        <article className={styles.duoCard}>
          <div className={styles.duoImageWrap}>
            <Image
              src={figmaAsset("duo-zellige.jpg")}
              alt="A kitchen corner with dark brown glossy mosaic tiles"
              fill
              sizes="(max-width: 1100px) 100vw, 50vw"
              className={styles.coverImage}
              loading="eager"
            />
          </div>
          <div className={styles.duoTextRow}>
            <h2>Zellige</h2>
            <div>
              <p>
                Handmade Moroccan zellige highlights natural variation and light-catching glazes.
                No two tiles are the same, yet together they form a rhythmic whole.
              </p>
              <a href="#">Shop Zellige</a>
            </div>
          </div>
        </article>

        <article className={styles.duoCard}>
          <div className={styles.duoImageWrap}>
            <Image
              src={figmaAsset("duo-cotto-allende.jpg")}
              alt="Four geometric tiles balancing against a warm brown background"
              fill
              sizes="(max-width: 1100px) 100vw, 50vw"
              className={styles.coverImage}
              loading="eager"
            />
          </div>
          <div className={styles.duoTextRow}>
            <h2>Cotto Allende</h2>
            <div>
              <p>
                Named for the historic city of San Miguel de Allende where we produce these
                hand-hewn tiles, our line of glazed terra cotta marks the evolution of our coveted
                Cotto line.
              </p>
              <a href="#">Shop Cotto Allende</a>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.spaceSection}>
        <h3>SHOP BY SPACE</h3>
        <div className={styles.fourGrid}>
          {shopBySpace.map((item) => (
            <article key={item.title} className={styles.gridCard}>
              <div className={styles.gridImageWrapTall}>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1100px) 100vw, 25vw"
                  className={styles.coverImage}
                  loading="eager"
                />
              </div>
              <h4>{item.title}</h4>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.bannerSection}>
        <Image
          src={figmaAsset("banner-antiquity.jpg")}
          alt="A brush uncovers a mosaic of small tiles in soil"
          fill
          sizes="100vw"
          className={styles.coverImage}
          loading="eager"
        />
        <div className={styles.bannerOverlay} />
        <div className={styles.bannerCopy}>
          <h3>UNCOVER THE ART OF ANTIQUITY</h3>
          <a href="#">Shop Roman Mosaics</a>
        </div>
      </section>

      <section className={styles.collectionSection}>
        <h3>Browse other tile collections</h3>
        <div className={styles.fourGrid}>
          {collections.map((item) => (
            <article key={item.title} className={styles.gridCard}>
              <div className={styles.gridImageWrapShort}>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1100px) 100vw, 25vw"
                  className={styles.coverImage}
                  loading="eager"
                />
              </div>
              <h4>{item.title}</h4>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.shareSection}>
        <h3>Share your space @zia_tile</h3>
        <div className={styles.shareGrid}>
          <article className={styles.shareMain}>
            <Image
              src={figmaAsset("share-main.jpg")}
              alt="Instagram tile main"
              fill
              sizes="(max-width: 1100px) 100vw, 50vw"
              className={styles.coverImage}
              loading="eager"
            />
            <Image
              src={figmaAsset("share-product-icon.svg")}
              alt=""
              width={20}
              height={20}
              className={styles.shareIcon}
            />
          </article>
          <article className={styles.shareSmall}>
            <Image
              src={figmaAsset("share-top-center.jpg")}
              alt="Instagram tile"
              fill
              sizes="(max-width: 1100px) 50vw, 25vw"
              className={styles.coverImage}
              loading="eager"
            />
            <Image
              src={figmaAsset("share-product-icon.svg")}
              alt=""
              width={20}
              height={20}
              className={styles.shareIcon}
            />
          </article>
          <article className={styles.shareSmall}>
            <Image
              src={figmaAsset("share-top-right.jpg")}
              alt="Instagram tile"
              fill
              sizes="(max-width: 1100px) 50vw, 25vw"
              className={styles.coverImage}
              loading="eager"
            />
            <Image
              src={figmaAsset("share-product-icon.svg")}
              alt=""
              width={20}
              height={20}
              className={styles.shareIcon}
            />
          </article>
          <article className={styles.shareSmall}>
            <Image
              src={figmaAsset("share-bottom-center.jpg")}
              alt="Instagram tile"
              fill
              sizes="(max-width: 1100px) 50vw, 25vw"
              className={styles.coverImage}
              loading="eager"
            />
            <Image
              src={figmaAsset("share-product-icon.svg")}
              alt=""
              width={20}
              height={20}
              className={styles.shareIcon}
            />
          </article>
          <article className={styles.shareSmall}>
            <Image
              src={figmaAsset("share-bottom-right.jpg")}
              alt="Instagram tile"
              fill
              sizes="(max-width: 1100px) 50vw, 25vw"
              className={styles.coverImage}
              loading="eager"
            />
            <Image
              src={figmaAsset("share-product-icon.svg")}
              alt=""
              width={20}
              height={20}
              className={styles.shareIcon}
            />
          </article>
        </div>
      </section>

      <section className={styles.seeMoreSection}>
        <a href="#" className={styles.seeMoreButton}>
          SEE MORE
        </a>
      </section>

      <section className={styles.footerGroupSection}>
        <a href="#">Frequently Asked Questions</a>
        <a href="#">Installation Guides</a>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <p>
            <span>Phone</span>
            <br />
            310-844-1170,
            <br />
            Ext. #1 General, Ext. #2 Trade
          </p>
          <p>
            <span>Email</span>
            <br />
            info@ziatile.com
          </p>
          <p>
            <span>Social</span>
            <br />
            PT / FB / IG
          </p>
        </div>

        <div className={styles.footerLinks}>
          {footerLinks.map((link) => (
            <a key={link} href="#">
              {link}
            </a>
          ))}
        </div>

        <div className={styles.footerDivider} />
      </footer>
    </main>
  );
}
