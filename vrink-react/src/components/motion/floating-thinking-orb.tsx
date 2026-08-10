"use client";

import { MODE_DRAWS, resolvePreset, type OrbState } from "thinking-orbs";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import styles from "./floating-thinking-orb.module.css";

type FloatingThinkingOrbProps = {
  delay?: number;
  state: OrbState;
};

export function FloatingThinkingOrb({ delay = 0, state }: FloatingThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const presetSize = 64;
  const size = 120;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);

    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = Math.round(size * pixelRatio);
    canvas.height = Math.round(size * pixelRatio);

    const { mode, speed, opts } = resolvePreset(state, presetSize);
    const drawMode = MODE_DRAWS[mode];
    const drawFrame = (time: number) => {
      const renderScale = size / presetSize;

      context.setTransform(pixelRatio * renderScale, 0, 0, pixelRatio * renderScale, 0, 0);
      context.clearRect(0, 0, size, size);
      drawMode(context, presetSize, time, true, opts);
    };

    if (reduceMotion) {
      drawFrame(0.6);
      return;
    }

    let animationFrame = 0;
    let isVisible = true;
    let isRunning = false;

    const stop = () => {
      isRunning = false;
      window.cancelAnimationFrame(animationFrame);
    };
    const tick = () => {
      drawFrame((performance.now() / 1000) * speed * 0.42);

      if (isRunning) animationFrame = window.requestAnimationFrame(tick);
    };
    const start = () => {
      if (isRunning || !isVisible || document.visibilityState === "hidden") return;

      isRunning = true;
      animationFrame = window.requestAnimationFrame(tick);
    };
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible) start();
          else stop();
        });
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };

    drawFrame((performance.now() / 1000) * speed * 0.42);
    observer?.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      stop();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reduceMotion, state]);

  const style = {
    "--orb-float-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <div aria-hidden="true" className={styles.orb} data-state={state} style={style}>
      <canvas className={styles.canvas} height={size} ref={canvasRef} width={size} />
    </div>
  );
}
