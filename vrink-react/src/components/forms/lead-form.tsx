"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { vrinkCopy } from "@/content/vrink-copy";
import { leadInquirySchema } from "@/lib/validation/lead";

type FormFeedback = {
  type: "idle" | "success" | "error";
  message: string;
};

const initialFeedback: FormFeedback = {
  type: "idle",
  message: "",
};

export function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FormFeedback>(initialFeedback);

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
    };

    const parsed = leadInquirySchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
      setFeedback({ type: "error", message: firstIssue });
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
          message: result.message ?? "문의 접수에 실패했습니다.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: result.message,
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
    <div id="lead-form" className="rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
      <h3 className="text-h5">{vrinkCopy.leadForm.title}</h3>
      <p className="mt-2 text-body-2 text-[var(--text-muted)]">{vrinkCopy.leadForm.description}</p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="honeypot">Website</Label>
          <input id="honeypot" name="honeypot" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company">{vrinkCopy.leadForm.fields.company} *</Label>
            <Input id="company" name="company" placeholder={vrinkCopy.leadForm.placeholders.company} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{vrinkCopy.leadForm.fields.name} *</Label>
            <Input id="name" name="name" placeholder={vrinkCopy.leadForm.placeholders.name} required />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">{vrinkCopy.leadForm.fields.email} *</Label>
            <Input id="email" name="email" type="email" placeholder={vrinkCopy.leadForm.placeholders.email} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{vrinkCopy.leadForm.fields.phone} *</Label>
            <Input id="phone" name="phone" type="tel" placeholder={vrinkCopy.leadForm.placeholders.phone} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">{vrinkCopy.leadForm.fields.message} *</Label>
          <Textarea
            id="message"
            name="message"
            placeholder={vrinkCopy.leadForm.placeholders.message}
            className="min-h-32"
            required
          />
        </div>

        <div className="space-y-3">
          <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
            {isSubmitting ? "접수 중..." : vrinkCopy.leadForm.submitLabel}
          </Button>
          <p className="text-caption text-[var(--text-subtle)]">{vrinkCopy.leadForm.privacyNotice}</p>
          {feedback.type !== "idle" && (
            <p
              className={
                feedback.type === "success"
                  ? "text-body-2 text-green-700"
                  : "text-body-2 text-red-600"
              }
              role="status"
            >
              {feedback.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
