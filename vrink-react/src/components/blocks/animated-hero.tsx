"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(() => ["정밀한", "빠른", "과학적인", "프리미엄한", "미니멀한"], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-8 py-20 lg:py-32 flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-3">
              Product Launch Note <MoveRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tight text-center font-semibold leading-[1.05]">
              <span className="text-[var(--text-muted)]">This is an app for</span>
              <span className="relative flex min-h-[1.2em] w-full justify-center overflow-hidden text-center md:pb-2 md:pt-1">
                {titles.map((title, index) => (
                  <motion.span
                    key={title}
                    className="absolute font-semibold text-[var(--text-strong)]"
                    initial={{ opacity: 0, y: "-100%" }}
                    transition={{ type: "spring", stiffness: 55 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title} 팀.
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-3xl text-center">
              업무 툴이 늘어날수록 팀 실행 속도는 느려집니다. 이 페이지는 분산된 워크플로를 하나의 앱 경험으로
              통합해 더 적은 회의로 더 많은 실행을 만드는 방식을 소개합니다.
            </p>
          </div>

          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-3" variant="outline">
              데모 요청 <PhoneCall className="h-4 w-4" />
            </Button>
            <Button size="lg" className="gap-3">
              무료로 시작 <MoveRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
