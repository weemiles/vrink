"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import styles from "./page.module.css";

type Locale = "ko" | "en";

type Feedback = {
  type: "idle" | "success" | "error";
  message: string;
};

type Option = {
  id: string;
  label: string;
};

const initialFeedback: Feedback = {
  type: "idle",
  message: "",
};

const MAX_FILE_COUNT = 20;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 2000;

const copyByLocale = {
  ko: {
    requiredLabel: "필수",
    serviceOptions: [
      { id: "setup", label: "설치/초기 세팅" },
      { id: "device", label: "기기 이용" },
      { id: "drink", label: "음료 맛/품질" },
      { id: "supplies", label: "원액/소모품" },
      { id: "billing", label: "정산/계약" },
      { id: "other", label: "기타" },
    ],
    issueTypes: [
      { id: "device", label: "기기가 정상 작동하지 않아요" },
      { id: "drink", label: "음료 맛이나 양이 평소와 달라요" },
      { id: "leak", label: "물이 새거나 주변이 젖어 있어요" },
      { id: "supplies", label: "원액 또는 컵이 부족해요" },
      { id: "guidance", label: "응대나 안내에 불편이 있었어요" },
      { id: "other", label: "기타 불편사항" },
    ],
    issueHelp: {
      empty: "상황에 가장 가까운 유형을 선택해 주세요.",
      device: "화면 오류 문구나 작동이 멈춘 시점을 함께 적어주시면 좋아요.",
      drink: "선택한 음료 조합과 평소와 달랐던 점을 알려주세요.",
      leak: "물이 보인 위치와 발생 시점을 함께 남겨주세요.",
      supplies: "부족한 소모품과 필요한 시점을 적어주세요.",
      fallback: "상황을 편하게 남겨주시면 담당자가 확인할게요.",
    },
    errors: {
      privacy: "개인정보 수집 및 이용에 동의해 주세요.",
      required: "필수 항목을 모두 입력해 주세요.",
      fileLimit: `파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있어요.`,
      fileSize: "첨부파일 전체 용량은 100MB까지 가능해요.",
      fileCheck: "첨부파일 개수와 용량을 다시 확인해 주세요.",
      fallback: "접수에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      network: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    },
    success: "접수됐어요. 담당자가 확인 후 안내드릴게요.",
    privacy: {
      eyebrow: "개인정보 동의",
      title: "접수 안내에 필요한 정보만 받아요.",
      checkboxLabel: "필수 개인정보 수집 및 이용 동의",
      buttonLabel: "[필수] 개인정보 수집·이용 동의",
      notice: "센터명, 이름, 연락처가 확인되면 더 빠르게 안내할 수 있습니다.",
      groups: [
        {
          title: "필수 개인정보 수집·이용 동의",
          body: "고객님의 「불편신고」 접수 및 처리와 관련하여 고객님의 개인정보를 수집·이용하고자 하는 경우에는 개인정보보호법 등 관련 법령에 따라 고객님의 동의가 필요합니다.",
        },
        {
          title: "수집·이용 항목",
          body: "성명, 연락처, 이메일, 「불편신고」 접수 내용 및 고객의 상담 시 제공된 정보",
        },
        {
          title: "수집·이용목적",
          body: "「불편신고」 접수 및 처리를 위한 본인식별, 본인의사확인, 상담결과안내, 서비스 이용에 대한 통계",
        },
        {
          title: "보유 및 이용기간",
          body: "「불편신고」 접수 및 처리, 만족도 조사 등 업무목적 달성(수집일로부터 3년까지)시 까지 보유·이용\n단, 다른 관련 법령에 해당하는 경우 해당 법령상의 보존기간을 따릅니다.",
        },
        {
          title: "거부 권리 및 불이익",
          body: "고객님은 개인정보 수집·이용을 거부할 권리가 있습니다. 다만, 위 개인정보 수집·이용에 관한 동의는 「불편신고」 접수 및 처리를 위한 필수사항으로 동의하셔야 접수 및 처리가 가능합니다.",
        },
      ],
    },
    contact: {
      eyebrow: "접수 정보",
      title: "센터명과 연락처를 먼저 알려주세요.",
      center: "센터명",
      centerPlaceholder: "예: 브링크 피트니스 강남점",
      name: "이름",
      namePlaceholder: "담당자 성함",
      phone: "휴대폰 번호",
      email: "이메일",
    },
    issue: {
      eyebrow: "불편사항",
      title: "가장 가까운 불편 유형을 고르세요.",
      service: "이용 서비스",
      servicePlaceholder: "이용 서비스 선택",
      type: "불편 유형",
      typePlaceholder: "불편 유형 선택",
      detail: "상세 내용",
      detailPlaceholder: "언제, 어디서, 어떤 일이 있었는지 적어주세요.\n화면 오류 문구나 음료 조합을 함께 남기면 확인이 빨라요.",
      contactTime: "연락 가능 시간",
      contactTimePlaceholder: "예: 평일 오후 2시 이후",
      file: "파일 첨부",
      fileButton: "파일 첨부",
      fileHelp: "파일은 최대 20개, 100MB까지 첨부 가능합니다.",
      deleteFile: (name: string) => `${name} 삭제`,
      countUnit: "개",
    },
    submit: {
      idle: "접수 남기기",
      loading: "접수 중...",
      help: "접수 후 담당자가 순서대로 확인해 연락드릴게요.",
    },
    modal: {
      closeLabel: "접수 완료 안내 닫기",
      eyebrow: "접수 완료",
      title: "접수가 완료되었습니다.",
      body: "남겨주신 내용은 담당자가 확인한 뒤 순서대로 안내드릴게요.",
      confirm: "확인",
    },
  },
  en: {
    requiredLabel: "required",
    serviceOptions: [
      { id: "setup", label: "Installation / initial setup" },
      { id: "device", label: "Device use" },
      { id: "drink", label: "Drink taste / quality" },
      { id: "supplies", label: "Ingredients / consumables" },
      { id: "billing", label: "Settlement / contract" },
      { id: "other", label: "Other" },
    ],
    issueTypes: [
      { id: "device", label: "The device is not operating normally" },
      { id: "drink", label: "The drink taste or amount is different" },
      { id: "leak", label: "Water is leaking or the area is wet" },
      { id: "supplies", label: "Ingredients or cups are running low" },
      { id: "guidance", label: "Service or guidance was inconvenient" },
      { id: "other", label: "Other issue" },
    ],
    issueHelp: {
      empty: "Choose the issue type that best matches the situation.",
      device: "Please include any on-screen error message and when the device stopped working.",
      drink: "Tell us the drink combination you selected and what felt different from usual.",
      leak: "Please share where you saw water and when it happened.",
      supplies: "Tell us which consumables are low and when they are needed.",
      fallback: "Describe the situation in your own words and our team will review it.",
    },
    errors: {
      privacy: "Please agree to the collection and use of personal information.",
      required: "Please complete all required fields.",
      fileLimit: `You can attach up to ${MAX_FILE_COUNT} files.`,
      fileSize: "The total attachment size can be up to 100MB.",
      fileCheck: "Please check the number and size of your attachments.",
      fallback: "We could not submit the report. Please try again later.",
      network: "A network error occurred. Please try again later.",
    },
    success: "Your report has been submitted. Our team will review it and follow up.",
    privacy: {
      eyebrow: "Privacy consent",
      title: "We only collect what we need to follow up.",
      checkboxLabel: "Required consent to collect and use personal information",
      buttonLabel: "[Required] Consent to collect and use personal information",
      notice: "Location, name, and contact details help us respond faster.",
      groups: [
        {
          title: "Required consent to collect and use personal information",
          body: "To receive and process your inconvenience report, VRINK needs your consent to collect and use personal information under applicable privacy laws.",
        },
        {
          title: "Information collected and used",
          body: "Name, contact details, email address, report contents, and information provided during customer consultation.",
        },
        {
          title: "Purpose of collection and use",
          body: "Identity verification, confirmation of intent, response guidance, report processing, and service-use statistics.",
        },
        {
          title: "Retention and use period",
          body: "Information is retained and used until the purpose of report handling and satisfaction review is fulfilled, up to 3 years from collection.\nIf another applicable law requires retention, that statutory period applies.",
        },
        {
          title: "Right to refuse and disadvantage",
          body: "You may refuse consent. However, this consent is required to receive and process an inconvenience report, so the report cannot be handled without it.",
        },
      ],
    },
    contact: {
      eyebrow: "Reporter information",
      title: "Start with the location and contact details.",
      center: "Center / location",
      centerPlaceholder: "Example: VRINK Fitness Gangnam",
      name: "Name",
      namePlaceholder: "Contact person",
      phone: "Mobile phone",
      email: "Email",
    },
    issue: {
      eyebrow: "Issue details",
      title: "Choose the issue type that fits best.",
      service: "Service area",
      servicePlaceholder: "Select a service area",
      type: "Issue type",
      typePlaceholder: "Select an issue type",
      detail: "Details",
      detailPlaceholder: "Tell us when, where, and what happened.\nAdding any screen error or drink combination helps us check faster.",
      contactTime: "Preferred contact time",
      contactTimePlaceholder: "Example: Weekdays after 2 PM",
      file: "Attachments",
      fileButton: "Attach files",
      fileHelp: "You can attach up to 20 files, 100MB total.",
      deleteFile: (name: string) => `Remove ${name}`,
      countUnit: "files",
    },
    submit: {
      idle: "Send report",
      loading: "Submitting...",
      help: "After submission, our team will review it in order and contact you.",
    },
    modal: {
      closeLabel: "Close completion notice",
      eyebrow: "Report submitted",
      title: "Your report has been submitted.",
      body: "Our team will review what you sent and follow up in order.",
      confirm: "OK",
    },
  },
} as const;

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function getOptionLabel(options: readonly Option[], selectedId: string) {
  return options.find((option) => option.id === selectedId)?.label ?? selectedId;
}

function RequiredMark({ locale }: { locale: Locale }) {
  return (
    <em className={styles.requiredMark} aria-label={copyByLocale[locale].requiredLabel}>
      *
    </em>
  );
}

export function InquiryForm({ locale = "ko" }: { locale?: Locale } = {}) {
  const copy = copyByLocale[locale];
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
      return copy.issueHelp.empty;
    }

    if (selectedIssueType === "device") {
      return copy.issueHelp.device;
    }

    if (selectedIssueType === "drink") {
      return copy.issueHelp.drink;
    }

    if (selectedIssueType === "leak") {
      return copy.issueHelp.leak;
    }

    if (selectedIssueType === "supplies") {
      return copy.issueHelp.supplies;
    }

    return copy.issueHelp.fallback;
  }, [copy, selectedIssueType]);

  function updateSelectedFiles(nextFiles: File[]) {
    const totalBytes = nextFiles.reduce((total, file) => total + file.size, 0);

    if (nextFiles.length > MAX_FILE_COUNT) {
      setFeedback({
        type: "error",
        message: copy.errors.fileLimit,
      });
      return;
    }

    if (totalBytes > MAX_FILE_BYTES) {
      setFeedback({
        type: "error",
        message: copy.errors.fileSize,
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
        message: copy.errors.privacy,
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
        message: copy.errors.required,
      });
      setIsSubmitting(false);
      return;
    }

    if (files.length > MAX_FILE_COUNT || totalFileBytes > MAX_FILE_BYTES) {
      setFeedback({
        type: "error",
        message: copy.errors.fileCheck,
      });
      setIsSubmitting(false);
      return;
    }

    const submissionData = new FormData();
    submissionData.append("centerName", centerName);
    submissionData.append("name", name);
    submissionData.append("email", email);
    submissionData.append("phone", phone);
    submissionData.append("serviceArea", getOptionLabel(copy.serviceOptions, selectedService));
    submissionData.append("issueType", getOptionLabel(copy.issueTypes, selectedIssueType));
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
          message: result.message ?? copy.errors.fallback,
        });
        return;
      }

      setFeedback({
        type: "success",
        message: locale === "en" ? copy.success : result.message,
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
        message: copy.errors.network,
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
          <p>{copy.privacy.eyebrow}</p>
          <h2>{copy.privacy.title}</h2>
        </div>

        <div className={`${styles.privacyConsent} ${privacyOpen ? styles.privacyConsentOpen : ""}`}>
          <div className={styles.privacyConsentHeader}>
            <input
              id="privacyAgreed"
              name="privacyAgreed"
              required
              type="checkbox"
              aria-label={copy.privacy.checkboxLabel}
            />
            <button
              aria-controls="privacyConsentDetails"
              aria-expanded={privacyOpen}
              className={styles.privacyTitleButton}
              type="button"
              onClick={() => setPrivacyOpen((open) => !open)}
            >
              <span>{copy.privacy.buttonLabel}</span>
              <ChevronDown aria-hidden="true" />
            </button>
          </div>

          {privacyOpen ? (
            <div className={styles.privacyDetails} id="privacyConsentDetails">
              {copy.privacy.groups.map((group) => (
                <div className={styles.privacyDetailGroup} key={group.title}>
                  <strong>{group.title}</strong>
                  {group.body.split("\n").map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.privacyNotice}>
          <AlertTriangle aria-hidden="true" />
          <span>{copy.privacy.notice}</span>
        </div>
      </section>

      <section className={styles.formBlock}>
        <div className={styles.blockHeader}>
          <p>{copy.contact.eyebrow}</p>
          <h2>{copy.contact.title}</h2>
        </div>

        <div className={styles.fieldGrid}>
          <label>
            <span>
              {copy.contact.center} <RequiredMark locale={locale} />
            </span>
            <input name="centerName" placeholder={copy.contact.centerPlaceholder} required />
          </label>
          <label>
            <span>
              {copy.contact.name} <RequiredMark locale={locale} />
            </span>
            <input name="name" placeholder={copy.contact.namePlaceholder} required />
          </label>
          <label>
            <span>
              {copy.contact.phone} <RequiredMark locale={locale} />
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
            <span>{copy.contact.email}</span>
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
          <p>{copy.issue.eyebrow}</p>
          <h2>{copy.issue.title}</h2>
        </div>

        <div className={styles.complaintRows}>
          <label className={styles.formRow}>
            <span className={styles.rowLabel}>
              {copy.issue.service} <RequiredMark locale={locale} />
            </span>
            <select
              name="serviceArea"
              required
              value={selectedService}
              onChange={(event) => setSelectedService(event.target.value)}
            >
              <option value="" disabled>
                {copy.issue.servicePlaceholder}
              </option>
              {copy.serviceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.formRow}>
            <span className={styles.rowLabel}>
              {copy.issue.type} <RequiredMark locale={locale} />
            </span>
            <div className={styles.inputStack}>
              <select
                name="issueType"
                required
                value={selectedIssueType}
                onChange={(event) => setSelectedIssueType(event.target.value)}
              >
                <option value="" disabled>
                  {copy.issue.typePlaceholder}
                </option>
                {copy.issueTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p>{issueTypeHelp}</p>
            </div>
          </label>

          <div className={styles.formRow}>
            <label className={styles.rowLabel} htmlFor="inquiry-message">
              {copy.issue.detail} <RequiredMark locale={locale} />
            </label>
            <div className={styles.detailField}>
              <textarea
                id="inquiry-message"
                maxLength={MAX_MESSAGE_LENGTH}
                name="message"
                onChange={(event) => setMessageLength(event.target.value.length)}
                placeholder={copy.issue.detailPlaceholder}
                required
              />
              <span className={styles.charCount}>
                {messageLength}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>

          <label className={styles.formRow}>
            <span className={styles.rowLabel}>{copy.issue.contactTime}</span>
            <input name="preferredContactTime" placeholder={copy.issue.contactTimePlaceholder} />
          </label>

          <div className={styles.formRow}>
            <span className={styles.rowLabel}>{copy.issue.file}</span>
            <div className={styles.fileField}>
              <label className={styles.fileTrigger}>
                <span>{copy.issue.fileButton}</span>
                <Paperclip aria-hidden="true" />
                <input
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileChange}
                  type="file"
                />
              </label>
              <p>{copy.issue.fileHelp}</p>

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
                        aria-label={copy.issue.deleteFile(file.name)}
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
                  {files.length}
                  {locale === "ko" ? copy.issue.countUnit : ` ${copy.issue.countUnit}`}({formatFileSize(totalFileBytes)})
                </strong>
                <span>
                  {" "}
                  / {MAX_FILE_COUNT}
                  {locale === "ko" ? copy.issue.countUnit : ` ${copy.issue.countUnit}`}(100MB)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.submitArea}>
        <Button className={styles.submitButton} disabled={isSubmitting} type="submit">
          {isSubmitting ? copy.submit.loading : copy.submit.idle}
        </Button>
        {feedback.type !== "idle" ? (
          <p
            className={feedback.type === "success" ? styles.successText : styles.errorText}
            role="status"
          >
            {feedback.message}
          </p>
        ) : (
          <p>{copy.submit.help}</p>
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
              aria-label={copy.modal.closeLabel}
              className={styles.modalCloseButton}
              type="button"
              onClick={() => setCompletionModalOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
            <div className={styles.modalIcon}>
              <CheckCircle2 aria-hidden="true" />
            </div>
            <p>{copy.modal.eyebrow}</p>
            <h2 id="inquiry-complete-title">{copy.modal.title}</h2>
            <span id="inquiry-complete-description">{copy.modal.body}</span>
            <Button
              className={styles.modalConfirmButton}
              type="button"
              onClick={() => setCompletionModalOpen(false)}
            >
              {copy.modal.confirm}
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
