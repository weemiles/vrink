"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vrinkCopy } from "@/content/vrink-copy";
import { buildLeadMailtoHref, isStaticExport } from "@/lib/static-export";
import { leadInquirySchema } from "@/lib/validation/lead";

type LeadFormProps = {
  locale?: "ko" | "en";
};

type FormFeedback = {
  type: "idle" | "success" | "error";
  message: string;
};

const initialFeedback: FormFeedback = {
  type: "idle",
  message: "",
};

const englishLeadForm = {
  title: "Start with three details",
  description: "Your organization or venue, name, and work email are enough to start.",
  submitLabel: "Request a setup recommendation",
  submittingLabel: "Submitting...",
  privacyNotice: "We’ll only use your details to review your request and follow up.",
  validationError: "Please check the required fields.",
  networkError: "A network error occurred. Please try again later.",
  fallbackError: "The inquiry could not be submitted.",
  fields: {
    company: "Organization or venue",
    name: "Name",
    email: "Work email",
  },
  placeholders: {
    company: "Organization or venue",
    name: "Your name",
    email: "name@company.com",
  },
};

export function LeadForm({ locale = "ko" }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FormFeedback>(initialFeedback);
  const copy = locale === "en" ? englishLeadForm : vrinkCopy.leadForm;

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
      phone: "",
      source: "website",
      message: "",
      honeypot: String(formData.get("honeypot") ?? ""),
    };

    const parsed = leadInquirySchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue =
        locale === "en"
          ? englishLeadForm.validationError
          : parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
      setFeedback({ type: "error", message: firstIssue });
      setIsSubmitting(false);
      return;
    }

    if (isStaticExport) {
      window.location.href = buildLeadMailtoHref(parsed.data, locale);
      setFeedback({
        type: "success",
        message:
          locale === "en"
            ? "An email draft has been opened for your inquiry."
            : "문의 메일 작성 화면을 열었습니다.",
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
        body: JSON.stringify(parsed.data),
      });

      const result = (await response.json()) as
        | { ok: true; message: string }
        | { ok: false; message: string };

      if (!response.ok || !result.ok) {
        setFeedback({
          type: "error",
          message:
            locale === "en"
              ? englishLeadForm.fallbackError
              : result.message ?? "문의 접수에 실패했습니다.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: locale === "en" ? "Your setup request has been submitted." : result.message,
      });
      form.reset();
    } catch {
      setFeedback({
        type: "error",
        message: locale === "en" ? englishLeadForm.networkError : "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div id="lead-form" className="rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
      <h3 className="text-h5">{copy.title}</h3>
      <p className="mt-2 text-body-2 text-[var(--text-muted)]">{copy.description}</p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="honeypot">Website</Label>
          <input id="honeypot" name="honeypot" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company">{copy.fields.company} *</Label>
            <Input
              id="company"
              name="company"
              placeholder={copy.placeholders.company}
              autoComplete="organization"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{copy.fields.name} *</Label>
            <Input id="name" name="name" placeholder={copy.placeholders.name} autoComplete="name" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{copy.fields.email} *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={copy.placeholders.email}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-3">
          <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
            {isSubmitting ? (locale === "en" ? englishLeadForm.submittingLabel : "접수 중...") : copy.submitLabel}
          </Button>
          <p className="text-caption text-[var(--text-subtle)]">{copy.privacyNotice}</p>
          <p
            className={
              feedback.type === "success"
                ? "text-body-2 text-green-700"
                : feedback.type === "error"
                  ? "text-body-2 text-red-600"
                  : "sr-only"
            }
            role="status"
            aria-live="polite"
          >
            {feedback.message}
          </p>
        </div>
      </form>
    </div>
  );
}
