import { siteConfig } from "@/config/site";

type LeadMailtoPayload = {
  company: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source?: string;
};

export const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

export function withBasePath(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!basePath || !path.startsWith("/") || path.startsWith("//")) {
    return path;
  }

  return `${basePath}${path}`;
}

export function buildLeadMailtoHref(payload: LeadMailtoPayload, locale: "ko" | "en" = "ko") {
  const subject =
    locale === "en"
      ? `[VRINK] Consultation request from ${payload.company}`
      : `[브링크] ${payload.company} 도입 상담 문의`;
  const bodyLines = [
    locale === "en" ? "Consultation request" : "도입 상담 문의",
    "",
    `${locale === "en" ? "Company / Space" : "기업/공간"}: ${payload.company}`,
    `${locale === "en" ? "Name" : "담당자"}: ${payload.name}`,
    `${locale === "en" ? "Email" : "이메일"}: ${payload.email}`,
    `${locale === "en" ? "Phone" : "연락처"}: ${payload.phone}`,
    payload.source ? `Source: ${payload.source}` : "",
    "",
    locale === "en" ? "Message" : "상담 내용",
    payload.message,
  ].filter(Boolean);

  return `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    bodyLines.join("\n"),
  )}`;
}
