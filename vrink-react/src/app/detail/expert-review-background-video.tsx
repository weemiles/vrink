"use client";

import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

import styles from "./page.module.css";

type Locale = "ko" | "en";

type ExpertReviewBackgroundVideoProps = {
  poster: string;
  src: string;
  locale?: Locale;
};

const copy = {
  videoTitle: {
    ko: "영양사의 관점으로 본 브링크 배경 영상",
    en: "Background video of VRINK seen through a dietitian's eyes",
  },
} as const;

const endBufferSeconds = 4;

function getRandomStart(duration: number) {
  if (!Number.isFinite(duration) || duration <= endBufferSeconds) {
    return 0;
  }

  return Math.random() * Math.max(duration - endBufferSeconds, 0);
}

export function ExpertReviewBackgroundVideo({ poster, src, locale = "ko" }: ExpertReviewBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const playVideo = useCallback((video: HTMLVideoElement) => {
    video.muted = true;

    const playPromise = video.play();

    if (playPromise) {
      playPromise.catch(() => {
        // Muted background autoplay can still be blocked in low-power browser modes.
      });
    }
  }, []);

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      const video = event.currentTarget;
      const randomStart = getRandomStart(video.duration);

      if (randomStart > 0) {
        video.currentTime = randomStart;
      }

      playVideo(video);
    },
    [playVideo],
  );

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    playVideo(video);
  }, [playVideo]);

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      autoPlay
      className={styles.expertReviewBackgroundVideo}
      loop
      muted
      playsInline
      poster={poster}
      preload="auto"
      tabIndex={-1}
      title={copy.videoTitle[locale]}
      onLoadedMetadata={handleLoadedMetadata}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
