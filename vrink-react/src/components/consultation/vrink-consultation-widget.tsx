"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ChevronRight,
  Headphones,
  HeartHandshake,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";

import { buildLeadMailtoHref, isStaticExport } from "@/lib/static-export";
import styles from "./vrink-consultation-widget.module.css";

type Feedback = {
  type: "idle" | "success" | "error";
  message: string;
};

const initialFeedback: Feedback = {
  type: "idle",
  message: "",
};

export function VrinkConsultationWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(initialFeedback);
  const contactHref = pathname?.startsWith("/en")
    ? "/en#contact"
    : pathname === "/"
      ? "#contact"
      : "/support#inquiry";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(initialFeedback);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      company: String(formData.get("company") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      message: String(formData.get("message") ?? ""),
      honeypot: String(formData.get("honeypot") ?? ""),
      source: "consultation_widget",
    };

    if (isStaticExport) {
      window.location.href = buildLeadMailtoHref(payload);
      setFeedback({
        type: "success",
        message: "문의 메일 작성 화면을 열었습니다.",
      });
      form.reset();
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        setFeedback({
          type: "error",
          message: result.message ?? "상담 접수에 실패했습니다.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: result.message ?? "상담이 접수되었습니다.",
      });
      form.reset();
    } catch {
      setFeedback({
        type: "error",
        message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <aside className={styles.widget} aria-label="브링크 온라인 상담">
      {isOpen && (
        <div className={styles.panel} id="vrink-consultation-panel">
          <button
            className={styles.closeButton}
            type="button"
            aria-label="상담 패널 닫기"
            onClick={() => setIsOpen(false)}
          >
            <X aria-hidden="true" size={14} />
          </button>

          {!isFormOpen ? (
            <>
              <section className={styles.option}>
                <Headphones aria-hidden="true" className={styles.optionIcon} size={14} strokeWidth={1.8} />
                <div>
                  <h2>온라인 상담</h2>
                  <p>
                    월~금 10:00~19:00 (UTC+9)
                    <br />
                    점심 12:30~14:00 · 주말/공휴일 접수 가능
                  </p>
                  <button
                    className={styles.actionButton}
                    type="button"
                    onClick={() => {
                      setFeedback(initialFeedback);
                      setIsFormOpen(true);
                    }}
                  >
                    온라인 상담 시작하기
                    <ChevronRight aria-hidden="true" size={12} />
                  </button>
                </div>
              </section>

              <section className={styles.option}>
                <HeartHandshake aria-hidden="true" className={styles.optionIcon} size={14} strokeWidth={1.8} />
                <div>
                  <h2>도입 상담</h2>
                  <p>
                    설치 공간, 예상 사용 인원, 운영 목적을 남겨주시면
                    <br />
                    브링크 팀이 확인 후 연락드립니다.
                  </p>
                  <Link className={styles.actionButton} href={contactHref}>
                    문의 폼으로 이동
                    <ChevronRight aria-hidden="true" size={12} />
                  </Link>
                </div>
              </section>
            </>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.formHeader}>
                <Headphones aria-hidden="true" size={14} strokeWidth={1.8} />
                <div>
                  <h2>상담 접수</h2>
                  <p>남겨주신 내용은 브링크 팀이 확인 후 순차적으로 연락드립니다.</p>
                </div>
              </div>

              <div className={styles.hiddenField} aria-hidden="true">
                <label htmlFor="consultation-honeypot">Website</label>
                <input id="consultation-honeypot" name="honeypot" tabIndex={-1} autoComplete="off" />
              </div>

              <div className={styles.fieldGrid}>
                <label>
                  <span>기업/단체명</span>
                  <input name="company" placeholder="브링크 피트니스" required />
                </label>
                <label>
                  <span>담당자</span>
                  <input name="name" placeholder="홍길동" required />
                </label>
              </div>

              <div className={styles.fieldGrid}>
                <label>
                  <span>연락처</span>
                  <input name="phone" placeholder="010-0000-0000" required />
                </label>
                <label>
                  <span>이메일</span>
                  <input name="email" type="email" placeholder="hello@vrink.kr" required />
                </label>
              </div>

              <label className={styles.messageField}>
                <span>상담 내용</span>
                <textarea
                  name="message"
                  placeholder="설치 공간, 예상 사용 인원, 희망 상담 시간 등을 알려주세요."
                  required
                />
              </label>

              {feedback.type !== "idle" && (
                <p className={feedback.type === "success" ? styles.success : styles.error} role="status">
                  {feedback.message}
                </p>
              )}

              <div className={styles.formActions}>
                <button className={styles.secondaryButton} type="button" onClick={() => setIsFormOpen(false)}>
                  상담 안내 보기
                </button>
                <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "접수 중" : "상담 접수"}
                  <Send aria-hidden="true" size={12} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <button
        className={styles.floatingButton}
        type="button"
        aria-label={isOpen ? "상담 패널 접기" : "상담 패널 열기"}
        aria-controls="vrink-consultation-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Headphones aria-hidden="true" size={22} strokeWidth={1.9} />
      </button>
    </aside>
  );
}
