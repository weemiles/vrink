"use client";

import { ThinkingOrb, type OrbState } from "thinking-orbs";
import type { CSSProperties } from "react";

import styles from "./floating-thinking-orb.module.css";

type FloatingThinkingOrbProps = {
  delay?: number;
  state: OrbState;
};

export function FloatingThinkingOrb({ delay = 0, state }: FloatingThinkingOrbProps) {
  const style = {
    "--orb-float-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <div aria-hidden="true" className={styles.orb} style={style}>
      <ThinkingOrb state={state} size={64} speed={0.65} theme="dark" />
    </div>
  );
}
