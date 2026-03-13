"use client";

import { LayoutGroup, motion } from "motion/react";
import { TextRotate } from "@/components/ui/text-rotate";
import { Gallery6 } from "@/components/ui/gallery6";

function Preview() {
    return (
        <div className="w-full flex-col text-2xl sm:text-3xl md:text-5xl flex items-center justify-center font-sans tracking-tight bg-white dark:text-muted text-foreground font-light py-24 sm:py-32 md:py-40">
            <LayoutGroup>
                <motion.p className="flex whitespace-pre mb-4 sm:mb-6" layout>
                    <motion.span
                        className="pt-0.5 sm:pt-1 md:pt-2 font-bold"
                        layout
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    >
                        브링크가 필요한 모든{" "}
                    </motion.span>
                    <TextRotate
                        texts={[
                            "순간에",
                            "오피스에",
                            "헬스장에",
                            "라운지에",
                            "행사장에",
                        ]}
                        mainClassName="text-white px-3 sm:px-4 md:px-5 bg-blue-600 overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-xl font-bold"
                        staggerFrom={"last"}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-120%" }}
                        staggerDuration={0.025}
                        splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        rotationInterval={2500}
                    />
                </motion.p>
            </LayoutGroup>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium max-w-2xl text-center px-4 mt-6">
                개인화된 커스터마이징 수분 섭취 솔루션. 고정된 레시피가 아닌, AI가 분석하고 반영하는 나만의 100% 무당(Sugar-Free) 스마트 드링크 시스템.
            </p>
        </div>
    );
}

const demoData = {
    heading: "맞춤형 프리미엄 기능성 샷",
    demoUrl: "https://www.vrink.kr",
    items: [
        {
            id: "item-1",
            title: "부스터 샷 (Booster Shot)",
            summary:
                "[에너지/집중] 운동 전이나 활력이 급격히 떨어질 때 빠르게 컨디션을 끌어올려 줍니다. (핵심 성분: 카페인, 아르기닌, 타우린)",
            url: "https://www.vrink.kr",
            image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2938&auto=format&fit=crop",
        },
        {
            id: "item-2",
            title: "스트레스 샷 (Stress Shot)",
            summary:
                "[긴장 완화/균형] 과한 자극 없이 몸과 마음의 밸런스를 되찾고 싶을 때 추천합니다. (핵심 성분: L-테아닌, 타우린)",
            url: "https://www.vrink.kr",
            image: "https://images.unsplash.com/photo-1544367568-7c85ba4b86bb?q=80&w=2675&auto=format&fit=crop",
        },
        {
            id: "item-3",
            title: "슬림 샷 (Slim Shot)",
            summary:
                "[체중/관리] 일상 속 가벼운 관리를 원할 때 부담 없이 섭취할 수 있습니다. (핵심 성분: L-카르니틴, 녹차추출물)",
            url: "https://www.vrink.kr",
            image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2906&auto=format&fit=crop",
        },
        {
            id: "item-4",
            title: "컨디션 샷 (Condition Shot)",
            summary:
                "[기초 영양/회복] 컨디션이 저하된 날 기초 영양을 빠르게 보충하여 몸의 리듬을 회복합니다. (핵심 성분: 비타민 C, 비타민 B군 복합체)",
            url: "https://www.vrink.kr",
            image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=2687&auto=format&fit=crop",
        },
        {
            id: "item-5",
            title: "리커버리 샷 (Recovery Shot)",
            summary:
                "[근육/밸런스] 운동 후 회복이나 지친 일상의 에너지 충전 시 최적의 영양을 공급합니다. (핵심 성분: 필수 아미노산 9종, 타우린)",
            url: "https://www.vrink.kr",
            image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop",
        },
    ],
};

function Gallery6Demo() {
    return (
        <>
            <Preview />
            <Gallery6 {...demoData} />
        </>
    );
}

export { Gallery6Demo };
