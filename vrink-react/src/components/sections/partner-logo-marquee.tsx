import Image from "next/image";
import type { CSSProperties } from "react";

import { withBasePath } from "@/lib/static-export";

import styles from "./partner-logo-marquee.module.css";

type Locale = "ko" | "en";

type PartnerLogo = {
  name: string;
  src: string;
  width: number;
  height: number;
  displayWidth: number;
};

const partnerLogos: PartnerLogo[] = [
  {
    name: "Able Gym Fitness",
    src: "/images/vrink/partners/ablegym.png",
    width: 997,
    height: 419,
    displayWidth: 190,
  },
  {
    name: "Build Up Fitness",
    src: "/images/vrink/partners/buildup-fitness.png",
    width: 376,
    height: 376,
    displayWidth: 84,
  },
  {
    name: "BYSEC World Fitness",
    src: "/images/vrink/partners/byzec-fitness.png",
    width: 419,
    height: 125,
    displayWidth: 178,
  },
  {
    name: "달려라 한의원",
    src: "/images/vrink/partners/dallyeora-hanui.png",
    width: 1528,
    height: 304,
    displayWidth: 260,
  },
  {
    name: "Double S Fitness",
    src: "/images/vrink/partners/double-s-fitness.png",
    width: 948,
    height: 515,
    displayWidth: 184,
  },
  {
    name: "West Gym Fitness Center",
    src: "/images/vrink/partners/westgym.png",
    width: 1274,
    height: 232,
    displayWidth: 238,
  },
  {
    name: "O Gym",
    src: "/images/vrink/partners/ogym.png",
    width: 380,
    height: 647,
    displayWidth: 76,
  },
  {
    name: "Hawkeye Gym",
    src: "/images/vrink/partners/hawkeye-gym.png",
    width: 738,
    height: 433,
    displayWidth: 170,
  },
  {
    name: "GYM90",
    src: "/images/vrink/partners/gym090.png",
    width: 1011,
    height: 253,
    displayWidth: 196,
  },
  {
    name: "Seoul Doctors",
    src: "/images/vrink/partners/seoul-doctors.png",
    width: 574,
    height: 303,
    displayWidth: 182,
  },
  {
    name: "Toss",
    src: "/images/vrink/partners/toss.png",
    width: 710,
    height: 250,
    displayWidth: 172,
  },
];

const copyByLocale: Record<Locale, { eyebrow: string; title: string; description: string; label: string }> = {
  ko: {
    eyebrow: "파트너 공간",
    title: "브링크를 선택한 공간들.",
    description: "피트니스, 병원, 웰니스 공간에서 15초 음료 경험을 함께 만들고 있습니다.",
    label: "브링크 파트너 및 설치 공간 로고",
  },
  en: {
    eyebrow: "Partner spaces",
    title: "Trusted by 50 clients within three months of launch.",
    description: "See the fitness, healthcare, and wellness spaces already working with VRINK.",
    label: "VRINK partner and installation space logos",
  },
};

const topRow = [
  partnerLogos[0],
  partnerLogos[2],
  partnerLogos[3],
  partnerLogos[9],
  partnerLogos[6],
  partnerLogos[8],
];

const bottomRow = [
  partnerLogos[5],
  partnerLogos[10],
  partnerLogos[1],
  partnerLogos[4],
  partnerLogos[7],
];

type PartnerLogoMarqueeProps = {
  locale?: Locale;
};

function LogoGroup({ logos }: { logos: PartnerLogo[] }) {
  return (
    <div className={styles.logoGroup}>
      {logos.map((logo) => {
        const logoStyle = {
          "--logo-width": `${logo.displayWidth}px`,
        } as CSSProperties;

        return (
          <div className={styles.logoItem} key={logo.name} style={logoStyle}>
            <Image
              alt=""
              className={styles.logoImage}
              height={logo.height}
              loading="eager"
              quality={94}
              src={withBasePath(logo.src)}
              width={logo.width}
            />
          </div>
        );
      })}
    </div>
  );
}

function LogoRow({ logos, reverse = false }: { logos: PartnerLogo[]; reverse?: boolean }) {
  return (
    <div className={styles.marqueeRow}>
      <div className={reverse ? `${styles.marqueeTrack} ${styles.marqueeTrackReverse}` : styles.marqueeTrack}>
        <LogoGroup logos={logos} />
        <LogoGroup logos={logos} />
      </div>
    </div>
  );
}

export function PartnerLogoMarquee({ locale = "ko" }: PartnerLogoMarqueeProps) {
  const copy = copyByLocale[locale];

  return (
    <section className={styles.section} aria-labelledby="partner-logo-title">
      <div className={styles.copy}>
        <p>{copy.eyebrow}</p>
        <h2 id="partner-logo-title">{copy.title}</h2>
        <span>{copy.description}</span>
      </div>

      <ul className={styles.visuallyHidden} aria-label={copy.label}>
        {partnerLogos.map((logo) => (
          <li key={logo.name}>{logo.name}</li>
        ))}
      </ul>

      <div className={styles.marqueeStage} aria-hidden="true">
        <LogoRow logos={topRow} />
        <LogoRow logos={bottomRow} reverse />
      </div>
    </section>
  );
}
