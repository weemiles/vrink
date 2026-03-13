"use client";

import type { ReactNode } from "react";
import { Bolt, CircleHelp, Settings2, ShieldCheck, Sparkles } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  icon: ReactNode;
};

interface AccordionFeatureSectionProps {
  id?: string;
  className?: string;
  heading?: string;
  description?: string;
  faqs?: FaqItem[];
}

const defaultFaqs: FaqItem[] = [
  {
    id: 1,
    question: "도입 후 운영 설정은 얼마나 걸리나요?",
    answer:
      "기본 템플릿 기준으로 당일 설정이 가능하며, 브랜드/공간 맞춤 시나리오까지 포함해도 일반적으로 3영업일 내 오픈할 수 있습니다.",
    icon: <Bolt className="size-4" aria-hidden />,
  },
  {
    id: 2,
    question: "여러 지점을 한 번에 관리할 수 있나요?",
    answer:
      "가능합니다. 지점별 재고/사용량/장애 알림을 한 화면에서 확인하고, 운영 정책을 공통 또는 지점별로 분리해 적용할 수 있습니다.",
    icon: <Settings2 className="size-4" aria-hidden />,
  },
  {
    id: 3,
    question: "브랜드 맞춤 UI/콘텐츠 변경은 어디까지 되나요?",
    answer:
      "화면 테마, 문구, 메뉴 구조, 캠페인 슬롯까지 커스터마이징할 수 있으며, 시즌/행사 단위로 예약 배포도 지원합니다.",
    icon: <Sparkles className="size-4" aria-hidden />,
  },
  {
    id: 4,
    question: "기존 운영 시스템과 연동이 필요한데 가능한가요?",
    answer:
      "API 기반 연동이 가능하며, 필요 시 CSV/정기 배치 방식도 지원합니다. 기존 프로세스를 크게 바꾸지 않고 단계적으로 이전할 수 있습니다.",
    icon: <CircleHelp className="size-4" aria-hidden />,
  },
  {
    id: 5,
    question: "보안과 권한 관리는 어떻게 제공되나요?",
    answer:
      "역할 기반 권한, 감사 로그, 전송/저장 구간 암호화를 기본 제공하며, 조직 정책에 맞춘 접근 제어 시나리오를 설정할 수 있습니다.",
    icon: <ShieldCheck className="size-4" aria-hidden />,
  },
];

export function AccordionFeatureSection({
  id,
  className,
  heading = "Built to cover your needs",
  description = "도입 전 가장 많이 받는 질문을 정리했습니다. 필요한 답변을 빠르게 확인해보세요.",
  faqs = defaultFaqs,
}: AccordionFeatureSectionProps) {
  return (
    <section id={id} className={cn("relative z-10 py-16 md:py-32", className)}>
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">{heading}</h2>
          <p className="mt-4 text-muted-foreground">{description}</p>
        </div>

        <Accordion type="single" collapsible defaultValue={`item-${faqs[0]?.id ?? 1}`} className="mx-auto mt-8 max-w-3xl space-y-4 md:mt-16">
          {faqs.map((faq) => (
            <Card key={faq.id} className="border-0 bg-muted shadow-none">
              <AccordionItem value={`item-${faq.id}`} className="border-b-0">
                <AccordionTrigger className="px-6 py-5 !no-underline hover:no-underline">
                  <div className="flex items-center gap-4 text-left">
                    <FaqDecorator>{faq.icon}</FaqDecorator>
                    <h3 className="text-base font-medium text-foreground md:text-lg">{faq.question}</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-0">
                  <p className="pl-16 text-sm leading-7 text-muted-foreground md:text-base">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

const FaqDecorator = ({ children }: { children: ReactNode }) => (
  <div
    aria-hidden
    className="relative size-12 shrink-0 rounded-md [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"
  >
    <div className="absolute inset-0 [--border:black] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:12px_12px] opacity-10 dark:[--border:white]" />
    <div className="bg-background absolute inset-0 m-auto flex size-7 items-center justify-center rounded-sm border-t border-l">
      {children}
    </div>
  </div>
);
