import { z } from "zod";

export const leadInquirySchema = z.object({
  company: z.string().trim().min(2, "기업/단체명을 입력해주세요.").max(120),
  name: z.string().trim().min(2, "담당자 성함을 입력해주세요.").max(80),
  email: z.string().trim().email("유효한 이메일을 입력해주세요.").max(120),
  phone: z
    .string()
    .trim()
    .min(8, "연락처를 입력해주세요.")
    .max(30)
    .regex(/^[0-9+\-\s()]+$/, "연락처 형식이 올바르지 않습니다."),
  message: z.string().trim().min(10, "문의 내용을 입력해주세요.").max(2000),
  source: z.string().trim().max(80).optional().default("website"),
  honeypot: z.string().optional().default(""),
});

export type LeadInquiryInput = z.infer<typeof leadInquirySchema>;
