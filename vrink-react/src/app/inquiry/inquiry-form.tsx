"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import styles from "./page.module.css";

type Feedback = {
  type: "idle" | "success" | "error";
  message: string;
};

const initialFeedback: Feedback = {
  type: "idle",
  message: "",
};

const serviceOptions = [
  "설치/초기 세팅",
  "기기 이용",
  "음료 맛/품질",
  "원액/소모품",
  "정산/계약",
  "기타",
];

const issueTypes = [
  "기기가 정상 작동하지 않아요",
  "음료 맛이나 양이 평소와 달라요",
  "물이 새거나 주변이 젖어 있어요",
  "원액 또는 컵이 부족해요",
  "응대나 안내에 불편이 있었어요",
  "기타 불편사항",
];

const MAX_FILE_COUNT = 20;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 2000;

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function RequiredMark() {
  return (
    <em className={styles.requiredMark} aria-label="필수">
      *
    </em>
  );
}

export function InquiryForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(initialFeedback);
  const [selectedService, setSelectedService] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [messageLength, setMessageLength] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

  const totalFileBytes = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files],
  );

  useEffect(() => {
    if (!completionModalOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCompletionModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completionModalOpen]);

  const issueTypeHelp = useMemo(() => {
    if (!selectedIssueType) {
      return "상황에 가장 가까운 유형을 선택해 주세요.";
    }

    if (selectedIssueType.includes("기기")) {
      return "화면 오류 문구나 작동이 멈춘 시점을 함께 적어주시면 좋아요.";
    }

    if (selectedIssueType.includes("맛") || selectedIssueType.includes("양")) {
      return "선택한 음료 조합과 평소와 달랐던 점을 알려주세요.";
    }

    if (selectedIssueType.includes("물")) {
      return "물이 보인 위치와 발생 시점을 함께 남겨주세요.";
    }

    if (selectedIssueType.includes("원액") || selectedIssueType.includes("컵")) {
      return "부족한 소모품과 필요한 시점을 적어주세요.";
    }

    return "상황을 편하게 남겨주시면 담당자가 확인할게요.";
  }, [selectedIssueType]);

  function updateSelectedFiles(nextFiles: File[]) {
    const totalBytes = nextFiles.reduce((total, file) => total + file.size, 0);

    if (nextFiles.length > MAX_FILE_COUNT) {
      setFeedback({
        type: "error",
        message: `파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있어요.`,
      });
      return;
    }

    if (totalBytes > MAX_FILE_BYTES) {
      setFeedback({
        type: "error",
        message: "첨부파일 전체 용량은 100MB까지 가능해요.",
      });
      return;
    }

    setFiles(nextFiles);
    setFeedback(initialFeedback);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const pickedFiles = Array.from(event.target.files ?? []);
    updateSelectedFiles([...files, ...pickedFiles]);
    event.target.value = "";
  }

  function removeFile(index: number) {
    updateSelectedFiles(files.filter((_, fileIndex) => fileIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(initialFeedback);
    setCompletionModalOpen(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const privacyAgreed = formData.get("privacyAgreed") === "on";

    if (!privacyAgreed) {
      setFeedback({
        type: "error",
        message: "개인정보 수집 및 이용에 동의해 주세요.",
      });
      setIsSubmitting(false);
      return;
    }

    const centerName = getFormValue(formData, "centerName");
    const name = getFormValue(formData, "name");
    const email = getFormValue(formData, "email");
    const phone = getFormValue(formData, "phone");
    const message = getFormValue(formData, "message");
    const preferredContactTime = getFormValue(formData, "preferredContactTime");
    const honeypot = getFormValue(formData, "honeypot");

    if (!centerName || !name || !phone || !selectedService || !selectedIssueType || !message) {
      setFeedback({
        type: "error",
        message: "필수 항목을 모두 입력해 주세요.",
      });
      setIsSubmitting(false);
      return;
    }

    if (files.length > MAX_FILE_COUNT || totalFileBytes > MAX_FILE_BYTES) {
      setFeedback({
        type: "error",
        message: "첨부파일 개수와 용량을 다시 확인해 주세요.",
      });
      setIsSubmitting(false);
      return;
    }

    const submissionData = new FormData();
    submissionData.append("centerName", centerName);
    submissionData.append("name", name);
    submissionData.append("email", email);
    submissionData.append("phone", phone);
    submissionData.append("serviceArea", selectedService);
    submissionData.append("issueType", selectedIssueType);
    submissionData.append("message", message);
    submissionData.append("preferredContactTime", preferredContactTime);
    submissionData.append("honeypot", honeypot);
    files.forEach((file) => {
      submissionData.append("attachments", file);
    });

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        body: submissionData,
      });
      const result = (await response.json()) as
        | { ok: true; message: string }
        | { ok: false; message: string };

      if (!response.ok || !result.ok) {
        setFeedback({
          type: "error",
          message: result.message ?? "접수에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: "접수됐어요. 담당자가 확인 후 안내드릴게요.",
      });
      setCompletionModalOpen(true);
      form.reset();
      setSelectedService("");
      setSelectedIssueType("");
      setMessageLength(0);
      setFiles([]);
      setPrivacyOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setFeedback({
        type: "error",
        message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
      <input
        aria-hidden="true"
        autoComplete="off"
        className={styles.honeypot}
        name="honeypot"
        tabIndex={-1}
        type="text"
      />

      <section className={styles.formBlock}>
        <div className={styles.blockHeader}>
          <p>개인정보 동의</p>
          <h2>접수와 안내에 필요한 정보만 받을게요.</h2>
        </div>

        <div className={`${styles.privacyConsent} ${privacyOpen ? styles.privacyConsentOpen : ""}`}>
          <div className={styles.privacyConsentHeader}>
            <input
              id="privacyAgreed"
              name="privacyAgreed"
              required
              type="checkbox"
              aria-label="필수 개인정보 수집 및 이용 동의"
            />
            <button
              aria-controls="privacyConsentDetails"
              aria-expanded={privacyOpen}
              className={styles.privacyTitleButton}
              type="button"
              onClick={() => setPrivacyOpen((open) => !open)}
            >
              <span>[필수] 개인정보 수집·이용 동의</span>
              <ChevronDown aria-hidden="true" />
            </button>
          </div>

          {privacyOpen ? (
            <div className={styles.privacyDetails} id="privacyConsentDetails">
              <div className={styles.privacyDetailGroup}>
                <strong>필수 개인정보 수집·이용 동의</strong>
                <p>
                  고객님의 「불편신고」 접수 및 처리와 관련하여 고객님의
                  개인정보를 수집·이용하고자 하는 경우에는 개인정보보호법 등
                  관련 법령에 따라 고객님의 동의가 필요합니다.
                </p>
              </div>
              <div className={styles.privacyDetailGroup}>
                <strong>수집·이용 항목</strong>
                <p>
                  성명, 연락처, 이메일, 「불편신고」 접수 내용 및 고객의 상담 시
                  제공된 정보
                </p>
              </div>
              <div className={styles.privacyDetailGroup}>
                <strong>수집·이용목적</strong>
                <p>
                  「불편신고」 접수 및 처리를 위한 본인식별, 본인의사확인,
                  상담결과안내, 서비스 이용에 대한 통계
                </p>
              </div>
              <div className={styles.privacyDetailGroup}>
                <strong>보유 및 이용기간</strong>
                <p>
                  「불편신고」 접수 및 처리, 만족도 조사 등 업무목적
                  달성(수집일로부터 3년까지)시 까지 보유·이용
                  <br />
                  단, 다른 관련 법령에 해당하는 경우 해당 법령상의 보존기간을
                  따릅니다.
                </p>
              </div>
              <div className={styles.privacyDetailGroup}>
                <strong>거부 권리 및 불이익</strong>
                <p>
                  고객님은 개인정보 수집·이용을 거부할 권리가 있습니다. 다만, 위
                  개인정보 수집·이용에 관한 동의는 「불편신고」 접수 및 처리를
                  위한 필수사항으로 동의하셔야 접수 및 처리가 가능합니다.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.privacyNotice}>
          <AlertTriangle aria-hidden="true" />
          <span>
            접수 신청인의 정보를 입력해 주세요. 신청인이 확인되지 않으면 처리가
            지연될 수 있습니다.
          </span>
        </div>
      </section>

      <section className={styles.formBlock}>
        <div className={styles.blockHeader}>
          <p>접수 정보</p>
          <h2>연락받으실 정보를 입력해 주세요.</h2>
        </div>

        <div className={styles.fieldGrid}>
          <label>
            <span>
              센터명 <RequiredMark />
            </span>
            <input name="centerName" placeholder="예: 브링크 피트니스 강남점" required />
          </label>
          <label>
            <span>
              이름 <RequiredMark />
            </span>
            <input name="name" placeholder="담당자 성함" required />
          </label>
          <label>
            <span>
              휴대폰 번호 <RequiredMark />
            </span>
            <input
              inputMode="tel"
              name="phone"
              placeholder="010-0000-0000"
              required
              type="tel"
            />
          </label>
          <label>
            <span>이메일</span>
            <input
              inputMode="email"
              name="email"
              placeholder="hello@vrink.kr"
              type="email"
            />
          </label>
        </div>
      </section>

      <section className={styles.formBlock}>
        <div className={styles.blockHeader}>
          <p>불편사항</p>
          <h2>어떤 부분이 불편했는지 알려주세요.</h2>
        </div>

        <div className={styles.complaintRows}>
          <label className={styles.formRow}>
            <span className={styles.rowLabel}>
              이용 서비스 <RequiredMark />
            </span>
            <select
              name="serviceArea"
              required
              value={selectedService}
              onChange={(event) => setSelectedService(event.target.value)}
            >
              <option value="" disabled>
                이용 서비스 선택
              </option>
              {serviceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.formRow}>
            <span className={styles.rowLabel}>
              불편 유형 <RequiredMark />
            </span>
            <div className={styles.inputStack}>
              <select
                name="issueType"
                required
                value={selectedIssueType}
                onChange={(event) => setSelectedIssueType(event.target.value)}
              >
                <option value="" disabled>
                  불편 유형 선택
                </option>
                {issueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p>{issueTypeHelp}</p>
            </div>
          </label>

          <div className={styles.formRow}>
            <label className={styles.rowLabel} htmlFor="inquiry-message">
              상세 내용 <RequiredMark />
            </label>
            <div className={styles.detailField}>
              <textarea
                id="inquiry-message"
                maxLength={MAX_MESSAGE_LENGTH}
                name="message"
                onChange={(event) => setMessageLength(event.target.value.length)}
                placeholder={
                  "빠른 사실확인 및 안내를 위해 경위를 최대한 자세하게 작성해주세요.\n본문에 불건전 내용이나 욕설 등을 남기면 등록이 어려워요."
                }
                required
              />
              <span className={styles.charCount}>
                {messageLength}/{MAX_MESSAGE_LENGTH}자
              </span>
            </div>
          </div>

          <label className={styles.formRow}>
            <span className={styles.rowLabel}>연락 가능 시간</span>
            <input name="preferredContactTime" placeholder="예: 평일 오후 2시 이후" />
          </label>

          <div className={styles.formRow}>
            <span className={styles.rowLabel}>파일 첨부</span>
            <div className={styles.fileField}>
              <label className={styles.fileTrigger}>
                <span>파일 첨부</span>
                <Paperclip aria-hidden="true" />
                <input
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileChange}
                  type="file"
                />
              </label>
              <p>파일은 최대 20개, 100MB까지 첨부 가능합니다.</p>

              <div className={styles.fileList} aria-live="polite">
                {files.length === 0 ? (
                  <div className={styles.emptyFiles} aria-hidden="true" />
                ) : (
                  files.map((file, index) => (
                    <div className={styles.fileItem} key={`${file.name}-${file.size}-${index}`}>
                      <span>
                        {file.name}
                        <small>{formatFileSize(file.size)}</small>
                      </span>
                      <button
                        type="button"
                        aria-label={`${file.name} 삭제`}
                        onClick={() => removeFile(index)}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.fileMeter}>
                <strong>
                  {files.length}개({formatFileSize(totalFileBytes)})
                </strong>
                <span>
                  {" "}
                  / {MAX_FILE_COUNT}개(100MB)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.submitArea}>
        <Button className={styles.submitButton} disabled={isSubmitting} type="submit">
          {isSubmitting ? "접수 중..." : "접수하기"}
        </Button>
        {feedback.type !== "idle" ? (
          <p
            className={feedback.type === "success" ? styles.successText : styles.errorText}
            role="status"
          >
            {feedback.message}
          </p>
        ) : (
          <p>접수 후 담당자가 확인한 뒤 연락드릴게요.</p>
        )}
      </div>

      {completionModalOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={() => setCompletionModalOpen(false)}
        >
          <div
            aria-describedby="inquiry-complete-description"
            aria-labelledby="inquiry-complete-title"
            aria-modal="true"
            className={styles.completionModal}
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              aria-label="접수 완료 안내 닫기"
              className={styles.modalCloseButton}
              type="button"
              onClick={() => setCompletionModalOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
            <div className={styles.modalIcon}>
              <CheckCircle2 aria-hidden="true" />
            </div>
            <p>접수 완료</p>
            <h2 id="inquiry-complete-title">접수가 완료되었습니다.</h2>
            <span id="inquiry-complete-description">
              남겨주신 내용은 담당자가 확인한 뒤 순서대로 안내드릴게요.
            </span>
            <Button
              className={styles.modalConfirmButton}
              type="button"
              onClick={() => setCompletionModalOpen(false)}
            >
              확인
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
