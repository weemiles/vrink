"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, TargetAndTransition, Transition, VariantLabels } from "motion/react";



interface TextRotateProps {
    texts: string[];
    mainClassName?: string;
    splitLevelClassName?: string;
    staggerFrom?: "first" | "last" | "center" | number;
    initial?: TargetAndTransition | VariantLabels;
    animate?: TargetAndTransition | VariantLabels;
    exit?: TargetAndTransition | VariantLabels;
    staggerDuration?: number;
    transition?: Transition;
    rotationInterval?: number;
}

export function TextRotate({
    texts,
    mainClassName = "",
    splitLevelClassName = "",
    staggerFrom = "last",
    initial = { y: "100%" },
    animate = { y: 0 },
    exit = { y: "-120%" },
    staggerDuration = 0.025,
    transition = { type: "spring", damping: 30, stiffness: 400 },
    rotationInterval = 2000,
}: TextRotateProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % texts.length);
        }, rotationInterval);
        return () => clearInterval(id);
    }, [texts.length, rotationInterval]);

    return (
        <div className={`relative flex items-center ${mainClassName}`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    className={`${splitLevelClassName} flex`}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={transition}
                >
                    {texts[index].split("").map((char, i) => (
                        <motion.span
                            key={i}
                            className="inline-block"
                            transition={{
                                ...transition,
                                delay:
                                    staggerFrom === "last"
                                        ? (texts[index].length - i) * staggerDuration
                                        : i * staggerDuration,
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </motion.span>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
