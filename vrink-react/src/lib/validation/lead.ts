import { z } from "zod";

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine(
    (value) => value.length === 0 || /^[0-9+\-\s()]+$/.test(value),
    "연락처 형식이 올바르지 않습니다.",
  )
  .default("");

export const leadInquirySchema = z.object({
  company: z.string().trim().min(2, "기업/단체명을 입력해주세요.").max(120),
  name: z.string().trim().min(2, "담당자 성함을 입력해주세요.").max(80),
  email: z.string().trim().email("유효한 이메일을 입력해주세요.").max(120),
  phone: optionalPhoneSchema,
  message: z.string().trim().max(2000).default(""),
  source: z.string().trim().min(1, "유입경로를 선택해주세요.").max(80).default("website"),
  honeypot: z.string().optional().default(""),
});

export type LeadInquiryInput = z.infer<typeof leadInquirySchema>;
