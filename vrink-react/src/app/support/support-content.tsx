"use client";

import Link from "next/link";
import { ArrowRight, CircleHelp, MessageSquareWarning } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import styles from "./page.module.css";

type FaqGroup = {
  id: string;
  title: string;
  items: string[][];
};

type SupportContentProps = {
  faqGroups: FaqGroup[];
};

function subscribeToHashChange(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getFaqHashSnapshot() {
  return window.location.hash === "#faq";
}

function getServerFaqHashSnapshot() {
  return false;
}

export function SupportContent({ faqGroups }: SupportContentProps) {
  const faqHashActive = useSyncExternalStore(
    subscribeToHashChange,
    getFaqHashSnapshot,
    getServerFaqHashSnapshot,
  );
  const [faqRequested, setFaqRequested] = useState(false);
  const faqVisible = faqRequested || faqHashActive;
  const faqRef = useRef<HTMLElement>(null);

  function revealFaq() {
    setFaqRequested(true);
    window.history.replaceState(null, "", "#faq");
    window.requestAnimationFrame(() => {
      faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    if (faqVisible && window.location.hash === "#faq") {
      window.requestAnimationFrame(() => {
        faqRef.current?.scrollIntoView({ block: "start" });
      });
    }
  }, [faqVisible]);

  return (
    <>
      <section className={styles.choiceSection} aria-label="고객지원 선택">
        <div className={styles.choiceGrid}>
          <button
            type="button"
            className={styles.choiceCard}
            aria-controls="faq"
            aria-expanded={faqVisible}
            onClick={revealFaq}
          >
            <span className={styles.choiceIcon} aria-hidden="true">
              <CircleHelp />
            </span>
            <span className={styles.choiceEyebrow}>자주 묻는 질문</span>
            <strong>궁금한 내용을 먼저 확인할 수 있습니다.</strong>
            <span>
              도입, 설치, 운영, 위생 관리처럼 자주 묻는 질문을 빠르게 확인할 수 있습니다.
            </span>
            <em>
              질문 보기
              <ArrowRight aria-hidden="true" />
            </em>
          </button>

          <Link href="/inquiry" className={styles.choiceCard}>
            <span className={styles.choiceIcon} aria-hidden="true">
              <MessageSquareWarning />
            </span>
            <span className={styles.choiceEyebrow}>불편접수</span>
            <strong>이용 중 불편했던 점을 남길 수 있습니다.</strong>
            <span>
              기기 사용, 음료 품질, 설치나 운영 안내에 대한 내용을 담당자가 확인합니다.
            </span>
            <em>
              접수 작성하기
              <ArrowRight aria-hidden="true" />
            </em>
          </Link>
        </div>
      </section>

      {faqVisible ? (
        <section id="faq" className={styles.faqSection} ref={faqRef}>
          <div className={styles.faqShell}>
            {faqGroups.map((group) => (
              <section className={styles.faqGroup} id={group.id} key={group.id}>
                <div className={styles.groupHeader}>
                  <p>{group.title}</p>
                </div>
                <div className={styles.faqList}>
                  {group.items.map(([question, answer]) => (
                    <details key={question}>
                      <summary>
                        <span>Q. {question}</span>
                      </summary>
                      <p>{answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
