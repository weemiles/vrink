import { randomUUID } from "node:crypto";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

const MAX_FILE_COUNT = 20;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 2000;
const requestLog = new Map<string, number[]>();

type InquiryPayload = {
  centerName: string;
  name: string;
  email: string;
  phone: string;
  serviceArea: string;
  issueType: string;
  message: string;
  preferredContactTime: string;
  honeypot: string;
};

type AttachmentRecord = {
  name: string;
  size: number;
  type: string;
  location: string;
};

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const validAfter = now - env.leadRateLimitWindowMs;
  const recentRequests = (requestLog.get(key) ?? []).filter(
    (timestamp) => timestamp > validAfter,
  );

  if (recentRequests.length >= env.leadRateLimitMax) {
    requestLog.set(key, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestLog.set(key, recentRequests);
  return false;
}

function getRequesterIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getFormFiles(formData: FormData) {
  return formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .normalize("NFKC")
    .replace(/[^\w.\-가-힣()[\] ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);

  return sanitized || "attachment";
}

function validatePayload(payload: InquiryPayload, attachments: File[]) {
  if (payload.honeypot.length > 0) {
    return "";
  }

  if (
    !payload.centerName ||
    !payload.name ||
    !payload.phone ||
    !payload.serviceArea ||
    !payload.issueType ||
    !payload.message
  ) {
    return "필수 항목을 모두 입력해 주세요.";
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "이메일 형식이 올바르지 않습니다.";
  }

  if (!/^[0-9+\-\s()]+$/.test(payload.phone)) {
    return "휴대폰 번호 형식이 올바르지 않습니다.";
  }

  if (payload.message.length > MAX_MESSAGE_LENGTH) {
    return `상세 내용은 ${MAX_MESSAGE_LENGTH}자 이하로 입력해 주세요.`;
  }

  const totalBytes = attachments.reduce((total, file) => total + file.size, 0);

  if (attachments.length > MAX_FILE_COUNT) {
    return `파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있어요.`;
  }

  if (totalBytes > MAX_FILE_BYTES) {
    return "첨부파일 전체 용량은 100MB까지 가능해요.";
  }

  return "";
}

async function saveLocalLeadInquiry(
  payload: {
    company: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    source: string;
    honeypot: string;
  },
  request: NextRequest,
  ip: string,
) {
  const directory = path.join(process.cwd(), ".local-data");
  const file = path.join(directory, "lead-inquiries.jsonl");
  const record = {
    ...payload,
    client_ip: ip,
    user_agent: request.headers.get("user-agent") ?? "",
    created_at: new Date().toISOString(),
  };

  await mkdir(directory, { recursive: true });
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
}

async function saveGoogleSheetsLeadInquiry(
  payload: {
    company: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    source: string;
    honeypot: string;
  },
  request: NextRequest,
  ip: string,
) {
  // 불편접수는 전용 시트로, 그 외(도입문의)는 기존 시트로 분기 — 슬랙 알림이 섞이지 않도록 분리
  const isComplaint = payload.source === "complaint_inquiry";
  const webhookUrl = isComplaint ? env.inquirySheetsWebhookUrl : env.googleSheetsWebhookUrl;
  const webhookSecret = isComplaint
    ? env.inquirySheetsWebhookSecret
    : env.googleSheetsWebhookSecret;

  if (!webhookUrl || !webhookSecret) {
    return false;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      secret: webhookSecret,
      client_ip: ip,
      user_agent: request.headers.get("user-agent") ?? "",
      created_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("Google Sheets webhook request failed.");
  }

  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; message?: string }
    | null;

  if (result?.ok === false) {
    throw new Error(result.message ?? "Google Sheets webhook rejected the request.");
  }

  return true;
}

async function saveInquiryRecord(
  payload: {
    company: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    source: string;
    honeypot: string;
  },
  request: NextRequest,
  ip: string,
) {
  let saved = false;

  if (env.supabaseUrl && env.supabaseServiceRoleKey) {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("lead_inquiries").insert({
      company: payload.company,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      source: payload.source,
      client_ip: ip,
      user_agent: request.headers.get("user-agent") ?? "",
    });

    saved = !error;
  }

  if (!saved && process.env.NODE_ENV !== "production") {
    await saveLocalLeadInquiry(payload, request, ip);
    saved = true;
  }

  const savedToSheets = await saveGoogleSheetsLeadInquiry(payload, request, ip);

  return saved || savedToSheets;
}

async function saveLocalAttachments(requestId: string, attachments: File[]) {
  const directory = path.join(process.cwd(), ".local-data", "inquiry-attachments", requestId);
  await mkdir(directory, { recursive: true });

  const records: AttachmentRecord[] = [];

  for (const [index, attachment] of attachments.entries()) {
    const fileName = `${String(index + 1).padStart(2, "0")}-${sanitizeFileName(
      attachment.name,
    )}`;
    const filePath = path.join(directory, fileName);
    const buffer = Buffer.from(await attachment.arrayBuffer());

    await writeFile(filePath, buffer);
    records.push({
      name: attachment.name,
      size: attachment.size,
      type: attachment.type || "application/octet-stream",
      location: filePath,
    });
  }

  return records;
}

async function saveSupabaseAttachments(requestId: string, attachments: File[]) {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Attachment storage is not configured.");
  }

  const supabase = createServiceSupabaseClient();
  const records: AttachmentRecord[] = [];

  for (const [index, attachment] of attachments.entries()) {
    const storagePath = `${requestId}/${String(index + 1).padStart(2, "0")}-${sanitizeFileName(
      attachment.name,
    )}`;
    const buffer = Buffer.from(await attachment.arrayBuffer());
    const { error } = await supabase.storage
      .from(env.inquiryAttachmentBucket)
      .upload(storagePath, buffer, {
        contentType: attachment.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = await supabase.storage
      .from(env.inquiryAttachmentBucket)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

    records.push({
      name: attachment.name,
      size: attachment.size,
      type: attachment.type || "application/octet-stream",
      location: data?.signedUrl ?? storagePath,
    });
  }

  return records;
}

async function saveAttachments(requestId: string, attachments: File[]) {
  if (attachments.length === 0) {
    return [];
  }

  if (process.env.NODE_ENV !== "production") {
    return saveLocalAttachments(requestId, attachments);
  }

  return saveSupabaseAttachments(requestId, attachments);
}

function buildInquiryMessage(
  requestId: string,
  payload: InquiryPayload,
  attachments: AttachmentRecord[],
) {
  const attachmentLines =
    attachments.length > 0
      ? [
          "",
          "첨부파일",
          ...attachments.map(
            (attachment) =>
              `- ${attachment.name} (${formatBytes(attachment.size)}) ${attachment.location}`,
          ),
        ]
      : ["", "첨부파일: 없음"];

  return [
    "[브링크 불편접수]",
    "",
    `접수번호: ${requestId}`,
    `센터명: ${payload.centerName}`,
    `서비스 구분: ${payload.serviceArea}`,
    `불편 유형: ${payload.issueType}`,
    payload.email ? `이메일: ${payload.email}` : "이메일: 미입력",
    payload.preferredContactTime
      ? `연락 가능 시간: ${payload.preferredContactTime}`
      : "",
    "",
    "상세 내용",
    payload.message,
    ...attachmentLines,
  ]
    .filter(Boolean)
    .join("\n");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const payload: InquiryPayload = {
    centerName: getFormString(formData, "centerName"),
    name: getFormString(formData, "name"),
    email: getFormString(formData, "email"),
    phone: getFormString(formData, "phone"),
    serviceArea: getFormString(formData, "serviceArea"),
    issueType: getFormString(formData, "issueType"),
    message: getFormString(formData, "message"),
    preferredContactTime: getFormString(formData, "preferredContactTime"),
    honeypot: getFormString(formData, "honeypot"),
  };
  const attachments = getFormFiles(formData);

  if (payload.honeypot.length > 0) {
    return NextResponse.json({
      ok: true,
      message: "접수됐어요. 담당자가 확인 후 안내드릴게요.",
    });
  }

  const validationError = validatePayload(payload, attachments);
  if (validationError) {
    return NextResponse.json(
      { ok: false, message: validationError },
      { status: 400 },
    );
  }

  const ip = getRequesterIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, message: "요청이 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  try {
    const requestId = randomUUID();
    const attachmentRecords = await saveAttachments(requestId, attachments);
    const leadPayload = {
      company: payload.centerName,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      source: "complaint_inquiry",
      honeypot: payload.honeypot,
      message: buildInquiryMessage(requestId, payload, attachmentRecords),
    };
    const saved = await saveInquiryRecord(leadPayload, request, ip);

    if (!saved) {
      return NextResponse.json(
        {
          ok: false,
          message: "접수 저장 설정을 확인해 주세요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, message: "접수됐어요. 담당자가 확인 후 안내드릴게요." },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 },
    );
  }
}
